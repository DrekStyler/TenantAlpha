/**
 * Calculate annual cost per employee.
 * Returns null if employee count is not provided.
 */
export function calculateCostPerEmployee(
  totalOccupancyCost: number,
  termMonths: number,
  employees?: number
): number | null {
  if (!employees || employees <= 0) return null;
  const termYears = termMonths / 12;
  if (termYears <= 0) return null;
  const annualCost = totalOccupancyCost / termYears;
  return annualCost / employees;
}
