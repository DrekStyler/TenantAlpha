import type { AnnualCashFlow, DiscountingMode, MonthlyCost } from "./types";

/**
 * Calculate Net Present Value of all lease costs.
 * Supports both monthly and annual discounting.
 */
export function calculateNPV(
  monthlyCosts: MonthlyCost[],
  annualCashFlows: AnnualCashFlow[],
  discountRate: number, // e.g. 8.0 for 8%
  mode: DiscountingMode
): number {
  const r = discountRate / 100;

  if (mode.frequency === "monthly") {
    const monthlyRate = r / 12;
    return monthlyCosts.reduce((npv, cost) => {
      return npv + cost.total / Math.pow(1 + monthlyRate, cost.month);
    }, 0);
  }

  // Annual discounting
  return annualCashFlows.reduce((npv, cf) => {
    return npv + cf.totalCost / Math.pow(1 + r, cf.year);
  }, 0);
}
