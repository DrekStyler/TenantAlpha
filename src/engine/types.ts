export interface LeaseOptionInput {
  optionName: string;
  rentableSF: number;
  usableSF?: number;
  loadFactor?: number;
  termMonths: number;
  baseRentY1: number; // $/SF/year
  escalationType: "FIXED_PERCENT" | "CPI";
  escalationPercent: number; // e.g. 3.0 for 3%
  cpiAssumedPercent?: number;
  freeRentMonths: number;
  freeRentType: "ABATED" | "DEFERRED";
  rentStructure: "GROSS" | "NNN" | "MODIFIED_GROSS";
  opExPerSF?: number; // $/SF/year
  opExEscalation?: number; // annual %
  propertyTax?: number; // $/SF/year
  parkingCostMonthly?: number;
  otherMonthlyFees?: number;
  tiAllowance?: number; // $ total
  estimatedBuildoutCost?: number; // $ total
  cashAllowance?: number; // $ total (moving allowance, etc.)
  expenseStopPerSF?: number; // $/SF/year
  baseYearOpExPerSF?: number; // $/SF/year (base year stop)
  discountRate: number; // e.g. 8.0 for 8%
  annualRevenue?: number;
  employees?: number;
  expectedRevenueGrowth?: number; // annual %
}

export interface DiscountingMode {
  frequency: "monthly" | "annual";
}

export interface MonthlyCost {
  month: number; // 1-indexed
  rent: number;
  opEx: number;
  parking: number;
  otherFees: number;
  total: number;
}

export interface AnnualCashFlow {
  year: number; // 1-indexed
  baseRent: number;
  opEx: number;
  parking: number;
  otherFees: number;
  totalCost: number;
  cumulativeCost: number;
}

export interface OptionMetrics {
  optionName: string;
  rentableSF: number;
  termMonths: number;
  totalOccupancyCost: number;
  effectiveRentPerSF: number;
  effectiveRentPerSFWithTI: number;
  npvOfCosts: number;
  annualCashFlows: AnnualCashFlow[];
  paybackPeriodMonths: number | null;
  costPerEmployeePerYear: number | null;
  rentAsPercentOfRevenue: number | null;
  totalFreeRentSavings: number;
  tiGap: number;
  monthlyBreakdown: MonthlyCost[];
  // Broker-grade metrics
  netEffectiveRentPerSF: number;
  straightLineMonthlyRent: number;
  expenseStopExposure: number;
  effectiveRentPerUSF: number | null;
  tiAllowancePerRSF: number;
  pvOfConcessions: number;
}

export interface ComparisonResult {
  options: OptionMetrics[];
  rankedByEffectiveRent: string[];
  rankedByNPV: string[];
  bestValueOption: string;
  bestValueReasons: string[];
}

export interface CalculationConfig {
  discountingMode: DiscountingMode;
  includeTIInEffectiveRent: boolean;
}
