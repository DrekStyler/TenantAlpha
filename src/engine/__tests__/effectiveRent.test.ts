import { describe, it, expect } from "vitest";
import {
  calculateEffectiveRent,
  calculateEffectiveRentWithTI,
  calculateTIGap,
  calculateTIAllowancePerRSF,
  calculateEffectiveRentPerUSF,
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

describe("calculateTIAllowancePerRSF", () => {
  it("calculates TI per RSF correctly", () => {
    // $300,000 / 6000 SF = $50/SF
    expect(calculateTIAllowancePerRSF(300000, 6000)).toBe(50);
  });

  it("returns 0 when no TI allowance", () => {
    expect(calculateTIAllowancePerRSF(undefined, 6000)).toBe(0);
  });

  it("returns 0 for zero SF", () => {
    expect(calculateTIAllowancePerRSF(300000, 0)).toBe(0);
  });
});

describe("calculateEffectiveRentPerUSF", () => {
  it("calculates per USF using usableSF directly", () => {
    // Eff rent $50/RSF, 6000 RSF, 5000 USF
    // Per USF = 50 * (6000 / 5000) = $60/USF
    const result = calculateEffectiveRentPerUSF(50, 6000, 5000);
    expect(result).toBe(60);
  });

  it("calculates per USF using load factor", () => {
    // 15% load factor: USF = 6000 / 1.15 = 5217.39
    // Per USF = 50 * (6000 / 5217.39) = 57.50
    const result = calculateEffectiveRentPerUSF(50, 6000, undefined, 15);
    expect(result).toBeCloseTo(57.5, 1);
  });

  it("prefers usableSF over loadFactor when both provided", () => {
    const result = calculateEffectiveRentPerUSF(50, 6000, 5000, 15);
    // Should use usableSF = 5000, not computed from load factor
    expect(result).toBe(60);
  });

  it("returns null when neither usableSF nor loadFactor provided", () => {
    expect(calculateEffectiveRentPerUSF(50, 6000)).toBeNull();
  });

  it("returns null for zero RSF", () => {
    expect(calculateEffectiveRentPerUSF(50, 0, 5000)).toBeNull();
  });
});
