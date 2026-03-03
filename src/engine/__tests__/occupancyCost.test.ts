import { describe, it, expect } from "vitest";
import {
  calculateMonthlyBreakdown,
  calculateTotalOccupancyCost,
} from "../occupancyCost";
import { SAMPLE_OPTIONS } from "@/config/sampleData";

describe("calculateMonthlyBreakdown", () => {
  it("returns correct number of months", () => {
    const months = calculateMonthlyBreakdown(SAMPLE_OPTIONS[0]);
    expect(months).toHaveLength(60);
  });

  it("applies abated free rent (zero rent in free months)", () => {
    const months = calculateMonthlyBreakdown(SAMPLE_OPTIONS[0]);
    // Option A has 3 months free rent (abated)
    expect(months[0].rent).toBe(0);
    expect(months[1].rent).toBe(0);
    expect(months[2].rent).toBe(0);
    // Month 4 should have rent
    expect(months[3].rent).toBeGreaterThan(0);
  });

  it("includes parking costs every month", () => {
    const months = calculateMonthlyBreakdown(SAMPLE_OPTIONS[0]);
    // Option A: $3,000/mo parking
    expect(months[0].parking).toBe(3000);
    expect(months[59].parking).toBe(3000);
  });

  it("calculates correct monthly rent in non-free months (year 1)", () => {
    const months = calculateMonthlyBreakdown(SAMPLE_OPTIONS[0]);
    // Option A: $52/SF * 6000 SF / 12 = $26,000/mo
    expect(months[3].rent).toBeCloseTo(26000, 0);
  });

  it("applies escalation in year 2", () => {
    const months = calculateMonthlyBreakdown(SAMPLE_OPTIONS[0]);
    // Year 2, month 13: $52 * 1.03 * 6000 / 12 = $26,780
    expect(months[12].rent).toBeCloseTo(26780, 0);
  });

  it("handles NNN structure with OpEx", () => {
    const months = calculateMonthlyBreakdown(SAMPLE_OPTIONS[2]);
    // Option C: NNN with $14/SF OpEx, 7000 SF
    // OpEx year 1: $14 * 7000 / 12 = $8,166.67
    expect(months[6].opEx).toBeCloseTo(8166.67, 0);
  });

  it("handles deferred free rent", () => {
    const input = {
      ...SAMPLE_OPTIONS[0],
      freeRentType: "DEFERRED" as const,
      freeRentMonths: 3,
    };
    const months = calculateMonthlyBreakdown(input);
    // With deferred, all months have rent, but last months have extra
    expect(months[0].rent).toBeGreaterThan(0);
    // Last 3 months should have extra deferred rent
    const lastMonth = months[59];
    const normalMonth = months[30]; // Mid-lease month in year 3
    expect(lastMonth.rent).toBeGreaterThan(normalMonth.rent);
  });
});

describe("calculateTotalOccupancyCost", () => {
  it("calculates total for Option A", () => {
    const total = calculateTotalOccupancyCost(SAMPLE_OPTIONS[0]);
    // Should be > $1M for a 5-year lease at $52/SF for 6000 SF
    expect(total).toBeGreaterThan(1000000);
  });

  it("Option C total includes OpEx", () => {
    const totalC = calculateTotalOccupancyCost(SAMPLE_OPTIONS[2]);
    // 7-year NNN lease should include significant OpEx
    expect(totalC).toBeGreaterThan(1500000);
  });

  it("gross lease has zero OpEx", () => {
    const months = calculateMonthlyBreakdown(SAMPLE_OPTIONS[0]);
    const totalOpEx = months.reduce((s, m) => s + m.opEx, 0);
    expect(totalOpEx).toBe(0);
  });
});
