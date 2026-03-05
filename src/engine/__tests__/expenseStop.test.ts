import { describe, it, expect } from "vitest";
import { calculateExpenseStopExposure } from "../expenseStop";
import type { LeaseOptionInput } from "../types";

const baseInput: LeaseOptionInput = {
  optionName: "Test",
  rentableSF: 10000,
  termMonths: 60, // 5 years
  baseRentY1: 40.0,
  escalationType: "FIXED_PERCENT",
  escalationPercent: 3.0,
  freeRentMonths: 0,
  freeRentType: "ABATED",
  rentStructure: "NNN",
  opExPerSF: 12.0,
  opExEscalation: 3.0,
  discountRate: 8.0,
};

describe("calculateExpenseStopExposure", () => {
  it("returns 0 when no expense stop is set", () => {
    const input = { ...baseInput, expenseStopPerSF: undefined };
    expect(calculateExpenseStopExposure(input)).toBe(0);
  });

  it("returns 0 when no OpEx is set", () => {
    const input = { ...baseInput, expenseStopPerSF: 12.0, opExPerSF: undefined };
    expect(calculateExpenseStopExposure(input)).toBe(0);
  });

  it("returns 0 when stop exceeds all years of OpEx", () => {
    // Stop at $20/SF, OpEx starts at $12 with 3% escalation
    // Even Year 5: 12 * 1.03^4 = ~$13.50 — still under $20
    const input = { ...baseInput, expenseStopPerSF: 20.0 };
    expect(calculateExpenseStopExposure(input)).toBe(0);
  });

  it("calculates exposure when OpEx exceeds stop", () => {
    // Stop at $12/SF, OpEx starts at $12 with 3% escalation
    // Year 1: $12.00 - $12.00 = $0
    // Year 2: $12.36 - $12.00 = $0.36 * 10000 = $3,600
    // Year 3: $12.73 - $12.00 = $0.73 * 10000 = $7,309
    // Year 4: $13.11 - $12.00 = $1.11 * 10000 = $11,128
    // Year 5: $13.50 - $12.00 = $1.50 * 10000 = $15,022
    const input = { ...baseInput, expenseStopPerSF: 12.0 };
    const exposure = calculateExpenseStopExposure(input);
    expect(exposure).toBeGreaterThan(0);
    // Should be roughly $37k over 5 years
    expect(exposure).toBeGreaterThan(30000);
    expect(exposure).toBeLessThan(50000);
  });

  it("uses base year OpEx as stop level when provided", () => {
    // Base year OpEx at $11/SF (lower than Y1 OpEx of $12)
    // This means exposure starts from Year 1
    const input = {
      ...baseInput,
      baseYearOpExPerSF: 11.0,
      expenseStopPerSF: undefined,
    };
    const exposure = calculateExpenseStopExposure(input);

    // Year 1: $12 - $11 = $1 * 10000 = $10,000
    // Plus escalated years
    expect(exposure).toBeGreaterThan(10000);
  });

  it("expenseStopPerSF takes precedence over baseYearOpExPerSF", () => {
    const inputStop = {
      ...baseInput,
      expenseStopPerSF: 12.0,
      baseYearOpExPerSF: 11.0,
    };
    const inputBaseYear = {
      ...baseInput,
      expenseStopPerSF: undefined,
      baseYearOpExPerSF: 11.0,
    };

    const exposureStop = calculateExpenseStopExposure(inputStop);
    const exposureBaseYear = calculateExpenseStopExposure(inputBaseYear);

    // Stop at $12 should have less exposure than stop at $11
    expect(exposureStop).toBeLessThan(exposureBaseYear);
  });

  it("prorates the last year for non-12-month-aligned terms", () => {
    // 54 months = 4 full years + 6 months
    const input = { ...baseInput, termMonths: 54, expenseStopPerSF: 12.0 };
    const exposure54 = calculateExpenseStopExposure(input);

    const input60 = { ...baseInput, termMonths: 60, expenseStopPerSF: 12.0 };
    const exposure60 = calculateExpenseStopExposure(input60);

    // 54-month exposure should be less than 60-month
    expect(exposure54).toBeLessThan(exposure60);
    expect(exposure54).toBeGreaterThan(0);
  });
});
