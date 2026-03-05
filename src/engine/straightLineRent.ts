import type { MonthlyCost } from "./types";

/**
 * Calculate Straight-Line Monthly Rent.
 * Average monthly base rent over the full term, smoothing out
 * escalations and free rent periods. Used for GAAP accounting.
 */
export function calculateStraightLineRent(
  monthlyBreakdown: MonthlyCost[],
  termMonths: number
): number {
  if (termMonths <= 0) return 0;

  // Sum only the rent component (excludes OpEx, parking, otherFees)
  const totalRent = monthlyBreakdown.reduce((sum, m) => sum + m.rent, 0);

  return totalRent / termMonths;
}
