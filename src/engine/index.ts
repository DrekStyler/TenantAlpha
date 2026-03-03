export type {
  LeaseOptionInput,
  DiscountingMode,
  CalculationConfig,
  MonthlyCost,
  AnnualCashFlow,
  OptionMetrics,
  ComparisonResult,
} from "./types";

export { calculateAnnualBaseRent, calculateAnnualOpEx } from "./escalation";
export {
  calculateMonthlyBreakdown,
  calculateTotalOccupancyCost,
} from "./occupancyCost";
export {
  calculateEffectiveRent,
  calculateEffectiveRentWithTI,
  calculateTIGap,
} from "./effectiveRent";
export { calculateNPV } from "./npv";
export { calculateAnnualCashFlows } from "./cashFlow";
export { calculatePaybackPeriod } from "./paybackPeriod";
export { calculateCostPerEmployee } from "./employeeCost";
export {
  calculateRentAsPercentOfRevenue,
  calculateRentAsPercentOfRevenueByYear,
} from "./revenueMetrics";
export { calculateFreeRentSavings } from "./freeRent";
export { compareOptions } from "./comparison";

import type {
  LeaseOptionInput,
  CalculationConfig,
  OptionMetrics,
  ComparisonResult,
} from "./types";
import { calculateMonthlyBreakdown } from "./occupancyCost";
import {
  calculateEffectiveRent,
  calculateEffectiveRentWithTI,
  calculateTIGap,
} from "./effectiveRent";
import { calculateNPV } from "./npv";
import { calculateAnnualCashFlows } from "./cashFlow";
import { calculatePaybackPeriod } from "./paybackPeriod";
import { calculateCostPerEmployee } from "./employeeCost";
import { calculateRentAsPercentOfRevenue } from "./revenueMetrics";
import { calculateFreeRentSavings } from "./freeRent";
import { compareOptions } from "./comparison";

/**
 * Calculate all metrics for a single lease option.
 */
export function calculateOptionMetrics(
  input: LeaseOptionInput,
  config: CalculationConfig
): OptionMetrics {
  const monthlyBreakdown = calculateMonthlyBreakdown(input);
  const totalOccupancyCost = monthlyBreakdown.reduce(
    (sum, m) => sum + m.total,
    0
  );

  const tiGap = calculateTIGap(input);
  const annualCashFlows = calculateAnnualCashFlows(
    monthlyBreakdown,
    input.termMonths
  );

  const effectiveRentPerSF = calculateEffectiveRent(
    totalOccupancyCost,
    input.rentableSF,
    input.termMonths
  );

  const effectiveRentPerSFWithTI = calculateEffectiveRentWithTI(
    totalOccupancyCost,
    tiGap,
    input.rentableSF,
    input.termMonths
  );

  const npvOfCosts = calculateNPV(
    monthlyBreakdown,
    annualCashFlows,
    input.discountRate,
    config.discountingMode
  );

  const paybackPeriodMonths = calculatePaybackPeriod(
    tiGap,
    monthlyBreakdown,
    input.annualRevenue,
    input.expectedRevenueGrowth
  );

  const costPerEmployeePerYear = calculateCostPerEmployee(
    totalOccupancyCost,
    input.termMonths,
    input.employees
  );

  const rentAsPercentOfRevenue = calculateRentAsPercentOfRevenue(
    annualCashFlows,
    input.annualRevenue,
    input.expectedRevenueGrowth
  );

  const totalFreeRentSavings = calculateFreeRentSavings(
    input.baseRentY1,
    input.rentableSF,
    input.freeRentMonths
  );

  return {
    optionName: input.optionName,
    totalOccupancyCost,
    effectiveRentPerSF,
    effectiveRentPerSFWithTI,
    npvOfCosts,
    annualCashFlows,
    paybackPeriodMonths,
    costPerEmployeePerYear,
    rentAsPercentOfRevenue,
    totalFreeRentSavings,
    tiGap,
    monthlyBreakdown,
  };
}

/**
 * Calculate metrics for all options and produce a comparison.
 */
export function calculateDealComparison(
  inputs: LeaseOptionInput[],
  config: CalculationConfig
): ComparisonResult {
  const optionMetrics = inputs.map((input) =>
    calculateOptionMetrics(input, config)
  );
  return compareOptions(optionMetrics);
}
