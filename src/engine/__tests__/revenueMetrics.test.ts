import { describe, it, expect } from "vitest";
import {
  calculateRentAsPercentOfRevenue,
  calculateRentAsPercentOfRevenueByYear,
} from "../revenueMetrics";
import type { AnnualCashFlow } from "../types";

/** Helper: build annual cash flows with constant total costs. */
function buildCashFlows(
  years: number,
  annualCost: number
): AnnualCashFlow[] {
  return Array.from({ length: years }, (_, i) => ({
    year: i + 1,
    baseRent: annualCost * 0.7,
    opEx: annualCost * 0.2,
    parking: 0,
    otherFees: annualCost * 0.1,
    totalCost: annualCost,
    cumulativeCost: annualCost * (i + 1),
  }));
}

describe("calculateRentAsPercentOfRevenue", () => {
  it("calculates Year 1 cost as percent of revenue", () => {
    const flows = buildCashFlows(5, 100000);
    // 100,000 / 500,000 * 100 = 20%
    expect(calculateRentAsPercentOfRevenue(flows, 500000)).toBeCloseTo(20, 1);
  });

  it("returns null when annualRevenue is undefined", () => {
    const flows = buildCashFlows(5, 100000);
    expect(calculateRentAsPercentOfRevenue(flows, undefined)).toBeNull();
  });

  it("returns null when annualRevenue is 0", () => {
    const flows = buildCashFlows(5, 100000);
    expect(calculateRentAsPercentOfRevenue(flows, 0)).toBeNull();
  });

  it("returns null when annualRevenue is negative", () => {
    const flows = buildCashFlows(5, 100000);
    expect(calculateRentAsPercentOfRevenue(flows, -50000)).toBeNull();
  });

  it("returns null when cash flows array is empty", () => {
    expect(calculateRentAsPercentOfRevenue([], 500000)).toBeNull();
  });

  it("ignores expectedRevenueGrowth (only uses Year 1)", () => {
    const flows = buildCashFlows(5, 100000);
    // Same result regardless of growth — function only uses Year 1
    const noGrowth = calculateRentAsPercentOfRevenue(flows, 500000, 0);
    const withGrowth = calculateRentAsPercentOfRevenue(flows, 500000, 10);
    expect(noGrowth).toEqual(withGrowth);
  });

  it("handles very high rent as percent of revenue", () => {
    const flows = buildCashFlows(1, 900000);
    // 900,000 / 1,000,000 * 100 = 90%
    expect(calculateRentAsPercentOfRevenue(flows, 1000000)).toBeCloseTo(90, 1);
  });

  it("handles rent exceeding revenue", () => {
    const flows = buildCashFlows(1, 200000);
    // 200,000 / 100,000 * 100 = 200%
    expect(calculateRentAsPercentOfRevenue(flows, 100000)).toBeCloseTo(200, 1);
  });
});

describe("calculateRentAsPercentOfRevenueByYear", () => {
  it("calculates percentage for each year with no growth", () => {
    const flows = buildCashFlows(3, 100000);
    const result = calculateRentAsPercentOfRevenueByYear(flows, 500000, 0);
    // All years: 100k / 500k = 20%
    expect(result).toHaveLength(3);
    expect(result[0]).toBeCloseTo(20, 1);
    expect(result[1]).toBeCloseTo(20, 1);
    expect(result[2]).toBeCloseTo(20, 1);
  });

  it("applies revenue growth to reduce percentage over time", () => {
    const flows = buildCashFlows(3, 100000);
    const result = calculateRentAsPercentOfRevenueByYear(flows, 500000, 10);
    // Year 1: 100k / 500k = 20%
    // Year 2: 100k / 550k = 18.18%
    // Year 3: 100k / 605k = 16.53%
    expect(result[0]).toBeCloseTo(20, 1);
    expect(result[1]).toBeCloseTo(18.18, 1);
    expect(result[2]).toBeCloseTo(16.53, 1);
  });

  it("returns array of nulls when no revenue", () => {
    const flows = buildCashFlows(3, 100000);
    const result = calculateRentAsPercentOfRevenueByYear(flows, undefined, 5);
    expect(result).toEqual([null, null, null]);
  });

  it("returns array of nulls when revenue is 0", () => {
    const flows = buildCashFlows(3, 100000);
    expect(calculateRentAsPercentOfRevenueByYear(flows, 0, 5)).toEqual([
      null,
      null,
      null,
    ]);
  });

  it("returns empty array when no cash flows", () => {
    expect(calculateRentAsPercentOfRevenueByYear([], 500000, 5)).toEqual([]);
  });

  it("defaults growth rate to 0 when undefined", () => {
    const flows = buildCashFlows(2, 100000);
    const result = calculateRentAsPercentOfRevenueByYear(
      flows,
      500000,
      undefined
    );
    // Both years should be 20% (no growth)
    expect(result[0]).toBeCloseTo(20, 1);
    expect(result[1]).toBeCloseTo(20, 1);
  });

  it("handles negative revenue growth", () => {
    const flows = buildCashFlows(2, 100000);
    const result = calculateRentAsPercentOfRevenueByYear(flows, 500000, -10);
    // Year 1: 100k / 500k = 20%
    // Year 2: 100k / 450k = 22.22% (revenue shrank, % goes up)
    expect(result[0]).toBeCloseTo(20, 1);
    expect(result[1]).toBeCloseTo(22.22, 1);
  });
});
