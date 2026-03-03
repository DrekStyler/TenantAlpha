import { describe, it, expect } from "vitest";
import {
  calculateAnnualBaseRent,
  calculateAnnualOpEx,
} from "../escalation";

describe("calculateAnnualBaseRent", () => {
  it("returns baseRentY1 for year 1", () => {
    expect(
      calculateAnnualBaseRent(52, 1, "FIXED_PERCENT", 3)
    ).toBe(52);
  });

  it("applies fixed percentage escalation for year 2", () => {
    const result = calculateAnnualBaseRent(52, 2, "FIXED_PERCENT", 3);
    expect(result).toBeCloseTo(53.56, 2);
  });

  it("applies fixed percentage escalation for year 5", () => {
    const result = calculateAnnualBaseRent(52, 5, "FIXED_PERCENT", 3);
    // 52 * (1.03)^4 = 58.5265
    expect(result).toBeCloseTo(58.5265, 2);
  });

  it("uses CPI assumed percent when escalation is CPI", () => {
    const result = calculateAnnualBaseRent(46, 3, "CPI", 0, 2.5);
    // 46 * (1.025)^2 = 48.33
    expect(result).toBeCloseTo(48.33, 2);
  });

  it("falls back to escalationPercent for CPI when no cpiAssumedPercent", () => {
    const result = calculateAnnualBaseRent(46, 2, "CPI", 3, undefined);
    // Without CPI assumed, uses escalationPercent: 46 * 1.03 = 47.38
    expect(result).toBeCloseTo(47.38, 2);
  });

  it("returns baseRentY1 for year 0 or negative", () => {
    expect(
      calculateAnnualBaseRent(52, 0, "FIXED_PERCENT", 3)
    ).toBe(52);
    expect(
      calculateAnnualBaseRent(52, -1, "FIXED_PERCENT", 3)
    ).toBe(52);
  });
});

describe("calculateAnnualOpEx", () => {
  it("returns base OpEx for year 1", () => {
    expect(calculateAnnualOpEx(14, 1, 3)).toBe(14);
  });

  it("applies escalation for year 3", () => {
    // 14 * (1.03)^2 = 14.85
    expect(calculateAnnualOpEx(14, 3, 3)).toBeCloseTo(14.85, 2);
  });

  it("handles zero escalation", () => {
    expect(calculateAnnualOpEx(14, 5, 0)).toBe(14);
  });
});
