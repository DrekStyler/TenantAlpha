import { describe, it, expect } from "vitest";
import { calculateDealComparison } from "../index";
import { SAMPLE_OPTIONS } from "@/config/sampleData";

describe("calculateDealComparison", () => {
  const config = {
    discountingMode: { frequency: "monthly" as const },
    includeTIInEffectiveRent: false,
  };

  it("produces results for all 3 sample options", () => {
    const result = calculateDealComparison(SAMPLE_OPTIONS, config);
    expect(result.options).toHaveLength(3);
  });

  it("ranks options by effective rent", () => {
    const result = calculateDealComparison(SAMPLE_OPTIONS, config);
    expect(result.rankedByEffectiveRent).toHaveLength(3);
    // Should be sorted ascending
    const rents = result.options.map((o) => ({
      name: o.optionName,
      rent: o.effectiveRentPerSF,
    }));
    const sorted = [...rents].sort((a, b) => a.rent - b.rent);
    expect(result.rankedByEffectiveRent).toEqual(
      sorted.map((r) => r.name)
    );
  });

  it("ranks options by NPV", () => {
    const result = calculateDealComparison(SAMPLE_OPTIONS, config);
    expect(result.rankedByNPV).toHaveLength(3);
  });

  it("identifies a best value option", () => {
    const result = calculateDealComparison(SAMPLE_OPTIONS, config);
    expect(result.bestValueOption).toBeTruthy();
    expect(
      result.options.some((o) => o.optionName === result.bestValueOption)
    ).toBe(true);
  });

  it("provides at least 2 reasons for best value", () => {
    const result = calculateDealComparison(SAMPLE_OPTIONS, config);
    expect(result.bestValueReasons.length).toBeGreaterThanOrEqual(2);
  });

  it("all metrics are populated for each option", () => {
    const result = calculateDealComparison(SAMPLE_OPTIONS, config);
    result.options.forEach((opt) => {
      expect(opt.totalOccupancyCost).toBeGreaterThan(0);
      expect(opt.effectiveRentPerSF).toBeGreaterThan(0);
      expect(opt.npvOfCosts).toBeGreaterThan(0);
      expect(opt.annualCashFlows.length).toBeGreaterThan(0);
      expect(opt.totalFreeRentSavings).toBeGreaterThan(0);
    });
  });

  it("Option C has zero TI gap", () => {
    const result = calculateDealComparison(SAMPLE_OPTIONS, config);
    const optC = result.options.find((o) =>
      o.optionName.includes("Suburban")
    );
    expect(optC?.tiGap).toBe(0);
  });

  it("Option A has $100,000 TI gap", () => {
    const result = calculateDealComparison(SAMPLE_OPTIONS, config);
    const optA = result.options.find((o) =>
      o.optionName.includes("Downtown")
    );
    expect(optA?.tiGap).toBe(100000);
  });
});
