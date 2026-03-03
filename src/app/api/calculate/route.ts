import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { calculateDealComparison } from "@/engine";
import type { LeaseOptionInput, CalculationConfig } from "@/engine/types";
import { ok, unauthorized, notFound, forbidden, badRequest } from "@/lib/api";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const body = await req.json();
  const { dealId, discountingMode, includeTIInEffectiveRent } = body;

  if (!dealId) return badRequest("dealId is required");

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });

  if (!deal) return notFound("Deal");
  if (deal.userId !== userId) return forbidden();
  if (deal.options.length < 2)
    return badRequest("At least 2 lease options are required to calculate");

  const config: CalculationConfig = {
    discountingMode: discountingMode ?? { frequency: "monthly" },
    includeTIInEffectiveRent: includeTIInEffectiveRent ?? false,
  };

  const inputs: LeaseOptionInput[] = deal.options.map((opt) => ({
    optionName: opt.optionName,
    rentableSF: opt.rentableSF,
    usableSF: opt.usableSF ?? undefined,
    loadFactor: opt.loadFactor ?? undefined,
    termMonths: opt.termMonths,
    baseRentY1: opt.baseRentY1,
    escalationType: opt.escalationType as "FIXED_PERCENT" | "CPI",
    escalationPercent: opt.escalationPercent,
    cpiAssumedPercent: opt.cpiAssumedPercent ?? undefined,
    freeRentMonths: opt.freeRentMonths,
    freeRentType: opt.freeRentType as "ABATED" | "DEFERRED",
    rentStructure: opt.rentStructure as "GROSS" | "NNN" | "MODIFIED_GROSS",
    opExPerSF: opt.opExPerSF ?? undefined,
    opExEscalation: opt.opExEscalation ?? undefined,
    propertyTax: opt.propertyTax ?? undefined,
    parkingCostMonthly: opt.parkingCostMonthly ?? undefined,
    otherMonthlyFees: opt.otherMonthlyFees ?? undefined,
    tiAllowance: opt.tiAllowance ?? undefined,
    estimatedBuildoutCost: opt.estimatedBuildoutCost ?? undefined,
    discountRate: opt.discountRate,
    annualRevenue: opt.annualRevenue ?? undefined,
    employees: opt.employees ?? undefined,
    expectedRevenueGrowth: opt.expectedRevenueGrowth ?? undefined,
  }));

  const results = calculateDealComparison(inputs, config);

  // Mark deal as calculated
  await prisma.deal.update({
    where: { id: dealId },
    data: { status: "CALCULATED" },
  });

  return ok(results);
}
