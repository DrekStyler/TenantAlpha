/**
 * Calculate the total dollar value of free rent savings.
 * This is the rent that would have been paid during the free rent period.
 */
export function calculateFreeRentSavings(
  baseRentY1: number,
  rentableSF: number,
  freeRentMonths: number
): number {
  if (freeRentMonths <= 0) return 0;
  const monthlyRent = (baseRentY1 * rentableSF) / 12;
  return monthlyRent * freeRentMonths;
}
