import type { ProductivityROI, ProductivityInput } from "./types";
import { INDUSTRY_BENCHMARKS } from "./benchmarks";

/**
 * Calculate baseline productivity uplift from new space.
 * Factors: private offices, collaboration zones, amenities, transit.
 */
export function calculateProductivityUplift(
  industryType: string,
  hasPrivateOffices: boolean,
  hasCollaborationZones: boolean,
  hasAmenities: boolean,
  transitAccessible: boolean
): number {
  const benchmarks = INDUSTRY_BENCHMARKS[industryType as keyof typeof INDUSTRY_BENCHMARKS]
    ?? INDUSTRY_BENCHMARKS.GENERAL_OFFICE;
  const baseUplift = "productivityUpliftFromNewSpace" in benchmarks
    ? (benchmarks.productivityUpliftFromNewSpace as number)
    : 0.03;

  let multiplier = 1.0;
  if (hasPrivateOffices) multiplier += 0.3;
  if (hasCollaborationZones) multiplier += 0.25;
  if (hasAmenities) multiplier += 0.2;
  if (transitAccessible) multiplier += 0.15;

  return baseUplift * multiplier;
}

/**
 * Calculate the dollar impact of improved collaboration.
 */
export function calculateCollaborationImpact(
  headcount: number,
  revenuePerEmployee: number,
  hasCollaborationZones: boolean,
  proposedSFPerEmployee: number
): number {
  if (!hasCollaborationZones) return 0;

  // Better collaboration = ~1-2% revenue uplift
  const baseImpactRate = proposedSFPerEmployee >= 180 ? 0.02 : 0.01;
  return headcount * revenuePerEmployee * baseImpactRate;
}

/**
 * Calculate savings from reduced employee turnover.
 * Better space → lower turnover → savings on recruitment/training.
 */
export function calculateChurnReduction(
  headcount: number,
  currentTurnoverRate: number,
  avgEmployeeSalary: number,
  hasAmenities: boolean,
  transitAccessible: boolean
): number {
  // New space reduces turnover by 10-25% based on features
  let turnoverReduction = 0.10;
  if (hasAmenities) turnoverReduction += 0.08;
  if (transitAccessible) turnoverReduction += 0.07;

  const currentAnnualTurnover = headcount * (currentTurnoverRate / 100);
  const reducedTurnover = currentAnnualTurnover * (1 - turnoverReduction);
  const savedDepartures = currentAnnualTurnover - reducedTurnover;

  // Replacement cost = 1.5x salary
  const replacementCost = avgEmployeeSalary * 1.5;
  return savedDepartures * replacementCost;
}

/**
 * Calculate complete Productivity ROI.
 */
export function calculateProductivityROI(
  input: ProductivityInput
): ProductivityROI {
  const currentRevenuePerEmployee =
    input.annualRevenue / Math.max(input.headcount, 1);

  const productivityGainPercent =
    calculateProductivityUplift(
      input.industryType,
      input.hasPrivateOffices,
      input.hasCollaborationZones,
      input.hasAmenities,
      input.transitAccessible
    ) * 100;

  const projectedRevenuePerEmployee =
    currentRevenuePerEmployee * (1 + productivityGainPercent / 100);

  const annualProductivityDollarGain =
    (projectedRevenuePerEmployee - currentRevenuePerEmployee) * input.headcount;

  const collaborationImpact = calculateCollaborationImpact(
    input.headcount,
    input.revenuePerEmployee,
    input.hasCollaborationZones,
    input.proposedSFPerEmployee
  );

  const churnReductionSavings = calculateChurnReduction(
    input.headcount,
    input.currentEmployeeTurnover,
    input.avgEmployeeSalary,
    input.hasAmenities,
    input.transitAccessible
  );

  const totalGain =
    annualProductivityDollarGain + collaborationImpact + churnReductionSavings;
  const roiPercent =
    input.annualRevenue > 0 ? (totalGain / input.annualRevenue) * 100 : 0;

  return {
    currentRevenuePerEmployee: Math.round(currentRevenuePerEmployee),
    projectedRevenuePerEmployee: Math.round(projectedRevenuePerEmployee),
    productivityGainPercent: Math.round(productivityGainPercent * 10) / 10,
    annualProductivityDollarGain: Math.round(annualProductivityDollarGain),
    collaborationImpact: Math.round(collaborationImpact),
    churnReductionSavings: Math.round(churnReductionSavings),
    roiPercent: Math.round(roiPercent * 10) / 10,
  };
}
