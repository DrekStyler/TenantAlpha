import type { MonthlyCost } from "./types";

/**
 * Calculate the payback period in months for the TI gap.
 * Uses monthly savings compared to average monthly cost to determine
 * how long it takes to recoup the out-of-pocket buildout investment.
 *
 * Returns null if there is no TI gap (no payback needed).
 */
export function calculatePaybackPeriod(
  tiGap: number,
  monthlyCosts: MonthlyCost[],
  annualRevenue?: number,
  expectedRevenueGrowth?: number
): number | null {
  if (tiGap <= 0) return null;

  // If we have revenue data, calculate payback based on net benefit
  // (revenue minus occupancy cost)
  if (annualRevenue && annualRevenue > 0) {
    let cumulativeSavings = 0;
    const growthRate = (expectedRevenueGrowth ?? 0) / 100;

    for (let m = 0; m < monthlyCosts.length; m++) {
      const year = Math.ceil((m + 1) / 12);
      const monthlyRevenue =
        (annualRevenue * Math.pow(1 + growthRate, year - 1)) / 12;
      const netBenefit = monthlyRevenue - monthlyCosts[m].total;

      if (netBenefit > 0) {
        cumulativeSavings += netBenefit;
        if (cumulativeSavings >= tiGap) {
          return m + 1;
        }
      }
    }

    // Never fully recouped within lease term
    return monthlyCosts.length;
  }

  // Without revenue data, simple calculation:
  // TI gap / average monthly total cost
  const avgMonthlyCost =
    monthlyCosts.reduce((sum, m) => sum + m.total, 0) / monthlyCosts.length;

  if (avgMonthlyCost <= 0) return null;

  return Math.ceil(tiGap / avgMonthlyCost);
}
