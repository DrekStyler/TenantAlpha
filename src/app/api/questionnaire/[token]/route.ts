import { prisma } from "@/lib/prisma";
import { questionnaireSchema } from "@/schemas/client";
import { ok, notFound, badRequest, err, tooManyRequests } from "@/lib/api";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { createDealFromSurvey } from "@/lib/create-deal-from-survey";
import { mapToEngineIndustry } from "@/lib/industry-config";

function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false; // legacy tokens without expiry
  return new Date() > expiresAt;
}

// GET: Fetch client info for the questionnaire page (public, no auth)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const rl = checkRateLimit(`q:${token}`, RATE_LIMITS.questionnaire);
  if (!rl.allowed) return tooManyRequests(rl.retryAfterMs);

  const client = await prisma.client.findUnique({
    where: { token },
    select: {
      name: true,
      company: true,
      industry: true,
      questionnaireCompletedAt: true,
      tokenExpiresAt: true,
      user: {
        select: { name: true, brokerageName: true },
      },
    },
  });

  if (!client) return notFound("Questionnaire");

  if (isTokenExpired(client.tokenExpiresAt)) {
    return err("This questionnaire link has expired. Please request a new one from your broker.", 410);
  }

  return ok({
    clientName: client.name,
    company: client.company,
    industry: client.industry,
    alreadyCompleted: !!client.questionnaireCompletedAt,
    brokerName: client.user?.name,
    brokerageName: client.user?.brokerageName,
  });
}

// POST: Submit questionnaire answers (public, no auth — single-use)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const rl = checkRateLimit(`q:${token}`, RATE_LIMITS.questionnaire);
  if (!rl.allowed) return tooManyRequests(rl.retryAfterMs);

  const client = await prisma.client.findUnique({
    where: { token },
  });
  if (!client) return notFound("Questionnaire");

  // Check token expiry
  if (isTokenExpired(client.tokenExpiresAt)) {
    return err("This questionnaire link has expired. Please request a new one from your broker.", 410);
  }

  // Enforce single-use: reject if already completed
  if (client.questionnaireCompletedAt) {
    return err("This questionnaire has already been submitted.", 409);
  }

  const body = await req.json();
  const parsed = questionnaireSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const { criticalAmenities, ...rest } = parsed.data;

  // Map broker-set industry to engine type
  const engineIndustry = mapToEngineIndustry(client.industry) ?? "GENERAL_OFFICE";

  // Create Deal + ROI via shared helper
  const result = await createDealFromSurvey({
    clientId: client.id,
    clientUserId: client.userId,
    clientName: client.name,
    data: {
      industry: engineIndustry,
      companyName: client.company ?? undefined,
      headcount: rest.currentHeadcount,
      projectedHeadcount12mo: rest.projectedHeadcount12mo,
      annualRevenue: rest.currentAnnualRevenue,
      revenuePerEmployee: rest.revenuePerEmployee,
      projectedRevenueGrowth: rest.projectedRevenueGrowth,
      sfPerEmployee: rest.sfPerEmployee,
      budgetConstraint: rest.budgetConstraint,
      primaryGoal: rest.primaryGoal,
      criticalAmenities: criticalAmenities ?? undefined,
      expansionTimeline: rest.expansionTimeline,
    },
    sourceType: "STATIC",
    dealNameSuffix: "Space Assessment",
  });

  return ok({ success: true, completedAt: new Date().toISOString(), dealId: result.dealId });
}
