import type { LeaseOptionInput } from "./types";

/**
 * Calculate effective rent per SF per year.
 * totalOccupancyCost / rentableSF / (termMonths / 12)
 */
export function calculateEffectiveRent(
  totalOccupancyCost: number,
  rentableSF: number,
  termMonths: number
): number {
  const termYears = termMonths / 12;
  if (rentableSF <= 0 || termYears <= 0) return 0;
  return totalOccupancyCost / rentableSF / termYears;
}

/**
 * Calculate effective rent including TI out-of-pocket costs.
 */
export function calculateEffectiveRentWithTI(
  totalOccupancyCost: number,
  tiGap: number,
  rentableSF: number,
  termMonths: number
): number {
  const termYears = termMonths / 12;
  if (rentableSF <= 0 || termYears <= 0) return 0;
  return (totalOccupancyCost + tiGap) / rentableSF / termYears;
}

/**
 * Calculate the TI gap (out-of-pocket buildout cost).
 */
export function calculateTIGap(input: LeaseOptionInput): number {
  const buildout = input.estimatedBuildoutCost ?? 0;
  const allowance = input.tiAllowance ?? 0;
  return Math.max(0, buildout - allowance);
}

/**
 * Calculate TI Allowance per RSF.
 */
export function calculateTIAllowancePerRSF(
  tiAllowance: number | undefined,
  rentableSF: number
): number {
  if (rentableSF <= 0) return 0;
  return (tiAllowance ?? 0) / rentableSF;
}

/**
 * Calculate Effective Rent per Usable SF.
 * USF can be provided directly or derived from RSF and load factor.
 * Returns null if neither usableSF nor loadFactor is available.
 */
export function calculateEffectiveRentPerUSF(
  effectiveRentPerSF: number,
  rentableSF: number,
  usableSF?: number,
  loadFactor?: number
): number | null {
  // Determine usable SF
  let usable: number | null = null;

  if (usableSF != null && usableSF > 0) {
    usable = usableSF;
  } else if (loadFactor != null && loadFactor > 0) {
    usable = rentableSF / (1 + loadFactor / 100);
  }

  if (usable === null || usable <= 0 || rentableSF <= 0) return null;

  // Effective rent per USF = effectiveRentPerSF * (RSF / USF)
  return effectiveRentPerSF * (rentableSF / usable);
}
