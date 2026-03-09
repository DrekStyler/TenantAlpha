import type {
  IndustryType,
  CostAvoidanceROI,
  ProductivityROI,
  StrategicROI,
  CapitalROI,
  ROIOutputs,
} from "@/types/survey";

// Re-export for convenience
export type {
  IndustryType,
  CostAvoidanceROI,
  ProductivityROI,
  StrategicROI,
  CapitalROI,
  ROIOutputs,
};

// ─── Cost Avoidance Inputs ───────────────────────────────────────

export interface CostAvoidanceInput {
  currentRentPerSF: number;
  proposedRentPerSF: number;
  currentEscalationPercent: number;
  proposedEscalationPercent: number;
  rentableSF: number;
  termMonths: number;
  headcount: number;
  revenuePerEmployee: number;
  estimatedDowntimeDays: number; // days of productivity lost during move
  currentOpExPerSF: number;
  proposedOpExPerSF: number;
}

// ─── Productivity Inputs ─────────────────────────────────────────

export interface ProductivityInput {
  industryType: IndustryType;
  headcount: number;
  annualRevenue: number;
  revenuePerEmployee: number;
  currentSFPerEmployee: number;
  proposedSFPerEmployee: number;
  currentEmployeeTurnover: number; // 0-100%
  avgEmployeeSalary: number;
  industryInputs: Record<string, unknown>;
  // Space characteristics
  hasPrivateOffices: boolean;
  hasCollaborationZones: boolean;
  hasAmenities: boolean;
  transitAccessible: boolean;
}

// ─── Strategic Inputs ────────────────────────────────────────────

export interface StrategicInput {
  industryType: IndustryType;
  walkScore: number; // 0-100
  transitAccess: boolean;
  amenityCount: number;
  buildingClass: "A" | "B" | "C";
  submarketPrestige: "HIGH" | "MEDIUM" | "LOW";
  signageAvailable: boolean;
  industryInputs: Record<string, unknown>;
  annualRevenue: number;
  headcount: number;
}

// ─── Capital Inputs ──────────────────────────────────────────────

export interface CapitalInput {
  tiAllowance: number;
  estimatedBuildoutCost: number;
  freeRentMonths: number;
  monthlyBaseRent: number; // total monthly rent (not per SF)
  cashAllowance: number;
  movingCosts: number;
  furnitureIT: number;
}

// ─── Full ROI Calculation Input ──────────────────────────────────

export interface FullROIInput {
  costAvoidance: CostAvoidanceInput;
  productivity: ProductivityInput;
  strategic: StrategicInput;
  capital: CapitalInput;
  industryType: IndustryType;
  industryInputs: Record<string, unknown>;
}
