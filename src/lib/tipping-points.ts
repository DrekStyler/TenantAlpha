import { calculateOptionMetrics } from "@/engine";
import type {
  LeaseOptionInput,
  CalculationConfig,
  ComparisonResult,
} from "@/engine/types";

export interface TippingPoint {
  optionIndex: number;
  optionName: string;
  field: keyof LeaseOptionInput;
  currentValue: number;
  targetValue: number;
  /** Percentage change needed (negative = decrease, positive = increase) */
  changePercent: number;
  /** Direction the tenant would negotiate */
  direction: "lower" | "higher";
}

/**
 * Fields worth analysing for negotiation tipping points.
 * Each entry specifies the search bounds and the direction
 * that benefits the tenant (lower cost or more concessions).
 */
const NEGOTIABLE_FIELDS: {
  field: keyof LeaseOptionInput;
  direction: "lower" | "higher";
  /** Minimum search bound */
  min: (current: number) => number;
  /** Maximum search bound */
  max: (current: number) => number;
}[] = [
  {
    field: "baseRentY1",
    direction: "lower",
    min: () => 0,
    max: (c) => c,
  },
  {
    field: "freeRentMonths",
    direction: "higher",
    min: (c) => c,
    max: () => 24,
  },
  {
    field: "escalationPercent",
    direction: "lower",
    min: () => 0,
    max: (c) => c,
  },
  {
    field: "tiAllowance",
    direction: "higher",
    min: (c) => c,
    max: (c) => Math.max(c * 3, c + 500_000),
  },
  {
    field: "opExPerSF",
    direction: "lower",
    min: () => 0,
    max: (c) => c,
  },
  {
    field: "parkingCostMonthly",
    direction: "lower",
    min: () => 0,
    max: (c) => c,
  },
];

/**
 * Compute tipping points for every non-best option.
 * For each negotiable field, finds the value that would make
 * the option's NPV ≤ the current best option's NPV.
 *
 * Runs entirely client-side using the pure calculation engine.
 */
export function computeTippingPoints(
  inputs: LeaseOptionInput[],
  config: CalculationConfig,
  results: ComparisonResult
): TippingPoint[] {
  const bestOptionName = results.bestValueOption;
  const bestOption = results.options.find(
    (o) => o.optionName === bestOptionName
  );
  if (!bestOption) return [];

  const bestNPV = bestOption.npvOfCosts;
  const tippingPoints: TippingPoint[] = [];

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    if (input.optionName === bestOptionName) continue;

    for (const spec of NEGOTIABLE_FIELDS) {
      const currentValue = input[spec.field] as number | undefined;
      if (currentValue == null || currentValue === 0) {
        // Skip fields that aren't set (e.g. opEx for gross leases)
        // Exception: freeRentMonths can be 0 and negotiable upward
        if (spec.field !== "freeRentMonths") continue;
      }

      const current = currentValue ?? 0;

      // tiAllowance doesn't affect NPV directly — skip the binary search
      // (it affects effective rent with TI, not the cost stream)
      if (spec.field === "tiAllowance") continue;

      const lo = spec.min(current);
      const hi = spec.max(current);

      // Quick check: does the extreme value even flip the ranking?
      const extremeInput = { ...input, [spec.field]: spec.direction === "lower" ? lo : hi };
      const extremeMetrics = calculateOptionMetrics(extremeInput, config);
      if (extremeMetrics.npvOfCosts > bestNPV) {
        // Even at the extreme, can't beat the best — skip
        continue;
      }

      // Binary search for the tipping point
      let searchLo = lo;
      let searchHi = hi;

      for (let iter = 0; iter < 40; iter++) {
        const mid = (searchLo + searchHi) / 2;
        const testInput = { ...input, [spec.field]: mid };
        const testMetrics = calculateOptionMetrics(testInput, config);

        if (testMetrics.npvOfCosts <= bestNPV) {
          // This value works — can we be less aggressive?
          if (spec.direction === "lower") {
            // We want a higher value (less aggressive cut)
            searchLo = mid;
          } else {
            // We want a lower value (less aggressive increase)
            searchHi = mid;
          }
        } else {
          // Doesn't flip yet — need more change
          if (spec.direction === "lower") {
            searchHi = mid;
          } else {
            searchLo = mid;
          }
        }

        if (Math.abs(searchHi - searchLo) < 0.01) break;
      }

      const target = spec.direction === "lower" ? searchLo : searchHi;

      // Round to reasonable precision
      const roundedTarget =
        spec.field === "freeRentMonths"
          ? Math.ceil(target) // free rent months are whole numbers
          : Math.round(target * 100) / 100;

      // Skip if no meaningful change needed
      if (Math.abs(roundedTarget - current) < 0.01) continue;

      const changePercent =
        current !== 0
          ? ((roundedTarget - current) / current) * 100
          : roundedTarget > 0
          ? 100
          : 0;

      tippingPoints.push({
        optionIndex: i,
        optionName: input.optionName,
        field: spec.field,
        currentValue: current,
        targetValue: roundedTarget,
        changePercent: Math.round(changePercent * 10) / 10,
        direction: spec.direction,
      });
    }
  }

  // Sort by smallest absolute change percent (most achievable first)
  tippingPoints.sort(
    (a, b) => Math.abs(a.changePercent) - Math.abs(b.changePercent)
  );

  return tippingPoints;
}
