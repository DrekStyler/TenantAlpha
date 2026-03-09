import { INDUSTRY_BENCHMARKS } from "../benchmarks";

const B = INDUSTRY_BENCHMARKS.FINANCIAL;

export interface FinancialROIMetrics {
  revenuePerAdvisor: number;
  costPerAdvisor: number;
  clientMeetingCapacity: number; // meetings/week the space supports
  complianceCostImpact: number; // annual compliance savings
  revenuePerRSF: number;
  productivityUpliftPercent: number;
  branchEfficiencyScore: number; // 1-10
}

/**
 * Calculate revenue per advisor.
 */
export function calculateRevenuePerAdvisor(
  annualRevenue: number,
  advisors: number
): number {
  if (advisors <= 0) return 0;
  return Math.round(annualRevenue / advisors);
}

/**
 * Calculate compliance cost impact.
 * Purpose-built space reduces ongoing compliance overhead.
 */
export function calculateComplianceCostImpact(
  complianceLevel: string,
  hasSecureAreas: boolean,
  hasVault: boolean
): number {
  const baseCost = B.complianceCostPerYear[complianceLevel] ?? B.complianceCostPerYear.BASIC;
  // Better space reduces compliance costs by 15-30%
  let reduction = 0.15;
  if (hasSecureAreas) reduction += 0.08;
  if (hasVault) reduction += 0.07;
  return Math.round(baseCost * reduction);
}

/**
 * Calculate client meeting capacity based on conference rooms available.
 * More/better meeting rooms → more client meetings → more revenue.
 */
export function calculateClientMeetingCapacity(
  advisors: number,
  clientMeetingsPerWeek: number,
  rentableSF: number,
  sfPerAdvisor: number
): number {
  // Assume 1 meeting room per 4 advisors, each supporting ~15 meetings/week
  const estimatedMeetingRooms = Math.max(
    1,
    Math.floor(rentableSF / (sfPerAdvisor * 4))
  );
  return estimatedMeetingRooms * 15;
}

/**
 * Calculate branch efficiency score (1-10).
 */
export function calculateBranchEfficiency(
  complianceLevel: string,
  hasVault: boolean,
  hasMeetingRooms: boolean,
  branchOffice: boolean
): number {
  let score = 5;
  if (branchOffice) score += 1;
  if (hasVault) score += 1;
  if (hasMeetingRooms) score += 1.5;
  if (complianceLevel === "BANKING" || complianceLevel === "FINRA") score += 1;
  return Math.min(10, Math.round(score * 10) / 10);
}

/**
 * Calculate complete Financial services ROI metrics.
 */
export function calculateFinancialROI(
  advisors: number,
  clientMeetingsPerWeek: number,
  complianceLevel: string,
  branchOffice: boolean,
  vaultRequired: boolean,
  annualRevenue: number,
  totalOccupancyCost: number,
  rentableSF: number
): FinancialROIMetrics {
  const revenuePerAdvisor = calculateRevenuePerAdvisor(
    annualRevenue,
    advisors
  );

  const costPerAdvisor =
    advisors > 0 ? Math.round(totalOccupancyCost / advisors) : 0;

  const clientMeetingCapacity = calculateClientMeetingCapacity(
    advisors,
    clientMeetingsPerWeek,
    rentableSF,
    B.sfPerAdvisor
  );

  const complianceCostImpact = calculateComplianceCostImpact(
    complianceLevel,
    true, // new purpose-built space has secure areas
    vaultRequired
  );

  const productivityUpliftPercent =
    Math.round(B.productivityUpliftFromNewSpace * 10000) / 100;

  const branchEfficiencyScore = calculateBranchEfficiency(
    complianceLevel,
    vaultRequired,
    true, // assume new space has meeting rooms
    branchOffice
  );

  return {
    revenuePerAdvisor,
    costPerAdvisor,
    clientMeetingCapacity,
    complianceCostImpact,
    revenuePerRSF:
      rentableSF > 0 ? Math.round((annualRevenue / rentableSF) * 100) / 100 : 0,
    productivityUpliftPercent,
    branchEfficiencyScore,
  };
}

export { B as FINANCIAL_BENCHMARKS };
