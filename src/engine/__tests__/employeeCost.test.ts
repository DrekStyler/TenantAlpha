import { describe, it, expect } from "vitest";
import { calculateCostPerEmployee } from "../employeeCost";

describe("calculateCostPerEmployee", () => {
  it("calculates annual cost per employee", () => {
    // Total cost $600,000 over 60 months (5 years) = $120,000/year
    // $120,000 / 50 employees = $2,400/employee/year
    expect(calculateCostPerEmployee(600000, 60, 50)).toBeCloseTo(2400, 0);
  });

  it("returns null when employees is undefined", () => {
    expect(calculateCostPerEmployee(600000, 60, undefined)).toBeNull();
  });

  it("returns null when employees is 0", () => {
    expect(calculateCostPerEmployee(600000, 60, 0)).toBeNull();
  });

  it("returns null when employees is negative", () => {
    expect(calculateCostPerEmployee(600000, 60, -5)).toBeNull();
  });

  it("returns null when term months is 0", () => {
    expect(calculateCostPerEmployee(600000, 0, 50)).toBeNull();
  });

  it("handles single employee", () => {
    // $240,000 over 24 months (2 years) = $120,000/year / 1 = $120,000
    expect(calculateCostPerEmployee(240000, 24, 1)).toBeCloseTo(120000, 0);
  });

  it("handles short-term lease", () => {
    // $50,000 over 6 months (0.5 years) = $100,000/year / 10 = $10,000
    expect(calculateCostPerEmployee(50000, 6, 10)).toBeCloseTo(10000, 0);
  });

  it("handles zero total occupancy cost", () => {
    // Edge case: $0 cost, still valid math
    expect(calculateCostPerEmployee(0, 60, 50)).toBe(0);
  });

  it("handles very large employee count", () => {
    // $1,200,000 over 12 months = $1,200,000/year / 1000 = $1,200
    expect(calculateCostPerEmployee(1200000, 12, 1000)).toBeCloseTo(1200, 0);
  });
});
