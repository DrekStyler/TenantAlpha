// ─── Industry Types ──────────────────────────────────────────────

export type IndustryType =
  | "MEDICAL"
  | "LEGAL"
  | "AEROSPACE_DEFENSE"
  | "TECH"
  | "FINANCIAL"
  | "GENERAL_OFFICE";

export type SurveyPhase =
  | "INDUSTRY_DETECTION"
  | "INDUSTRY_QUESTIONS"
  | "LEASE_PREFERENCES"
  | "REVIEW"
  | "COMPLETED";

// ─── Industry-Specific Input Interfaces ──────────────────────────

export interface MedicalInputs {
  providers: number;
  examRooms: number;
  visitsPerProviderDay: number;
  reimbursementPerVisit: number;
  payerMix: {
    medicare: number; // 0-100%
    medicaid: number;
    commercial: number;
    selfPay: number;
  };
  cycleTimeMinutes: number;
  currentExamRoomUtilization: number; // 0-100%
  specialtyType: string; // "primary_care" | "specialist" | "surgical" | "dental" | "mental_health" | "other"
}

export interface LegalInputs {
  partners: number;
  associates: number;
  paralegals: number;
  adminStaff: number;
  billableHourTarget: number; // per attorney per year
  realizationRate: number; // 0-100%
  blendedBillingRate: number; // $/hour
  practiceAreas: string[];
  courtProximityRequired: boolean;
  depositionRoomsNeeded: number;
}

export interface AerospaceInputs {
  scifRequired: boolean;
  sapfRequired: boolean;
  facilityCleared: boolean;
  clearanceLevel: "CONFIDENTIAL" | "SECRET" | "TOP_SECRET" | "SCI";
  itarCompliant: boolean;
  cmmcLevel: number; // 1-5
  powerRequirementKW: number;
  ceilingHeightFt: number;
  floorLoadPSF: number;
  proximityToPrimes: string[];
  proximityToGovernment: string[];
  prototypeCapability: boolean;
  secureStorageRequired: boolean;
}

export interface TechInputs {
  engineers: number;
  productTeams: number;
  deploymentFrequency: string; // "daily" | "weekly" | "biweekly" | "monthly"
  hybridWorkPercent: number; // 0-100% of workforce remote
  serverRoomRequired: boolean;
  collaborationZonesNeeded: number;
  avgEngineerSalary: number;
}

export interface FinancialInputs {
  advisors: number;
  aum: number; // assets under management
  clientMeetingsPerWeek: number;
  complianceLevel: "BASIC" | "SEC_REGISTERED" | "FINRA" | "BANKING";
  branchOffice: boolean;
  vaultRequired: boolean;
  avgAdvisorRevenue: number;
}

export type IndustryInputs =
  | MedicalInputs
  | LegalInputs
  | AerospaceInputs
  | TechInputs
  | FinancialInputs
  | Record<string, unknown>; // General Office fallback

// ─── ROI Output Interfaces ───────────────────────────────────────

export interface CostAvoidanceROI {
  escalationSavings: number; // savings from negotiated lower escalation
  downtimeCostAvoided: number; // productivity saved during move
  operationalEfficiencyGain: number; // annual $ from better layout
  annualSavings: number;
  fiveYearSavings: number;
  roiPercent: number;
}

export interface ProductivityROI {
  currentRevenuePerEmployee: number;
  projectedRevenuePerEmployee: number;
  productivityGainPercent: number;
  annualProductivityDollarGain: number;
  collaborationImpact: number; // $ impact of better collaboration
  churnReductionSavings: number; // $ saved from lower turnover
  roiPercent: number;
}

export interface StrategicROI {
  talentAttractionScore: number; // 1-10
  clientExperienceScore: number; // 1-10
  marketPresenceScore: number; // 1-10
  regulatoryAlignmentScore: number; // 1-10
  compositeStrategicScore: number; // weighted average
  estimatedRevenueImpact: number; // $ estimated impact
}

export interface CapitalROI {
  tiDollarsReceived: number;
  tenantCapitalPreserved: number;
  freeRentWorkingCapitalSaved: number;
  totalCapitalBenefit: number;
  tenantOutOfPocket: number;
  effectiveCapitalROI: number; // % return on tenant's capital outlay
}

export interface ROIOutputs {
  costAvoidance: CostAvoidanceROI;
  productivity: ProductivityROI;
  strategic: StrategicROI;
  capital: CapitalROI;
  industrySpecific: Record<string, number | string>; // additional metrics by industry
  compositeROI: number; // overall weighted ROI %
}

// ─── Survey Session Types ────────────────────────────────────────

export interface SurveyMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ExtractedSurveyData {
  // General
  industry?: IndustryType;
  companyName?: string;
  headcount?: number;
  projectedHeadcount12mo?: number;
  annualRevenue?: number;
  revenuePerEmployee?: number;
  projectedRevenueGrowth?: number;
  sfPerEmployee?: number;
  budgetConstraint?: number;
  primaryGoal?: string;
  criticalAmenities?: string[];
  expansionTimeline?: string;
  currentEmployeeTurnover?: number;
  avgEmployeeSalary?: number;

  // Industry-specific
  industryInputs?: Record<string, unknown>;

  // Lease preferences (gathered during LEASE_PREFERENCES phase)
  leasePreferences?: {
    preferredTerm?: number; // months
    preferredRentStructure?: string;
    preferredPropertyType?: string;
    preferredLocation?: string;
    tiExpectation?: number; // $
    freeRentExpectation?: number; // months
    maxBaseRent?: number; // $/SF/yr
    parkingNeeded?: number; // spaces
  };

  // Current lease info (for comparison / cost avoidance)
  currentLease?: {
    currentRent?: number; // $/SF/yr
    currentEscalation?: number; // %
    currentTerm?: number; // months remaining
    currentSF?: number;
    currentOpEx?: number; // $/SF/yr
    painPoints?: string[];
  };
}

// ─── Survey API Types ────────────────────────────────────────────

export interface SurveySessionState {
  clientName: string;
  company?: string;
  brokerName?: string;
  brokerageName?: string;
  phase: SurveyPhase;
  messages: SurveyMessage[];
  extractedData: ExtractedSurveyData;
  alreadyCompleted: boolean;
}

export interface SurveyCompletionResult {
  dealId: string;
  token: string;
  roiOutputs: ROIOutputs;
}
