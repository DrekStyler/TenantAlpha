import { INDUSTRY_BENCHMARKS } from "../benchmarks";

const B = INDUSTRY_BENCHMARKS.MEDICAL;

export interface MedicalROIMetrics {
  revenuePerExamRoom: number;
  revenuePerRSF: number;
  revenuePerProvider: number;
  clinicalROIPercent: number;
  maxDailyThroughput: number;
  providerProductivity: number; // visits per provider per day
  cycleTimeImpact: number; // % improvement
  examRoomUtilizationGain: number; // % improvement
}

/**
 * Calculate annual revenue per exam room.
 */
export function calculateRevenuePerExamRoom(
  examRooms: number,
  visitsPerProviderDay: number,
  providers: number,
  reimbursementPerVisit: number,
  workingDaysPerYear = 260
): number {
  if (examRooms <= 0) return 0;
  const annualVisits = visitsPerProviderDay * providers * workingDaysPerYear;
  const annualRevenue = annualVisits * reimbursementPerVisit;
  return Math.round(annualRevenue / examRooms);
}

/**
 * Calculate revenue per rentable square foot.
 */
export function calculateRevenuePerRSF(
  annualRevenue: number,
  rentableSF: number
): number {
  if (rentableSF <= 0) return 0;
  return Math.round((annualRevenue / rentableSF) * 100) / 100;
}

/**
 * Calculate provider productivity (visits per provider per day).
 */
export function calculateProviderProductivity(
  providers: number,
  visitsPerDay: number,
  cycleTimeMinutes: number
): number {
  if (providers <= 0) return 0;
  // Max visits per provider based on cycle time (8 hour day = 480 min)
  const maxPerProvider = Math.floor(480 / cycleTimeMinutes);
  return Math.min(visitsPerDay, maxPerProvider);
}

/**
 * Calculate clinical ROI — how the new space improves clinical throughput.
 * Compares current utilization to potential improvement from new layout.
 */
export function calculateClinicalROI(
  examRooms: number,
  providers: number,
  visitsPerProviderDay: number,
  reimbursementPerVisit: number,
  cycleTimeMinutes: number,
  currentUtilization: number, // 0-100
  totalOccupancyCost: number,
  rentableSF: number
): MedicalROIMetrics {
  const workingDays = 260;

  // Current state
  const currentAnnualVisits =
    visitsPerProviderDay * providers * workingDays;
  const currentAnnualRevenue = currentAnnualVisits * reimbursementPerVisit;

  // Max throughput based on exam rooms
  const maxDailyThroughput = Math.floor(
    (examRooms * 480) / cycleTimeMinutes
  );

  // New space improvement assumptions
  const newUtilization = Math.min(100, currentUtilization + 10); // 10% improvement
  const newCycleTime = cycleTimeMinutes * 0.9; // 10% faster
  const improvedVisitsPerDay = Math.min(
    maxDailyThroughput / Math.max(providers, 1),
    Math.floor(480 / newCycleTime)
  );

  const improvedAnnualVisits =
    improvedVisitsPerDay * providers * workingDays;
  const improvedAnnualRevenue = improvedAnnualVisits * reimbursementPerVisit;

  const revenueUplift = improvedAnnualRevenue - currentAnnualRevenue;

  // Clinical ROI = revenue uplift / occupancy cost
  const clinicalROIPercent =
    totalOccupancyCost > 0
      ? (revenueUplift / totalOccupancyCost) * 100
      : 0;

  return {
    revenuePerExamRoom: calculateRevenuePerExamRoom(
      examRooms,
      visitsPerProviderDay,
      providers,
      reimbursementPerVisit
    ),
    revenuePerRSF: calculateRevenuePerRSF(currentAnnualRevenue, rentableSF),
    revenuePerProvider: providers > 0
      ? Math.round(currentAnnualRevenue / providers)
      : 0,
    clinicalROIPercent: Math.round(clinicalROIPercent * 10) / 10,
    maxDailyThroughput,
    providerProductivity: calculateProviderProductivity(
      providers,
      visitsPerProviderDay,
      cycleTimeMinutes
    ),
    cycleTimeImpact: 10, // 10% assumed improvement
    examRoomUtilizationGain: newUtilization - currentUtilization,
  };
}

export { B as MEDICAL_BENCHMARKS };
