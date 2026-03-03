import { describe, it, expect } from "vitest";
import {
  calculateEffectiveRent,
  calculateEffectiveRentWithTI,
  calculateTIGap,
} from "../effectiveRent";
import { SAMPLE_OPTIONS } from "@/config/sampleData";

describe("calculateTIGap", () => {
  it("calculates gap correctly when buildout > allowance", () => {
    expect(calculateTIGap(SAMPLE_OPTIONS[0])).toBe(100000);
  });

  it("returns 0 when allowance >= buildout", () => {
    expect(calculateTIGap(SAMPLE_OPTIONS[2])).toBe(0);
  });

  it("returns 0 when buildout not provided", () => {
    const input = { ...SAMPLE_OPTIONS[0], estimatedBuildoutCost: undefined };
    expect(calculateTIGap(input)).toBe(0);
  });
});

describe("calculateEffectiveRent", () => {
  it("calculates effective rent per SF per year", () => {
    // 1,500,000 / 6000 / 5 = 50
    const result = calculateEffectiveRent(1500000, 6000, 60);
    expect(result).toBe(50);
  });

  it("returns 0 for zero SF", () => {
    expect(calculateEffectiveRent(1000000, 0, 60)).toBe(0);
  });

  it("returns 0 for zero term", () => {
    expect(calculateEffectiveRent(1000000, 6000, 0)).toBe(0);
  });
});

describe("calculateEffectiveRentWithTI", () => {
  it("includes TI gap in effective rent", () => {
    // (1,500,000 + 100,000) / 6000 / 5 = 53.33
    const result = calculateEffectiveRentWithTI(1500000, 100000, 6000, 60);
    expect(result).toBeCloseTo(53.33, 2);
  });

  it("equals effective rent when TI gap is 0", () => {
    const withoutTI = calculateEffectiveRent(1500000, 6000, 60);
    const withTI = calculateEffectiveRentWithTI(1500000, 0, 6000, 60);
    expect(withTI).toBe(withoutTI);
  });
});
