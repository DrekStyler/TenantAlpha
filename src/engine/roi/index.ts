export type {
  IndustryType,
  CostAvoidanceROI,
  ProductivityROI,
  StrategicROI,
  CapitalROI,
  ROIOutputs,
  CostAvoidanceInput,
  ProductivityInput,
  StrategicInput,
  CapitalInput,
  FullROIInput,
} from "./types";

export { calculateCostAvoidanceROI } from "./costAvoidance";
export { calculateProductivityROI } from "./productivity";
export { calculateStrategicROI } from "./strategic";
export { calculateCapitalROI } from "./capital";
export { INDUSTRY_BENCHMARKS, getIndustryBenchmarks } from "./benchmarks";

// Industry-specific exports
export { calculateClinicalROI } from "./industry/medical";
export { calculateLegalROI } from "./industry/legal";
export { calculateAerospaceROI } from "./industry/aerospace";
export { calculateTechROI } from "./industry/tech";
export { calculateFinancialROI } from "./industry/financial";

import type { FullROIInput, ROIOutputs } from "./types";
import { calculateCostAvoidanceROI } from "./costAvoidance";
import { calculateProductivityROI } from "./productivity";
import { calculateStrategicROI } from "./strategic";
import { calculateCapitalROI } from "./capital";

/**
 * Calculate all 4 ROI frameworks for a lease option.
 */
export function calculateFullROI(
  input: FullROIInput,
  industrySpecificMetrics: Record<string, number | string> = {}
): ROIOutputs {
  const costAvoidance = calculateCostAvoidanceROI(input.costAvoidance);
  const productivity = calculateProductivityROI(input.productivity);
  const strategic = calculateStrategicROI(input.strategic);
  const capital = calculateCapitalROI(input.capital);

  // Weighted composite ROI (cost avoidance 30%, productivity 30%, strategic 20%, capital 20%)
  const capitalROIForComposite =
    capital.effectiveCapitalROI === Infinity
      ? 100
      : capital.effectiveCapitalROI;

  const compositeROI =
    costAvoidance.roiPercent * 0.30 +
    productivity.roiPercent * 0.30 +
    strategic.compositeStrategicScore * 10 * 0.20 + // scale 1-10 to %
    capitalROIForComposite * 0.20;

  return {
    costAvoidance,
    productivity,
    strategic,
    capital,
    industrySpecific: industrySpecificMetrics,
    compositeROI: Math.round(compositeROI * 10) / 10,
  };
}
