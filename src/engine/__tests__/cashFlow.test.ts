import { describe, it, expect } from "vitest";
import { calculateAnnualCashFlows } from "../cashFlow";
import { calculateMonthlyBreakdown } from "../occupancyCost";
import { SAMPLE_OPTIONS } from "@/config/sampleData";

describe("calculateAnnualCashFlows", () => {
  it("returns correct number of years for 60-month term", () => {
    const monthly = calculateMonthlyBreakdown(SAMPLE_OPTIONS[0]);
    const annual = calculateAnnualCashFlows(monthly, 60);
    expect(annual).toHaveLength(5);
  });

  it("returns correct number of years for 84-month term", () => {
    const monthly = calculateMonthlyBreakdown(SAMPLE_OPTIONS[2]);
    const annual = calculateAnnualCashFlows(monthly, 84);
    expect(annual).toHaveLength(7);
  });

  it("year 1 cost is lower due to free rent for Option A", () => {
    const monthly = calculateMonthlyBreakdown(SAMPLE_OPTIONS[0]);
    const annual = calculateAnnualCashFlows(monthly, 60);
    // Year 1 has 3 months free rent, should be lower than year 2
    expect(annual[0].totalCost).toBeLessThan(annual[1].totalCost);
  });

  it("cumulative cost matches sum of all years", () => {
    const monthly = calculateMonthlyBreakdown(SAMPLE_OPTIONS[0]);
    const annual = calculateAnnualCashFlows(monthly, 60);
    const lastYear = annual[annual.length - 1];
    const sumAll = annual.reduce((s, a) => s + a.totalCost, 0);
    expect(lastYear.cumulativeCost).toBeCloseTo(sumAll, 2);
  });

  it("cumulative cost increases monotonically", () => {
    const monthly = calculateMonthlyBreakdown(SAMPLE_OPTIONS[1]);
    const annual = calculateAnnualCashFlows(monthly, 60);
    for (let i = 1; i < annual.length; i++) {
      expect(annual[i].cumulativeCost).toBeGreaterThan(
        annual[i - 1].cumulativeCost
      );
    }
  });

  it("annual total equals sum of components", () => {
    const monthly = calculateMonthlyBreakdown(SAMPLE_OPTIONS[2]);
    const annual = calculateAnnualCashFlows(monthly, 84);
    annual.forEach((a) => {
      const componentSum = a.baseRent + a.opEx + a.parking + a.otherFees;
      expect(a.totalCost).toBeCloseTo(componentSum, 2);
    });
  });
});
