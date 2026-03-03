import type { LeaseOptionInput } from "@/engine/types";

/**
 * Acme Corp — Office Relocation Analysis
 * Sample data from the requirements document (Section 9).
 */
export const SAMPLE_DEAL = {
  dealName: "Acme Corp — Office Relocation Analysis",
  clientName: "Acme Corp",
  propertyType: "OFFICE" as const,
};

export const SAMPLE_OPTIONS: LeaseOptionInput[] = [
  {
    optionName: "Option A — Downtown Tower",
    rentableSF: 6000,
    termMonths: 60,
    baseRentY1: 52.0,
    escalationType: "FIXED_PERCENT",
    escalationPercent: 3.0,
    freeRentMonths: 3,
    freeRentType: "ABATED",
    rentStructure: "GROSS",
    parkingCostMonthly: 3000,
    tiAllowance: 300000,
    estimatedBuildoutCost: 400000,
    discountRate: 8.0,
    annualRevenue: 8000000,
    employees: 35,
  },
  {
    optionName: "Option B — Midtown Campus",
    rentableSF: 6500,
    termMonths: 60,
    baseRentY1: 46.0,
    escalationType: "FIXED_PERCENT",
    escalationPercent: 2.5,
    freeRentMonths: 2,
    freeRentType: "ABATED",
    rentStructure: "GROSS",
    parkingCostMonthly: 2500,
    tiAllowance: 195000,
    estimatedBuildoutCost: 250000,
    discountRate: 8.0,
    annualRevenue: 8000000,
    employees: 35,
  },
  {
    optionName: "Option C — Suburban Park",
    rentableSF: 7000,
    termMonths: 84,
    baseRentY1: 32.0,
    escalationType: "FIXED_PERCENT",
    escalationPercent: 3.0,
    freeRentMonths: 6,
    freeRentType: "ABATED",
    rentStructure: "NNN",
    opExPerSF: 14.0,
    parkingCostMonthly: 0,
    tiAllowance: 420000,
    estimatedBuildoutCost: 420000,
    discountRate: 8.0,
    annualRevenue: 8000000,
    employees: 35,
  },
];
