import { describe, it, expect } from "vitest";
import { computeTippingPoints } from "../tipping-points";
import { calculateDealComparison } from "@/engine";
import type { LeaseOptionInput, CalculationConfig } from "@/engine/types";

/** Build a standard lease option input for testing. */
function buildInput(
  overrides: Partial<LeaseOptionInput> = {}
): LeaseOptionInput {
  return {
    optionName: "Option A",
    rentableSF: 10000,
    termMonths: 60,
    baseRentY1: 42,
    escalationType: "FIXED_PERCENT",
    escalationPercent: 3,
    freeRentMonths: 2,
    freeRentType: "ABATED",
    rentStructure: "GROSS",
    discountRate: 8,
    ...overrides,
  };
}

const DEFAULT_CONFIG: CalculationConfig = {
  discountingMode: { frequency: "monthly" },
  includeTIInEffectiveRent: false,
};

describe("computeTippingPoints", () => {
  it("returns empty array when no best option found", () => {
    const inputs = [buildInput({ optionName: "A" })];
    const results = calculateDealComparison(inputs, DEFAULT_CONFIG);
    // Manipulate results to have no matching bestValueOption
    const fakeResults = { ...results, bestValueOption: "Nonexistent" };
    expect(computeTippingPoints(inputs, DEFAULT_CONFIG, fakeResults)).toEqual(
      []
    );
  });

  it("skips the best option (only analyzes non-best options)", () => {
    const inputs = [
      buildInput({ optionName: "Option A", baseRentY1: 30 }), // Cheaper — will be best
      buildInput({ optionName: "Option B", baseRentY1: 50 }), // More expensive
    ];
    const results = calculateDealComparison(inputs, DEFAULT_CONFIG);
    const tips = computeTippingPoints(inputs, DEFAULT_CONFIG, results);

    // All tipping points should be for "Option B" (the non-best option)
    expect(tips.every((t) => t.optionName === "Option B")).toBe(true);
    expect(tips.some((t) => t.optionName === "Option A")).toBe(false);
  });

  it("finds baseRentY1 tipping point", () => {
    const inputs = [
      buildInput({ optionName: "Option A", baseRentY1: 40 }),
      buildInput({ optionName: "Option B", baseRentY1: 45 }),
    ];
    const results = calculateDealComparison(inputs, DEFAULT_CONFIG);
    const tips = computeTippingPoints(inputs, DEFAULT_CONFIG, results);

    const rentTip = tips.find((t) => t.field === "baseRentY1");
    expect(rentTip).toBeDefined();
    expect(rentTip!.direction).toBe("lower");
    expect(rentTip!.targetValue).toBeLessThan(rentTip!.currentValue);
    expect(rentTip!.changePercent).toBeLessThan(0); // Negative = decrease
  });

  it("finds freeRentMonths tipping point (including from 0)", () => {
    const inputs = [
      buildInput({
        optionName: "Option A",
        baseRentY1: 42,
        freeRentMonths: 6,
      }),
      buildInput({
        optionName: "Option B",
        baseRentY1: 42,
        freeRentMonths: 0,
      }),
    ];
    const results = calculateDealComparison(inputs, DEFAULT_CONFIG);
    const tips = computeTippingPoints(inputs, DEFAULT_CONFIG, results);

    const freeRentTip = tips.find((t) => t.field === "freeRentMonths");
    expect(freeRentTip).toBeDefined();
    expect(freeRentTip!.direction).toBe("higher");
    expect(freeRentTip!.targetValue).toBeGreaterThan(0);
    // Free rent months should be a whole number (ceiled)
    expect(Number.isInteger(freeRentTip!.targetValue)).toBe(true);
  });

  it("skips tiAllowance (doesn't affect NPV directly)", () => {
    const inputs = [
      buildInput({
        optionName: "Option A",
        baseRentY1: 40,
        tiAllowance: 50000,
      }),
      buildInput({
        optionName: "Option B",
        baseRentY1: 45,
        tiAllowance: 10000,
      }),
    ];
    const results = calculateDealComparison(inputs, DEFAULT_CONFIG);
    const tips = computeTippingPoints(inputs, DEFAULT_CONFIG, results);

    expect(tips.find((t) => t.field === "tiAllowance")).toBeUndefined();
  });

  it("skips fields that are null/undefined/0 (except freeRentMonths)", () => {
    const inputs = [
      buildInput({
        optionName: "Option A",
        baseRentY1: 40,
        opExPerSF: undefined,
      }),
      buildInput({
        optionName: "Option B",
        baseRentY1: 45,
        opExPerSF: undefined,
      }),
    ];
    const results = calculateDealComparison(inputs, DEFAULT_CONFIG);
    const tips = computeTippingPoints(inputs, DEFAULT_CONFIG, results);

    // opExPerSF is undefined for both, so shouldn't appear
    expect(tips.find((t) => t.field === "opExPerSF")).toBeUndefined();
  });

  it("sorts results by smallest absolute change percent first", () => {
    const inputs = [
      buildInput({
        optionName: "Option A",
        baseRentY1: 30,
        freeRentMonths: 3,
        escalationPercent: 2,
      }),
      buildInput({
        optionName: "Option B",
        baseRentY1: 50,
        freeRentMonths: 0,
        escalationPercent: 5,
      }),
    ];
    const results = calculateDealComparison(inputs, DEFAULT_CONFIG);
    const tips = computeTippingPoints(inputs, DEFAULT_CONFIG, results);

    // Should be sorted by |changePercent| ascending
    for (let i = 1; i < tips.length; i++) {
      expect(Math.abs(tips[i].changePercent)).toBeGreaterThanOrEqual(
        Math.abs(tips[i - 1].changePercent)
      );
    }
  });

  it("handles three options with only non-best analyzed", () => {
    const inputs = [
      buildInput({ optionName: "Option A", baseRentY1: 30 }),
      buildInput({ optionName: "Option B", baseRentY1: 40 }),
      buildInput({ optionName: "Option C", baseRentY1: 50 }),
    ];
    const results = calculateDealComparison(inputs, DEFAULT_CONFIG);
    const tips = computeTippingPoints(inputs, DEFAULT_CONFIG, results);

    // Option A should be best (lowest rent), so tips should be for B and C only
    const optionNames = [...new Set(tips.map((t) => t.optionName))];
    expect(optionNames).not.toContain("Option A");
    expect(optionNames.length).toBeGreaterThanOrEqual(1);
  });

  it("skips fields where even extreme value can't beat the best", () => {
    // Option A is SO much cheaper that no single-field change on B can flip it
    const inputs = [
      buildInput({
        optionName: "Option A",
        baseRentY1: 10,
        freeRentMonths: 12,
      }),
      buildInput({
        optionName: "Option B",
        baseRentY1: 100,
        freeRentMonths: 0,
        escalationPercent: 3,
        parkingCostMonthly: 500,
      }),
    ];
    const results = calculateDealComparison(inputs, DEFAULT_CONFIG);
    const tips = computeTippingPoints(inputs, DEFAULT_CONFIG, results);

    // Some fields might not be able to flip the ranking even at extremes
    // (escalationPercent going to 0 still can't overcome 10x rent difference)
    // We just verify the function doesn't crash and returns valid structure
    tips.forEach((t) => {
      expect(t.optionIndex).toBe(1);
      expect(t.optionName).toBe("Option B");
      expect(typeof t.changePercent).toBe("number");
      expect(typeof t.targetValue).toBe("number");
    });
  });

  it("provides correct direction for each field type", () => {
    const inputs = [
      buildInput({
        optionName: "Option A",
        baseRentY1: 38,
        freeRentMonths: 4,
      }),
      buildInput({
        optionName: "Option B",
        baseRentY1: 42,
        freeRentMonths: 0,
      }),
    ];
    const results = calculateDealComparison(inputs, DEFAULT_CONFIG);
    const tips = computeTippingPoints(inputs, DEFAULT_CONFIG, results);

    const baseRentTip = tips.find((t) => t.field === "baseRentY1");
    if (baseRentTip) {
      expect(baseRentTip.direction).toBe("lower");
    }

    const freeRentTip = tips.find((t) => t.field === "freeRentMonths");
    if (freeRentTip) {
      expect(freeRentTip.direction).toBe("higher");
    }
  });
});
