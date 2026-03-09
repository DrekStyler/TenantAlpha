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
    include: { surveySession: true },
  });

  if (!client) return notFound("Survey");
  if (client.questionnaireCompletedAt) {
    return err("This survey has already been completed.", 409);
  }

  const session = client.surveySession;
  if (!session) return badRequest("No survey session found.");

  const data = (session.extractedData as ExtractedSurveyData) ?? {};

  // Validate minimum required data
  if (!data.headcount || !data.industry) {
    return badRequest("Survey is incomplete. Industry and headcount are required.");
  }

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
}
