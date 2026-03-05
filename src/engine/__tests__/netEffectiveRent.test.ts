import { describe, it, expect } from "vitest";
import { calculateNetEffectiveRent } from "../netEffectiveRent";
import { calculateMonthlyBreakdown } from "../occupancyCost";
import { SAMPLE_OPTIONS } from "@/config/sampleData";

describe("calculateNetEffectiveRent", () => {
  it("calculates NER for a gross lease with abated free rent", () => {
    const input = SAMPLE_OPTIONS[0]; // 6000 SF, 60 months, $52/SF, 3% escalation, 3 free months abated
    const breakdown = calculateMonthlyBreakdown(input);
    const ner = calculateNetEffectiveRent(
      breakdown,
      input.rentableSF,
      input.termMonths
    );

    // NER reflects rent-only cost averaged over term.
    // With 3% annual escalation over 5 years and 3 free months,
    // NER will be close to but slightly above Y1 base rent ($52).
    // The escalation effect outweighs the 3 free months for this scenario.
    expect(ner).toBeGreaterThan(45);
    expect(ner).toBeLessThan(60);
  });

  it("calculates NER excluding OpEx, parking, and other fees", () => {
    const input = SAMPLE_OPTIONS[2]; // NNN lease with OpEx
    const breakdown = calculateMonthlyBreakdown(input);
    const ner = calculateNetEffectiveRent(
      breakdown,
      input.rentableSF,
      input.termMonths
    );

    // NER should be based only on rent, not OpEx
    // Base rent Y1 is $32/SF, so NER should be in that neighborhood
    expect(ner).toBeLessThan(40);
    expect(ner).toBeGreaterThan(20);
  });

  it("returns 0 for zero SF", () => {
    const breakdown = calculateMonthlyBreakdown(SAMPLE_OPTIONS[0]);
    expect(calculateNetEffectiveRent(breakdown, 0, 60)).toBe(0);
  });

  it("returns 0 for zero term", () => {
    const breakdown = calculateMonthlyBreakdown(SAMPLE_OPTIONS[0]);
    expect(calculateNetEffectiveRent(breakdown, 6000, 0)).toBe(0);
  });

  it("NER matches rent-only effective rent for a lease with no free rent", () => {
    const input = {
      ...SAMPLE_OPTIONS[0],
      freeRentMonths: 0,
      parkingCostMonthly: 0,
    };
    const breakdown = calculateMonthlyBreakdown(input);
    const totalRent = breakdown.reduce((sum, m) => sum + m.rent, 0);
    const ner = calculateNetEffectiveRent(
      breakdown,
      input.rentableSF,
      input.termMonths
    );

    // Should equal total rent / RSF / termYears
    const expected = totalRent / input.rentableSF / (input.termMonths / 12);
    expect(ner).toBeCloseTo(expected, 2);
  });

  it("NER for abated is lower than NER without free rent", () => {
    const inputNoFree = {
      ...SAMPLE_OPTIONS[0],
      freeRentMonths: 0,
      parkingCostMonthly: 0,
    };
    const inputAbated = {
      ...SAMPLE_OPTIONS[0],
      freeRentType: "ABATED" as const,
      freeRentMonths: 3,
      parkingCostMonthly: 0,
    };

    const breakdownNoFree = calculateMonthlyBreakdown(inputNoFree);
    const breakdownAbated = calculateMonthlyBreakdown(inputAbated);

    const nerNoFree = calculateNetEffectiveRent(
      breakdownNoFree,
      inputNoFree.rentableSF,
      inputNoFree.termMonths
    );
    const nerAbated = calculateNetEffectiveRent(
      breakdownAbated,
      inputAbated.rentableSF,
      inputAbated.termMonths
    );

    // Abated free rent means $0 for first 3 months, so NER should be lower
    expect(nerAbated).toBeLessThan(nerNoFree);
  });
});
