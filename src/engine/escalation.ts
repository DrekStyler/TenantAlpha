/**
 * Calculate the annual base rent per SF for a given year.
 * Year 1 returns baseRentY1, subsequent years apply escalation.
 */
export function calculateAnnualBaseRent(
  baseRentY1: number,
  year: number,
  escalationType: "FIXED_PERCENT" | "CPI",
  escalationPercent: number,
  cpiAssumedPercent?: number
): number {
  if (year <= 1) return baseRentY1;

  const rate =
    escalationType === "CPI" && cpiAssumedPercent != null
      ? cpiAssumedPercent / 100
      : escalationPercent / 100;

  return baseRentY1 * Math.pow(1 + rate, year - 1);
}

/**
 * Calculate annual OpEx per SF for a given year with escalation.
 */
export function calculateAnnualOpEx(
  opExPerSFY1: number,
  year: number,
  escalationPercent: number
): number {
  if (year <= 1) return opExPerSFY1;
  return opExPerSFY1 * Math.pow(1 + escalationPercent / 100, year - 1);
}
