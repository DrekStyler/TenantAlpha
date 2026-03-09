import { prisma } from "@/lib/prisma";
import { ok, notFound, badRequest } from "@/lib/api";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { tooManyRequests } from "@/lib/api";
import { calculateDealComparison } from "@/engine";
import { prismaOptionToLeaseInput } from "@/lib/mappers";
import type { CalculationConfig } from "@/engine/types";

// GET: Fetch calculated results for a completed survey (public, no auth)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const rl = checkRateLimit(`survey-results:${token}`, RATE_LIMITS.survey);
  if (!rl.allowed) return tooManyRequests(rl.retryAfterMs);

  const client = await prisma.client.findUnique({
    where: { token },
    select: {
      id: true,
      name: true,
      questionnaireCompletedAt: true,
      industry: true,
      deals: {
        where: { sourceType: "AI_SURVEY" },
        take: 1,
        orderBy: { createdAt: "desc" },
        include: {
          options: { orderBy: { sortOrder: "asc" } },
        },
      },
      industryProfile: {
        select: {
          industryType: true,
          industryInputs: true,
          roiOutputs: true,
        },
      },
    },
  });

  if (!client) return notFound("Survey");
  if (!client.questionnaireCompletedAt) {
    return badRequest("Survey has not been completed yet.");
  }

  const deal = client.deals[0];
  if (!deal) return notFound("Deal");

  // Calculate lease comparison results
  let comparisonResults = null;
  if (deal.options.length >= 1) {
    const config: CalculationConfig = {
      discountingMode: { frequency: "monthly" },
      includeTIInEffectiveRent: false,
    };

    // For single-option deals (AI survey), duplicate as "current vs proposed"
    const inputs = deal.options.map(prismaOptionToLeaseInput);
    if (inputs.length === 1) {
      // Create a synthetic "Current Lease" option for comparison
      const proposed = inputs[0];
      const current = {
        ...proposed,
        optionName: "Current Lease (Estimated)",
        baseRentY1: proposed.baseRentY1 * 1.1,
        escalationPercent: proposed.escalationPercent + 0.5,
        freeRentMonths: 0,
        tiAllowance: 0,
        estimatedBuildoutCost: 0,
      };
      inputs.unshift(current);
    }

    comparisonResults = calculateDealComparison(inputs, config);
  }

  return ok({
    dealId: deal.id,
    dealName: deal.dealName,
    clientName: client.name,
    industry: client.industry,
    comparisonResults,
    roiOutputs: client.industryProfile?.roiOutputs ?? null,
    industryType: client.industryProfile?.industryType ?? null,
    industryInputs: client.industryProfile?.industryInputs ?? null,
  });
}
