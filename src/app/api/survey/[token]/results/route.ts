import { auth } from "@clerk/nextjs/server";
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

  const { userId: clerkUserId } = await auth();

  const client = await prisma.client.findUnique({
    where: { token },
    select: {
      id: true,
      name: true,
      userId: true,
      clientClerkUserId: true,
      questionnaireCompletedAt: true,
      industry: true,
      currentHeadcount: true,
      currentAnnualRevenue: true,
      revenuePerEmployee: true,
      sfPerEmployee: true,
      deals: {
        where: { sourceType: { in: ["AI_SURVEY", "STATIC"] } },
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
          roiCalcInputs: true,
        },
      },
    },
  });

  if (!client) return notFound("Survey");
  if (!client.questionnaireCompletedAt) {
    return badRequest("Survey has not been completed yet.");
  }

  // Link authenticated user to this client record (one-time, skip if broker)
  if (clerkUserId && !client.clientClerkUserId && clerkUserId !== client.userId) {
    try {
      await prisma.client.update({
        where: { id: client.id },
        data: { clientClerkUserId: clerkUserId },
      });
    } catch {
      // Unique constraint violation — this Clerk account is already linked to another client
    }
  }

  const deal = client.deals[0];
  if (!deal) return notFound("Deal");

  // Check for broker-created deals linked to this client
  const brokerDeals = await prisma.deal.findMany({
    where: { clientId: client.id, sourceType: "MANUAL" },
    orderBy: { updatedAt: "desc" },
    take: 1,
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });
  const brokerDeal = brokerDeals[0] ?? null;

  // Calculate lease comparison results
  let comparisonResults = null;
  if (deal.options.length >= 1) {
    const config: CalculationConfig = {
      discountingMode: { frequency: "monthly" },
      includeTIInEffectiveRent: false,
    };

    const inputs = deal.options.map(prismaOptionToLeaseInput);

    // Defense-in-depth: enforce minimum floors on all inputs (catches legacy data)
    for (const input of inputs) {
      input.rentableSF = Math.max(1000, input.rentableSF);
      input.baseRentY1 = Math.max(10, input.baseRentY1);
      input.termMonths = Math.max(12, input.termMonths);
    }

    if (brokerDeal && brokerDeal.options.length > 0) {
      // Broker has created a deal for this client — use broker options for comparison
      const brokerInputs = brokerDeal.options.map(prismaOptionToLeaseInput);
      for (const bi of brokerInputs) {
        bi.rentableSF = Math.max(1000, bi.rentableSF);
        bi.baseRentY1 = Math.max(10, bi.baseRentY1);
        bi.termMonths = Math.max(12, bi.termMonths);
      }
      inputs.push(...brokerInputs);
    } else if (inputs.length === 1) {
      // No broker deal — create synthetic "Current Lease (Estimated)" for comparison
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
    hasBrokerDeal: !!(brokerDeal && brokerDeal.options.length > 0),
    roiOutputs: client.industryProfile?.roiOutputs ?? null,
    roiCalcInputs: client.industryProfile?.roiCalcInputs ?? null,
    industryType: client.industryProfile?.industryType ?? null,
    industryInputs: client.industryProfile?.industryInputs ?? null,
    surveyData: {
      headcount: client.currentHeadcount,
      annualRevenue: client.currentAnnualRevenue,
      revenuePerEmployee: client.revenuePerEmployee,
      sfPerEmployee: client.sfPerEmployee,
    },
  });
}
