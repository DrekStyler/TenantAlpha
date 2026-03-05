import type { LeaseOptionInput } from "./types";
import { calculateAnnualOpEx } from "./escalation";

/**
 * Calculate total Expense Stop Exposure over the lease term.
 * For each year, exposure = max(0, actualOpEx - stopLevel) * RSF.
 *
 * If `expenseStopPerSF` is provided, that is the fixed stop level.
 * If `baseYearOpExPerSF` is provided instead, the base year OpEx
 * sets the stop level (common in "base year" stop structures).
 * If neither is provided, returns 0.
 */
export function calculateExpenseStopExposure(
  input: LeaseOptionInput
): number {
  // Determine the stop level
  const stopLevel = input.expenseStopPerSF ?? input.baseYearOpExPerSF ?? null;
  if (stopLevel === null) return 0;

  // Need OpEx to calculate exposure
  const opExY1 = input.opExPerSF;
  if (!opExY1 || opExY1 <= 0) return 0;

  const escalation = input.opExEscalation ?? 0;
  const totalYears = Math.ceil(input.termMonths / 12);
  let totalExposure = 0;

  for (let year = 1; year <= totalYears; year++) {
    const actualOpEx = calculateAnnualOpEx(opExY1, year, escalation);
    const yearExposure = Math.max(0, actualOpEx - stopLevel) * input.rentableSF;

    // Prorate the last year if term doesn't end on a year boundary
    if (year === totalYears && input.termMonths % 12 !== 0) {
      const monthsInLastYear = input.termMonths % 12;
      totalExposure += yearExposure * (monthsInLastYear / 12);
    } else {
      totalExposure += yearExposure;
    }
  }

  return totalExposure;
}
