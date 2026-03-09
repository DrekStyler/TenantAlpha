import { INDUSTRY_BENCHMARKS } from "../benchmarks";

const B = INDUSTRY_BENCHMARKS.TECH;

export interface TechROIMetrics {
  revenuePerEngineer: number;
  costPerEngineer: number;
  hybridWorkSavings: number;
  collaborationZoneROI: number;
  productivityUpliftPercent: number;
  revenuePerRSF: number;
  effectiveHeadcountCapacity: number;
}

/**
 * Calculate revenue per engineer.
 */
export function calculateRevenuePerEngineer(
  annualRevenue: number,
  engineers: number
): number {
  if (engineers <= 0) return 0;
  return Math.round(annualRevenue / engineers);
}

/**
 * Calculate savings from hybrid work arrangement (reduced space needs).
 */
export function calculateHybridWorkSavings(
  headcount: number,
  hybridWorkPercent: number,
  monthlyRentPerSF: number,
  sfPerEmployee: number
): number {
  if (hybridWorkPercent <= 0) return 0;
  const avgDailyAttendance = headcount * (1 - hybridWorkPercent / 100);
  const sfSaved = (headcount - avgDailyAttendance) * sfPerEmployee * 0.5; // 50% space reduction for remote portion
  return Math.round(sfSaved * monthlyRentPerSF * 12);
}

/**
 * Calculate ROI of collaboration zones.
 * More collaboration zones → better cross-team coordination → faster delivery.
 */
export function calculateCollaborationZoneROI(
  collaborationZones: number,
  productTeams: number,
  annualRevenue: number
): number {
  if (productTeams <= 0 || collaborationZones <= 0) return 0;
  // Each zone-per-team ratio improvement yields ~0.5% revenue uplift
  const zoneRatio = collaborationZones / productTeams;
  const impactRate = Math.min(0.03, zoneRatio * 0.005); // cap at 3%
  return Math.round(annualRevenue * impactRate);
}

/**
 * Calculate complete Tech ROI metrics.
 */
export function calculateTechROI(
  engineers: number,
  productTeams: number,
  headcount: number,
  hybridWorkPercent: number,
  collaborationZones: number,
  annualRevenue: number,
  totalOccupancyCost: number,
  rentableSF: number,
  sfPerEmployee: number,
  serverRoomRequired: boolean,
  monthlyRentPerSF: number
): TechROIMetrics {
  const revenuePerEngineer = calculateRevenuePerEngineer(
    annualRevenue,
    engineers
  );

  const costPerEngineer =
    engineers > 0 ? Math.round(totalOccupancyCost / engineers) : 0;

  const hybridWorkSavings = calculateHybridWorkSavings(
    headcount,
    hybridWorkPercent,
    monthlyRentPerSF,
    sfPerEmployee
  );

  const collaborationZoneROI = calculateCollaborationZoneROI(
    collaborationZones,
    productTeams,
    annualRevenue
  );

  // Productivity uplift
  let uplift = B.productivityUpliftFromNewSpace;
  if (collaborationZones > 0) uplift += 0.02;
  if (serverRoomRequired) uplift += 0.01;

  // Effective capacity with hybrid work
  const avgAttendance = headcount * (1 - hybridWorkPercent / 100);
  const effectiveHeadcountCapacity =
    sfPerEmployee > 0 ? Math.floor(rentableSF / sfPerEmployee) : headcount;

  return {
    revenuePerEngineer,
    costPerEngineer,
    hybridWorkSavings,
    collaborationZoneROI,
    productivityUpliftPercent: Math.round(uplift * 10000) / 100,
    revenuePerRSF:
      rentableSF > 0 ? Math.round((annualRevenue / rentableSF) * 100) / 100 : 0,
    effectiveHeadcountCapacity,
  };
}

export { B as TECH_BENCHMARKS };
