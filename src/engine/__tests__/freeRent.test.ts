import { describe, it, expect } from "vitest";
import { calculateFreeRentSavings } from "../freeRent";

describe("calculateFreeRentSavings", () => {
  it("calculates savings for 3 months free rent", () => {
    // $52/SF * 6000 SF / 12 * 3 = $78,000
    const savings = calculateFreeRentSavings(52, 6000, 3);
    expect(savings).toBe(78000);
  });

  it("returns 0 for zero free months", () => {
    expect(calculateFreeRentSavings(52, 6000, 0)).toBe(0);
  });

  it("calculates for 6 months free rent", () => {
    // $32/SF * 7000 SF / 12 * 6 = $112,000
    const savings = calculateFreeRentSavings(32, 7000, 6);
    expect(savings).toBeCloseTo(112000, 0);
  });
});
