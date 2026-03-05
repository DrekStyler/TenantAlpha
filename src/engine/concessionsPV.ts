import type { LeaseOptionInput } from "./types";

/**
 * Calculate the Present Value of all lease concessions.
 *
 * Concessions include:
 * 1. Free rent — PV of the rent that would have been paid during free months
 * 2. TI allowance — time-0 cash value (no discounting needed)
 * 3. Cash allowance — time-0 cash value (moving allowance, etc.)
 */
export function calculatePVOfConcessions(
  input: LeaseOptionInput
): number {
  const monthlyDiscountRate = (input.discountRate / 100) / 12;

  // 1. PV of free rent concession
  let freeRentPV = 0;
  if (input.freeRentMonths > 0) {
    // Monthly rent at Y1 rate that would have been paid
    const monthlyRentY1 = (input.baseRentY1 * input.rentableSF) / 12;

    for (let m = 1; m <= input.freeRentMonths; m++) {
      if (monthlyDiscountRate > 0) {
        freeRentPV += monthlyRentY1 / Math.pow(1 + monthlyDiscountRate, m);
      } else {
        freeRentPV += monthlyRentY1;
      }
    }
  }

  // 2. TI allowance (time-0 value)
  const tiValue = input.tiAllowance ?? 0;

  // 3. Cash allowance (time-0 value)
  const cashValue = input.cashAllowance ?? 0;

  return freeRentPV + tiValue + cashValue;
}
