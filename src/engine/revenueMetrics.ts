import type { AnnualCashFlow } from "./types";

/**
 * Calculate rent as a percentage of revenue for Year 1.
 * Returns null if revenue data is not provided.
 */
export function calculateRentAsPercentOfRevenue(
  annualCashFlows: AnnualCashFlow[],
  annualRevenue?: number,
  expectedRevenueGrowth?: number
): number | null {
  if (!annualRevenue || annualRevenue <= 0) return null;
  if (annualCashFlows.length === 0) return null;

  // Use Year 1 cost and revenue
  const year1Cost = annualCashFlows[0].totalCost;
  return (year1Cost / annualRevenue) * 100;
}

/**
 * Calculate rent as a percentage of revenue for each year.
 */
export function calculateRentAsPercentOfRevenueByYear(
  annualCashFlows: AnnualCashFlow[],
  annualRevenue?: number,
  expectedRevenueGrowth?: number
): (number | null)[] {
  if (!annualRevenue || annualRevenue <= 0) {
    return annualCashFlows.map(() => null);
  }

  const growthRate = (expectedRevenueGrowth ?? 0) / 100;

  return annualCashFlows.map((cf) => {
    const yearRevenue = annualRevenue * Math.pow(1 + growthRate, cf.year - 1);
    return (cf.totalCost / yearRevenue) * 100;
  });
}
