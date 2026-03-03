import type { LeaseOptionInput, MonthlyCost } from "./types";
import { calculateAnnualBaseRent, calculateAnnualOpEx } from "./escalation";

/**
 * Calculate month-by-month costs and total occupancy cost over the full lease term.
 * Returns both the total and the monthly breakdown.
 */
export function calculateMonthlyBreakdown(
  input: LeaseOptionInput
): MonthlyCost[] {
  const months: MonthlyCost[] = [];

  for (let m = 1; m <= input.termMonths; m++) {
    const year = Math.ceil(m / 12);

    // Base rent for this month
    let monthlyRent: number;
    if (input.freeRentType === "ABATED" && m <= input.freeRentMonths) {
      monthlyRent = 0; // Free rent period — no rent owed
    } else {
      const annualRentPerSF = calculateAnnualBaseRent(
        input.baseRentY1,
        year,
        input.escalationType,
        input.escalationPercent,
        input.cpiAssumedPercent
      );
      monthlyRent = (annualRentPerSF * input.rentableSF) / 12;
    }

    // OpEx (for NNN and Modified Gross)
    let monthlyOpEx = 0;
    if (
      (input.rentStructure === "NNN" ||
        input.rentStructure === "MODIFIED_GROSS") &&
      input.opExPerSF
    ) {
      const annualOpEx = calculateAnnualOpEx(
        input.opExPerSF,
        year,
        input.opExEscalation ?? 0
      );
      monthlyOpEx = (annualOpEx * input.rentableSF) / 12;
    }

    // Property tax (if separate, add to OpEx)
    if (input.propertyTax && input.rentStructure !== "GROSS") {
      monthlyOpEx += (input.propertyTax * input.rentableSF) / 12;
    }

    const parking = input.parkingCostMonthly ?? 0;
    const otherFees = input.otherMonthlyFees ?? 0;

    months.push({
      month: m,
      rent: monthlyRent,
      opEx: monthlyOpEx,
      parking,
      otherFees,
      total: monthlyRent + monthlyOpEx + parking + otherFees,
    });
  }

  // Handle deferred free rent: add the deferred rent to the last months
  if (input.freeRentType === "DEFERRED" && input.freeRentMonths > 0) {
    const annualRentPerSF = calculateAnnualBaseRent(
      input.baseRentY1,
      1,
      input.escalationType,
      input.escalationPercent,
      input.cpiAssumedPercent
    );
    const monthlyFreeRentValue =
      (annualRentPerSF * input.rentableSF) / 12;
    const totalDeferred = monthlyFreeRentValue * input.freeRentMonths;

    // Spread deferred rent across the last N months of the lease
    const spreadMonths = Math.min(input.freeRentMonths, input.termMonths);
    const perMonthDeferred = totalDeferred / spreadMonths;
    for (
      let i = months.length - spreadMonths;
      i < months.length;
      i++
    ) {
      months[i].rent += perMonthDeferred;
      months[i].total += perMonthDeferred;
    }
  }

  return months;
}

/**
 * Calculate total occupancy cost over the full lease term.
 */
export function calculateTotalOccupancyCost(
  input: LeaseOptionInput
): number {
  const months = calculateMonthlyBreakdown(input);
  return months.reduce((sum, m) => sum + m.total, 0);
}
