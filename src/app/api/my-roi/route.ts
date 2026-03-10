import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, unauthorized } from "@/lib/api";
import { calculateDealComparison } from "@/engine";
import { prismaOptionToLeaseInput } from "@/lib/mappers";
import type { CalculationConfig } from "@/engine/types";

// GET: Fetch the authenticated client's ROI data
export async function GET() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return unauthorized();

  // Find the Client record linked to this Clerk user
  const client = await prisma.client.findUnique({
    where: { clientClerkUserId: clerkUserId },
    select: {
      id: true,
      name: true,
      industry: true,
      currentHeadcount: true,
      currentAnnualRevenue: true,
      revenuePerEmployee: true,
      sfPerEmployee: true,
      budgetConstraint: true,
      primaryGoal: true,
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

  if (!client) return notFound("Client profile");

  const deal = client.deals[0];
  if (!deal) return notFound("ROI analysis");

  // Calculate lease comparison if options exist
  let comparisonResults = null;
  if (deal.options.length >= 1) {
    const config: CalculationConfig = {
      discountingMode: { frequency: "monthly" },
      includeTIInEffectiveRent: false,
    };
    const inputs = deal.options.map(prismaOptionToLeaseInput);
    if (inputs.length === 1) {
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
    roiCalcInputs: client.industryProfile?.roiCalcInputs ?? null,
    industryType: client.industryProfile?.industryType ?? null,
    industryInputs: client.industryProfile?.industryInputs ?? null,
    surveyData: {
      headcount: client.currentHeadcount,
      annualRevenue: client.currentAnnualRevenue,
      revenuePerEmployee: client.revenuePerEmployee,
      sfPerEmployee: client.sfPerEmployee,
      budgetConstraint: client.budgetConstraint,
      primaryGoal: client.primaryGoal,
    },
  });
}
