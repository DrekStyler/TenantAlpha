import { describe, it, expect } from "vitest";
import { calculateStraightLineRent } from "../straightLineRent";
import { calculateMonthlyBreakdown } from "../occupancyCost";
import { SAMPLE_OPTIONS } from "@/config/sampleData";

describe("calculateStraightLineRent", () => {
  it("calculates average monthly rent for a gross lease", () => {
    const input = SAMPLE_OPTIONS[0]; // 6000 SF, 60 months, $52/SF, 3 free months abated
    const breakdown = calculateMonthlyBreakdown(input);
    const slr = calculateStraightLineRent(breakdown, input.termMonths);

    // Total rent over 60 months (with 3 free), spread evenly
    // Monthly base = $52 * 6000 / 12 = $26,000
    // With escalation and 3 free months, SLR should be less than $26k
    expect(slr).toBeGreaterThan(20000);
    expect(slr).toBeLessThan(30000);
  });

  it("returns 0 for zero term", () => {
    expect(calculateStraightLineRent([], 0)).toBe(0);
  });

  it("smooths out escalations to a single average", () => {
    const input = {
      ...SAMPLE_OPTIONS[0],
      freeRentMonths: 0,
      escalationPercent: 5.0,
    };
    const breakdown = calculateMonthlyBreakdown(input);
    const slr = calculateStraightLineRent(breakdown, input.termMonths);

    // Month 1 rent and last month rent should be different (escalation)
    // but SLR is the average
    const firstMonthRent = breakdown[0].rent;
    const lastMonthRent = breakdown[breakdown.length - 1].rent;
    expect(lastMonthRent).toBeGreaterThan(firstMonthRent);
    expect(slr).toBeGreaterThan(firstMonthRent);
    expect(slr).toBeLessThan(lastMonthRent);
  });

  it("straight-line rent for NNN lease only includes rent, not OpEx", () => {
    const input = SAMPLE_OPTIONS[2]; // NNN with OpEx
    const breakdown = calculateMonthlyBreakdown(input);
    const slr = calculateStraightLineRent(breakdown, input.termMonths);

    // SLR should be based on rent only
    // Total with OpEx would be higher
    const totalIncludingOpEx =
      breakdown.reduce((s, m) => s + m.total, 0) / input.termMonths;
    expect(slr).toBeLessThan(totalIncludingOpEx);
  });
});
