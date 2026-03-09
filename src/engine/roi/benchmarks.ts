/**
 * Industry benchmark constants used by ROI calculations.
 * Sources: BLS, CMS, Am Law, industry averages.
 * These serve as defaults and validation references.
 */

export const INDUSTRY_BENCHMARKS = {
  MEDICAL: {
    avgVisitsPerProviderDay: 20,
    avgReimbursementPerVisit: 150,
    avgExamRoomUtilization: 0.75,
    avgCycleTimeMinutes: 18,
    avgRevenuePerExamRoom: 450_000,
    sfPerExamRoom: 120,
    sfPerProvider: 200,
    avgProviderSalary: 280_000,
    avgStaffSalary: 45_000,
    avgTurnoverRate: 0.18,
    productivityUpliftFromNewSpace: 0.05, // 5% baseline
  },
  LEGAL: {
    avgBillableHoursPerYear: 1_800,
    avgRealizationRate: 0.88,
    avgBlendedRate: 450,
    sfPerAttorney: 250,
    sfPerParalegal: 150,
    sfPerAdmin: 100,
    avgRevenuePerPartner: 1_200_000,
    avgRevenuePerAssociate: 600_000,
    avgPartnerSalary: 500_000,
    avgAssociateSalary: 200_000,
    avgTurnoverRate: 0.22,
    productivityUpliftFromNewSpace: 0.04,
  },
  AEROSPACE_DEFENSE: {
    scifBuildoutCostPerSF: 150,
    sapfBuildoutCostPerSF: 250,
    avgPowerDensityKW: 50,
    avgFloorLoadPSF: 200,
    avgCeilingHeightFt: 16,
    contractWinBaseRate: 0.15,
    proximityBoostFactor: 0.05,
    avgEngineerSalary: 145_000,
    avgTechnicalSalary: 85_000,
    avgTurnoverRate: 0.12,
    cmmcComplianceCostPerYear: {
      1: 15_000,
      2: 50_000,
      3: 150_000,
      4: 500_000,
      5: 1_000_000,
    } as Record<number, number>,
    productivityUpliftFromNewSpace: 0.03,
  },
  TECH: {
    avgEngineerSalary: 175_000,
    sfPerEngineer: 150,
    sfPerCollaborationZone: 400,
    avgRevenuePerEngineer: 500_000,
    avgTurnoverRate: 0.20,
    hybridWorkSpaceReduction: 0.20,
    productivityUpliftFromNewSpace: 0.06,
  },
  FINANCIAL: {
    avgAdvisorSalary: 150_000,
    sfPerAdvisor: 200,
    avgRevenuePerAdvisor: 800_000,
    avgAUMPerAdvisor: 100_000_000,
    avgTurnoverRate: 0.15,
    complianceCostPerYear: {
      BASIC: 10_000,
      SEC_REGISTERED: 75_000,
      FINRA: 150_000,
      BANKING: 500_000,
    } as Record<string, number>,
    productivityUpliftFromNewSpace: 0.04,
  },
  GENERAL_OFFICE: {
    avgRevenuePerEmployee: 250_000,
    avgSFPerEmployee: 180,
    avgEmployeeSalary: 75_000,
    avgTurnoverRate: 0.15,
    avgReplacementCostMultiplier: 1.5, // x annual salary
    hybridWorkSpaceReduction: 0.20,
    productivityUpliftFromNewSpace: 0.03,
  },
} as const;

/** Lookup benchmark for a given industry */
export function getIndustryBenchmarks(industry: string) {
  return INDUSTRY_BENCHMARKS[industry as keyof typeof INDUSTRY_BENCHMARKS]
    ?? INDUSTRY_BENCHMARKS.GENERAL_OFFICE;
}
