import type { LeaseOptionInput } from "@/engine/types";

/**
 * Shape of a Prisma LeaseOption record (the fields we care about).
 * This covers the superset coming back from `prisma.deal.findUnique({ include: { options: true } })`.
 */
export interface PrismaOption {
  id: string;
  optionName: string;
  rentableSF: number;
  usableSF?: number | null;
  loadFactor?: number | null;
  termMonths: number;
  baseRentY1: number;
  escalationType: string;
  escalationPercent: number;
  cpiAssumedPercent?: number | null;
  freeRentMonths: number;
  freeRentType: string;
  rentStructure: string;
  opExPerSF?: number | null;
  opExEscalation?: number | null;
  propertyTax?: number | null;
  parkingCostMonthly?: number | null;
  otherMonthlyFees?: number | null;
  tiAllowance?: number | null;
  estimatedBuildoutCost?: number | null;
  discountRate: number;
  annualRevenue?: number | null;
  employees?: number | null;
  expectedRevenueGrowth?: number | null;
  [key: string]: unknown;
}

/**
 * Convert a Prisma LeaseOption record to the pure engine LeaseOptionInput.
 * Nulls become undefined so the engine can use default behaviour.
 */
export function prismaOptionToLeaseInput(opt: PrismaOption): LeaseOptionInput {
  return {
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
  };
}
