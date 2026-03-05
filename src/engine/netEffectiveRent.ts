import type { MonthlyCost } from "./types";

/**
 * Calculate Net Effective Rent per SF per year.
 * Uses rent component only (excludes OpEx, parking, other fees).
 *
 * Sums the rent component from the monthly breakdown, which already
 * accounts for free rent:
 *  - Abated: free months have $0 rent
 *  - Deferred: rent is charged normally (deferred cost added at end)
 *
 * This isolates the base rent obligation per SF/year, giving brokers
 * a clean comparison metric that excludes operating expenses.
 */
export function calculateNetEffectiveRent(
  monthlyBreakdown: MonthlyCost[],
  rentableSF: number,
  termMonths: number
): number {
  const termYears = termMonths / 12;
  if (rentableSF <= 0 || termYears <= 0) return 0;

  // Sum only the rent component across all months
  const totalRent = monthlyBreakdown.reduce((sum, m) => sum + m.rent, 0);

  return totalRent / rentableSF / termYears;
}
