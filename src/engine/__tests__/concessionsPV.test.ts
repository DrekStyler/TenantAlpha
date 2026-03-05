import { describe, it, expect } from "vitest";
import { calculatePVOfConcessions } from "../concessionsPV";
import type { LeaseOptionInput } from "../types";

const baseInput: LeaseOptionInput = {
  optionName: "Test",
  rentableSF: 6000,
  termMonths: 60,
  baseRentY1: 52.0,
  escalationType: "FIXED_PERCENT",
  escalationPercent: 3.0,
  freeRentMonths: 3,
  freeRentType: "ABATED",
  rentStructure: "GROSS",
  tiAllowance: 300000,
  discountRate: 8.0,
};

describe("calculatePVOfConcessions", () => {
  it("includes PV of free rent, TI allowance, and cash allowance", () => {
    const input = { ...baseInput, cashAllowance: 25000 };
    const pv = calculatePVOfConcessions(input);

    // TI ($300k) + cash ($25k) + PV of 3 months free rent
    // Monthly rent = $52 * 6000 / 12 = $26,000
    // PV of 3 months at 8%/12: ~$25,870 + ~$25,741 + ~$25,613 ≈ $77,224
    // Total ≈ $300,000 + $25,000 + $77,224 ≈ $402,224
    expect(pv).toBeGreaterThan(395000);
    expect(pv).toBeLessThan(410000);
  });

  it("returns 0 when no concessions exist", () => {
    const input: LeaseOptionInput = {
      ...baseInput,
      freeRentMonths: 0,
      tiAllowance: undefined,
      cashAllowance: undefined,
    };
    expect(calculatePVOfConcessions(input)).toBe(0);
  });

  it("calculates only free rent PV when no TI or cash", () => {
    const input: LeaseOptionInput = {
      ...baseInput,
      tiAllowance: undefined,
      cashAllowance: undefined,
    };
    const pv = calculatePVOfConcessions(input);

    // Monthly rent = $26,000
    // 3 months discounted at 8%/12
    expect(pv).toBeGreaterThan(75000);
    expect(pv).toBeLessThan(80000);
  });

  it("handles zero discount rate (no time value)", () => {
    const input = { ...baseInput, discountRate: 0 };
    const pv = calculatePVOfConcessions(input);

    // No discounting: 3 * $26,000 + $300,000 = $378,000
    const monthlyRent = (52 * 6000) / 12;
    const expected = 3 * monthlyRent + 300000;
    expect(pv).toBeCloseTo(expected, 2);
  });

  it("higher discount rate reduces PV of free rent", () => {
    const lowRate = { ...baseInput, discountRate: 4.0 };
    const highRate = { ...baseInput, discountRate: 12.0 };

    const pvLow = calculatePVOfConcessions(lowRate);
    const pvHigh = calculatePVOfConcessions(highRate);

    // TI is same for both, but free rent PV should be lower with higher rate
    expect(pvLow).toBeGreaterThan(pvHigh);
  });
});
