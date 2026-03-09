import { INDUSTRY_BENCHMARKS } from "../benchmarks";

const B = INDUSTRY_BENCHMARKS.LEGAL;

export interface LegalROIMetrics {
  revenuePerAttorney: number;
  costPerBillableHour: number;
  leverageRatio: number; // associates per partner
  billableHourCapacity: number;
  realizationImpact: number; // % improvement
  productivityUpliftPercent: number;
  revenuePerRSF: number;
}

/**
 * Calculate revenue per attorney.
 */
export function calculateRevenuePerAttorney(
  totalRevenue: number,
  partners: number,
  associates: number
): number {
  const totalAttorneys = partners + associates;
  if (totalAttorneys <= 0) return 0;
  return Math.round(totalRevenue / totalAttorneys);
}

/**
 * Calculate cost per billable hour.
 */
export function calculateCostPerBillableHour(
  totalOccupancyCost: number,
  totalBillableHours: number
): number {
  if (totalBillableHours <= 0) return 0;
  return Math.round((totalOccupancyCost / totalBillableHours) * 100) / 100;
}

/**
 * Calculate leverage ratio (associates + paralegals per partner).
 */
export function calculateLeverageRatio(
  partners: number,
  associates: number,
  paralegals: number
): number {
  if (partners <= 0) return 0;
  return Math.round(((associates + paralegals) / partners) * 100) / 100;
}

/**
 * Calculate full Legal ROI metrics.
 * Better space → higher billable hours, better realization, improved leverage.
 */
export function calculateLegalROI(
  partners: number,
  associates: number,
  paralegals: number,
  billableHourTarget: number,
  realizationRate: number, // 0-100%
  blendedBillingRate: number,
  totalOccupancyCost: number,
  annualRevenue: number,
  rentableSF: number,
  hasPrivateOffices: boolean,
  hasTechInfrastructure: boolean
): LegalROIMetrics {
  const totalAttorneys = partners + associates;

  // Billable hour capacity (annual)
  const billableHourCapacity = totalAttorneys * billableHourTarget;

  // Productivity uplift from better space
  let uplift = B.productivityUpliftFromNewSpace;
  if (hasPrivateOffices) uplift += 0.02; // private offices boost concentration
  if (hasTechInfrastructure) uplift += 0.015; // better AV, deposition rooms

  // Realization rate improvement from better client experience
  const realizationImprovement = hasPrivateOffices ? 1.5 : 0.5; // percentage points

  return {
    revenuePerAttorney: calculateRevenuePerAttorney(
      annualRevenue,
      partners,
      associates
    ),
    costPerBillableHour: calculateCostPerBillableHour(
      totalOccupancyCost,
      billableHourCapacity
    ),
    leverageRatio: calculateLeverageRatio(partners, associates, paralegals),
    billableHourCapacity,
    realizationImpact: realizationImprovement,
    productivityUpliftPercent: Math.round(uplift * 10000) / 100,
    revenuePerRSF:
      rentableSF > 0 ? Math.round((annualRevenue / rentableSF) * 100) / 100 : 0,
  };
}

export { B as LEGAL_BENCHMARKS };
