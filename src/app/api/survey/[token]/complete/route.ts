import { prisma } from "@/lib/prisma";
import { ok, notFound, badRequest, err, tooManyRequests } from "@/lib/api";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { createDealFromSurvey } from "@/lib/create-deal-from-survey";
import type { ExtractedSurveyData } from "@/types/survey";

// POST: Finalize the survey, create Deal + LeaseOption, compute ROI
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const rl = checkRateLimit(`survey:${token}`, RATE_LIMITS.survey);
  if (!rl.allowed) return tooManyRequests(rl.retryAfterMs);

  const client = await prisma.client.findUnique({
    where: { token },
    include: {
      surveySession: true,
      industryProfile: { select: { id: true } },
      deals: {
        where: { sourceType: { in: ["AI_SURVEY", "STATIC"] } },
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { id: true },
      },
    },
  });

  if (!client) return notFound("Survey");

  // If already completed, return existing data instead of 409 error
  // This handles race conditions from rapid double-clicks
  if (client.questionnaireCompletedAt) {
    const existingDeal = client.deals[0];
    if (existingDeal) {
      return ok({
        dealId: existingDeal.id,
        token,
        roiOutputs: client.industryProfile
          ? await prisma.industryProfile.findUnique({
              where: { clientId: client.id },
              select: { roiOutputs: true },
            }).then((ip) => ip?.roiOutputs ?? null)
          : null,
      });
    }
    // Edge case: completed flag set but no deal — allow re-creation
  }

  const session = client.surveySession;
  if (!session) return badRequest("No survey session found.");

  const data = (session.extractedData as ExtractedSurveyData) ?? {};

  // Validate minimum required data
  if (!data.headcount || !data.industry) {
    return badRequest("Survey is incomplete. Industry and headcount are required.");
  }

  try {
    const result = await createDealFromSurvey({
      clientId: client.id,
      clientUserId: client.userId,
      clientName: client.name,
      data: {
        industry: data.industry,
        companyName: data.companyName,
        headcount: data.headcount,
        projectedHeadcount12mo: data.projectedHeadcount12mo,
        annualRevenue: data.annualRevenue,
        revenuePerEmployee: data.revenuePerEmployee,
        projectedRevenueGrowth: data.projectedRevenueGrowth,
        sfPerEmployee: data.sfPerEmployee,
        budgetConstraint: data.budgetConstraint,
        primaryGoal: data.primaryGoal,
        criticalAmenities: data.criticalAmenities,
        expansionTimeline: data.expansionTimeline,
        currentEmployeeTurnover: data.currentEmployeeTurnover,
        avgEmployeeSalary: data.avgEmployeeSalary,
        industryInputs: data.industryInputs,
        leasePreferences: data.leasePreferences,
        currentLease: data.currentLease,
      },
      sourceType: "AI_SURVEY",
      dealNameSuffix: "AI Survey Analysis",
      surveySessionId: session.id,
    });

    return ok({
      dealId: result.dealId,
      token,
      roiOutputs: result.roiOutputs,
    });
  } catch (e) {
    // If a concurrent request already created the records (unique constraint),
    // return the existing data gracefully
    const errMsg = e instanceof Error ? e.message : String(e);
    const isUniqueViolation =
      errMsg.includes("Unique constraint") ||
      errMsg.includes("unique constraint") ||
      errMsg.includes("duplicate key") ||
      errMsg.includes("P2002");
    if (isUniqueViolation) {
      // Re-fetch: the other request likely succeeded
      const refreshed = await prisma.client.findUnique({
        where: { token },
        include: {
          industryProfile: { select: { roiOutputs: true } },
          deals: {
            where: { sourceType: { in: ["AI_SURVEY", "STATIC"] } },
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { id: true },
          },
        },
      });
      if (refreshed?.deals[0]) {
        return ok({
          dealId: refreshed.deals[0].id,
          token,
          roiOutputs: refreshed.industryProfile?.roiOutputs ?? null,
        });
      }
    }

    console.error("[survey/complete] Error creating deal:", e);
    return err("Failed to generate ROI analysis. Please try again.", 500);
  }
}
