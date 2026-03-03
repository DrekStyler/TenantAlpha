import type { AnnualCashFlow, MonthlyCost } from "./types";

/**
 * Aggregate monthly costs into annual cash flow objects.
 */
export function calculateAnnualCashFlows(
  monthlyCosts: MonthlyCost[],
  termMonths: number
): AnnualCashFlow[] {
  const totalYears = Math.ceil(termMonths / 12);
  const annualFlows: AnnualCashFlow[] = [];
  let cumulativeCost = 0;

  for (let year = 1; year <= totalYears; year++) {
    const startMonth = (year - 1) * 12 + 1;
    const endMonth = Math.min(year * 12, termMonths);

    const yearMonths = monthlyCosts.filter(
      (m) => m.month >= startMonth && m.month <= endMonth
    );

    const baseRent = yearMonths.reduce((sum, m) => sum + m.rent, 0);
    const opEx = yearMonths.reduce((sum, m) => sum + m.opEx, 0);
    const parking = yearMonths.reduce((sum, m) => sum + m.parking, 0);
    const otherFees = yearMonths.reduce((sum, m) => sum + m.otherFees, 0);
    const totalCost = baseRent + opEx + parking + otherFees;
    cumulativeCost += totalCost;

    annualFlows.push({
      year,
      baseRent,
      opEx,
      parking,
      otherFees,
      totalCost,
      cumulativeCost,
    });
  }

  return annualFlows;
}
