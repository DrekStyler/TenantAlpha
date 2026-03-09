import type { CapitalROI, CapitalInput } from "./types";

/**
 * Calculate capital preserved by TI allowance from landlord.
 * TI allowance replaces tenant capital that would otherwise be spent on buildout.
 */
export function calculateTICapitalPreservation(
  tiAllowance: number,
  estimatedBuildoutCost: number
): number {
  // The amount of tenant capital NOT spent because landlord covers it
  return Math.min(tiAllowance, estimatedBuildoutCost);
}

/**
 * Calculate working capital preserved by free rent months.
 */
export function calculateFreeRentCapitalSavings(
  freeRentMonths: number,
  monthlyBaseRent: number
): number {
  return freeRentMonths * monthlyBaseRent;
}

/**
 * Calculate the tenant's actual out-of-pocket investment.
 */
export function calculateTenantOutOfPocket(
  estimatedBuildoutCost: number,
  tiAllowance: number,
  movingCosts: number,
  furnitureIT: number,
  cashAllowance: number
): number {
  const tiGap = Math.max(0, estimatedBuildoutCost - tiAllowance);
  const totalOutOfPocket = tiGap + movingCosts + furnitureIT - cashAllowance;
  return Math.max(0, totalOutOfPocket);
}

/**
 * Calculate complete Capital ROI.
 *
 * Capital ROI measures how effectively the lease deal preserves
 * tenant capital. TI dollars from the landlord replace tenant capital,
 * and free rent preserves working capital.
 */
export function calculateCapitalROI(input: CapitalInput): CapitalROI {
  const tiDollarsReceived = input.tiAllowance;

  const tenantCapitalPreserved = calculateTICapitalPreservation(
    input.tiAllowance,
    input.estimatedBuildoutCost
  );

  const freeRentWorkingCapitalSaved = calculateFreeRentCapitalSavings(
    input.freeRentMonths,
    input.monthlyBaseRent
  );

  const totalCapitalBenefit =
    tenantCapitalPreserved + freeRentWorkingCapitalSaved + input.cashAllowance;

  const tenantOutOfPocket = calculateTenantOutOfPocket(
    input.estimatedBuildoutCost,
    input.tiAllowance,
    input.movingCosts,
    input.furnitureIT,
    input.cashAllowance
  );

  // Effective Capital ROI = total capital benefit / tenant out-of-pocket
  const effectiveCapitalROI =
    tenantOutOfPocket > 0
      ? (totalCapitalBenefit / tenantOutOfPocket) * 100
      : totalCapitalBenefit > 0
        ? Infinity
        : 0;

  return {
    tiDollarsReceived: Math.round(tiDollarsReceived),
    tenantCapitalPreserved: Math.round(tenantCapitalPreserved),
    freeRentWorkingCapitalSaved: Math.round(freeRentWorkingCapitalSaved),
    totalCapitalBenefit: Math.round(totalCapitalBenefit),
    tenantOutOfPocket: Math.round(tenantOutOfPocket),
    effectiveCapitalROI:
      effectiveCapitalROI === Infinity
        ? Infinity
        : Math.round(effectiveCapitalROI * 10) / 10,
  };
}
