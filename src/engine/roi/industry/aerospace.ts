import { INDUSTRY_BENCHMARKS } from "../benchmarks";

const B = INDUSTRY_BENCHMARKS.AEROSPACE_DEFENSE;

export interface AerospaceROIMetrics {
  missionReadinessScore: number; // 1-10
  securityInfrastructureCost: number;
  regulatoryComplianceSavings: number;
  contractWinProbabilityBoost: number; // percentage points
  estimatedPipelineUplift: number; // $
  throughputGainPercent: number;
  costPerMissionCriticalSF: number;
}

/**
 * Calculate the cost of building security infrastructure (SCIF, SAPF).
 */
export function calculateSecurityInfrastructureCost(
  scifRequired: boolean,
  sapfRequired: boolean,
  rentableSF: number,
  tiAllowance: number
): number {
  let buildoutCost = 0;
  // Only a portion of the space typically needs SCIF/SAPF treatment
  const secureAreaPercent = sapfRequired ? 0.5 : scifRequired ? 0.3 : 0;
  const secureSF = rentableSF * secureAreaPercent;

  if (sapfRequired) {
    buildoutCost = secureSF * B.sapfBuildoutCostPerSF;
  } else if (scifRequired) {
    buildoutCost = secureSF * B.scifBuildoutCostPerSF;
  }

  // Net cost after TI offset
  return Math.max(0, buildoutCost - tiAllowance);
}

/**
 * Calculate annual compliance savings from purpose-built space.
 * Proper infrastructure reduces ongoing compliance audit costs.
 */
export function calculateRegulatoryComplianceSavings(
  cmmcLevel: number,
  itarCompliant: boolean,
  currentlyCompliant: boolean
): number {
  // If currently non-compliant, the new space avoids penalties + enables revenue
  const baseSavings = B.cmmcComplianceCostPerYear[cmmcLevel] ?? 0;
  let savings = currentlyCompliant ? baseSavings * 0.2 : baseSavings * 0.8;
  if (itarCompliant) savings += 25_000; // additional ITAR infrastructure savings
  return Math.round(savings);
}

/**
 * Calculate the boost in contract win probability from location/capability.
 */
export function calculateContractWinBoost(
  proximityToPrimes: string[],
  proximityToGovernment: string[],
  facilityCleared: boolean,
  scifRequired: boolean
): number {
  let boost = 0;
  if (facilityCleared) boost += 0.03;
  if (scifRequired) boost += 0.02;
  boost += Math.min(proximityToPrimes.length, 3) * B.proximityBoostFactor;
  boost += Math.min(proximityToGovernment.length, 3) * (B.proximityBoostFactor * 0.8);
  return Math.round(boost * 10000) / 100; // percentage points
}

/**
 * Calculate mission readiness score (1-10).
 */
export function calculateMissionReadiness(
  scifRequired: boolean,
  sapfRequired: boolean,
  facilityCleared: boolean,
  itarCompliant: boolean,
  powerAdequate: boolean,
  ceilingAdequate: boolean
): number {
  let score = 4; // baseline for standard office
  if (facilityCleared) score += 2;
  if (scifRequired) score += 1;
  if (sapfRequired) score += 1;
  if (itarCompliant) score += 0.5;
  if (powerAdequate) score += 0.5;
  if (ceilingAdequate) score += 0.5;
  return Math.min(10, Math.round(score * 10) / 10);
}

/**
 * Calculate complete Aerospace & Defense ROI metrics.
 */
export function calculateAerospaceROI(
  scifRequired: boolean,
  sapfRequired: boolean,
  facilityCleared: boolean,
  itarCompliant: boolean,
  cmmcLevel: number,
  proximityToPrimes: string[],
  proximityToGovernment: string[],
  rentableSF: number,
  tiAllowance: number,
  totalOccupancyCost: number,
  annualRevenue: number,
  powerAdequate: boolean,
  ceilingAdequate: boolean
): AerospaceROIMetrics {
  const securityInfrastructureCost = calculateSecurityInfrastructureCost(
    scifRequired,
    sapfRequired,
    rentableSF,
    tiAllowance
  );

  const regulatoryComplianceSavings = calculateRegulatoryComplianceSavings(
    cmmcLevel,
    itarCompliant,
    facilityCleared
  );

  const contractWinProbabilityBoost = calculateContractWinBoost(
    proximityToPrimes,
    proximityToGovernment,
    facilityCleared,
    scifRequired
  );

  // Pipeline uplift = annual revenue × win rate improvement
  const estimatedPipelineUplift = Math.round(
    annualRevenue * (contractWinProbabilityBoost / 100)
  );

  const missionReadinessScore = calculateMissionReadiness(
    scifRequired,
    sapfRequired,
    facilityCleared,
    itarCompliant,
    powerAdequate,
    ceilingAdequate
  );

  // Throughput gain from purpose-built space
  const throughputGainPercent = (B.productivityUpliftFromNewSpace +
    (powerAdequate ? 0.02 : 0) +
    (ceilingAdequate ? 0.01 : 0)) * 100;

  // Cost per mission-critical SF (SCIF/SAPF area only)
  const missionCriticalSF = rentableSF * (sapfRequired ? 0.5 : scifRequired ? 0.3 : 1);
  const costPerMissionCriticalSF =
    missionCriticalSF > 0
      ? Math.round((totalOccupancyCost / missionCriticalSF) * 100) / 100
      : 0;

  return {
    missionReadinessScore,
    securityInfrastructureCost: Math.round(securityInfrastructureCost),
    regulatoryComplianceSavings,
    contractWinProbabilityBoost,
    estimatedPipelineUplift,
    throughputGainPercent: Math.round(throughputGainPercent * 10) / 10,
    costPerMissionCriticalSF,
  };
}

export { B as AEROSPACE_BENCHMARKS };
