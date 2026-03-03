import { describe, it, expect } from "vitest";
import { calculateNPV } from "../npv";
import { calculateMonthlyBreakdown } from "../occupancyCost";
import { calculateAnnualCashFlows } from "../cashFlow";
import { SAMPLE_OPTIONS } from "@/config/sampleData";

describe("calculateNPV", () => {
  const input = SAMPLE_OPTIONS[0];
  const monthly = calculateMonthlyBreakdown(input);
  const annual = calculateAnnualCashFlows(monthly, input.termMonths);

  it("calculates monthly NPV", () => {
    const npv = calculateNPV(monthly, annual, 8, { frequency: "monthly" });
    // NPV should be less than total (discounting reduces value)
    const total = monthly.reduce((s, m) => s + m.total, 0);
    expect(npv).toBeLessThan(total);
    expect(npv).toBeGreaterThan(0);
  });

  it("calculates annual NPV", () => {
    const npv = calculateNPV(monthly, annual, 8, { frequency: "annual" });
    const total = annual.reduce((s, a) => s + a.totalCost, 0);
    expect(npv).toBeLessThan(total);
    expect(npv).toBeGreaterThan(0);
  });

  it("monthly NPV is close to but different from annual NPV", () => {
    const npvMonthly = calculateNPV(monthly, annual, 8, {
      frequency: "monthly",
    });
    const npvAnnual = calculateNPV(monthly, annual, 8, {
      frequency: "annual",
    });
    // Should be within 5% of each other
    const diff = Math.abs(npvMonthly - npvAnnual) / npvMonthly;
    expect(diff).toBeLessThan(0.05);
  });

  it("higher discount rate produces lower NPV", () => {
    const npv8 = calculateNPV(monthly, annual, 8, { frequency: "monthly" });
    const npv12 = calculateNPV(monthly, annual, 12, { frequency: "monthly" });
    expect(npv12).toBeLessThan(npv8);
  });

  it("zero discount rate equals nominal total", () => {
    const npv0 = calculateNPV(monthly, annual, 0, { frequency: "annual" });
    const total = annual.reduce((s, a) => s + a.totalCost, 0);
    expect(npv0).toBeCloseTo(total, 0);
  });
});
