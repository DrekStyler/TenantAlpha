import { describe, it, expect } from "vitest";
import { calculatePaybackPeriod } from "../paybackPeriod";
import type { MonthlyCost } from "../types";

/** Helper: build an array of monthly costs with constant values. */
function constantMonthlyCosts(
  total: number,
  months: number
): MonthlyCost[] {
  return Array.from({ length: months }, (_, i) => ({
    month: i + 1,
    rent: total * 0.7,
    baseRent: total * 0.7,
    opEx: total * 0.2,
    parking: 0,
    otherFees: total * 0.1,
    total,
  }));
}

describe("calculatePaybackPeriod", () => {
  describe("returns null when no payback needed", () => {
    it("returns null when tiGap is 0", () => {
      const costs = constantMonthlyCosts(5000, 60);
      expect(calculatePaybackPeriod(0, costs)).toBeNull();
    });

    it("returns null when tiGap is negative", () => {
      const costs = constantMonthlyCosts(5000, 60);
      expect(calculatePaybackPeriod(-10000, costs)).toBeNull();
    });
  });

  describe("simple payback (no revenue data)", () => {
    it("calculates payback from average monthly cost", () => {
      // TI gap $50,000 / avg monthly cost $5,000 = 10 months
      const costs = constantMonthlyCosts(5000, 60);
      expect(calculatePaybackPeriod(50000, costs)).toBe(10);
    });

    it("rounds up to next whole month", () => {
      // TI gap $12,000 / avg monthly cost $5,000 = 2.4 → 3 months
      const costs = constantMonthlyCosts(5000, 60);
      expect(calculatePaybackPeriod(12000, costs)).toBe(3);
    });

    it("handles large TI gap relative to costs", () => {
      // TI gap $600,000 / avg monthly cost $5,000 = 120 months
      const costs = constantMonthlyCosts(5000, 60);
      expect(calculatePaybackPeriod(600000, costs)).toBe(120);
    });

    it("returns null when average monthly cost is zero", () => {
      const costs = constantMonthlyCosts(0, 60);
      expect(calculatePaybackPeriod(10000, costs)).toBeNull();
    });

    it("returns null when average monthly cost is negative", () => {
      const costs: MonthlyCost[] = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        rent: -3000,
        baseRent: -3000,
        opEx: 0,
        parking: 0,
        otherFees: 0,
        total: -3000,
      }));
      expect(calculatePaybackPeriod(5000, costs)).toBeNull();
    });
  });

  describe("revenue-based payback", () => {
    it("calculates payback when revenue exceeds costs", () => {
      // Monthly revenue = $120,000/12 = $10,000, monthly cost = $5,000
      // Net benefit = $5,000/month, TI gap $15,000 → 3 months
      const costs = constantMonthlyCosts(5000, 60);
      expect(calculatePaybackPeriod(15000, costs, 120000)).toBe(3);
    });

    it("returns full term when revenue never covers TI gap", () => {
      // Monthly revenue = $60,000/12 = $5,000, monthly cost = $5,000
      // Net benefit = $0/month → never recoups
      const costs = constantMonthlyCosts(5000, 60);
      expect(calculatePaybackPeriod(50000, costs, 60000)).toBe(60);
    });

    it("returns full term when costs exceed revenue", () => {
      // Monthly revenue = $12,000/12 = $1,000, monthly cost = $5,000
      // Net benefit = -$4,000 → no accumulation
      const costs = constantMonthlyCosts(5000, 60);
      expect(calculatePaybackPeriod(10000, costs, 12000)).toBe(60);
    });

    it("applies revenue growth rate", () => {
      // Revenue $60,000, growth 100% → year 1 = $5k/mo, year 2 = $10k/mo
      // Month 1-12: revenue $5k - cost $5k = $0 net benefit
      // Month 13+: revenue $10k - cost $5k = $5k/mo
      // TI gap $10,000 / $5k/mo = 2 months into year 2 → month 14
      const costs = constantMonthlyCosts(5000, 36);
      expect(calculatePaybackPeriod(10000, costs, 60000, 100)).toBe(14);
    });

    it("skips revenue path when annualRevenue is 0", () => {
      const costs = constantMonthlyCosts(5000, 60);
      // Should fall through to simple calculation: 25,000 / 5,000 = 5
      expect(calculatePaybackPeriod(25000, costs, 0)).toBe(5);
    });

    it("skips revenue path when annualRevenue is undefined", () => {
      const costs = constantMonthlyCosts(5000, 60);
      expect(calculatePaybackPeriod(25000, costs, undefined)).toBe(5);
    });

    it("defaults expectedRevenueGrowth to 0 when undefined", () => {
      // No growth: monthly revenue = $120k/12 = $10k, cost = $5k
      // Net = $5k/mo, TI gap = $20k → 4 months
      const costs = constantMonthlyCosts(5000, 60);
      expect(calculatePaybackPeriod(20000, costs, 120000, undefined)).toBe(4);
    });
  });
});
