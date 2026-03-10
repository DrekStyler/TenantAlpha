import { z } from "zod";

// ─── Industry Type ───────────────────────────────────────────────

export const industryTypeSchema = z.enum([
  "MEDICAL",
  "LEGAL",
  "AEROSPACE_DEFENSE",
  "TECH",
  "FINANCIAL",
  "GENERAL_OFFICE",
]);

// ─── Survey Phase ────────────────────────────────────────────────

export const surveyPhaseSchema = z.enum([
  "INDUSTRY_DETECTION",
  "INDUSTRY_QUESTIONS",
  "LEASE_PREFERENCES",
  "REVIEW",
  "COMPLETED",
]);

// ─── Survey Message Request ──────────────────────────────────────

export const surveyMessageSchema = z.object({
  message: z
    .string()
    .min(1, "Message is required")
    .max(5000, "Message too long"),
});

export type SurveyMessageInput = z.infer<typeof surveyMessageSchema>;

// ─── Extracted Data Schema (used by AI tool call) ────────────────

export const extractedDataSchema = z.object({
  industry: industryTypeSchema.optional(),
  subSector: z.string().optional(),
  role: z.string().optional(),
  companyName: z.string().optional(),
  headcount: z.number().int().positive().optional(),
  projectedHeadcount12mo: z.number().int().positive().optional(),
  annualRevenue: z.number().positive().optional(),
  revenuePerEmployee: z.number().positive().optional(),
  projectedRevenueGrowth: z.number().min(-100).max(1000).optional(),
  sfPerEmployee: z.number().positive().max(5000).optional(),
  budgetConstraint: z.number().positive().optional(),
  primaryGoal: z.string().optional(),
  criticalAmenities: z.array(z.string()).optional(),
  expansionTimeline: z.string().optional(),
  currentEmployeeTurnover: z.number().min(0).max(100).optional(),
  avgEmployeeSalary: z.number().positive().optional(),

  industryInputs: z.record(z.string(), z.unknown()).optional(),

  leasePreferences: z
    .object({
      preferredTerm: z.number().int().positive().max(360).optional(),
      preferredRentStructure: z.string().optional(),
      preferredPropertyType: z.string().optional(),
      preferredLocation: z.string().optional(),
      tiExpectation: z.number().min(0).optional(),
      freeRentExpectation: z.number().int().min(0).max(36).optional(),
      maxBaseRent: z.number().positive().optional(),
      parkingNeeded: z.number().int().min(0).optional(),
    })
    .optional(),

  currentLease: z
    .object({
      currentRent: z.number().positive().optional(),
      currentEscalation: z.number().min(0).max(50).optional(),
      currentTerm: z.number().int().positive().optional(),
      currentSF: z.number().positive().optional(),
      currentOpEx: z.number().min(0).optional(),
      painPoints: z.array(z.string()).optional(),
    })
    .optional(),

  phase: surveyPhaseSchema.optional(),
});

export type ExtractedDataInput = z.infer<typeof extractedDataSchema>;

// ─── Industry-Specific Input Schemas ─────────────────────────────

export const medicalInputsSchema = z.object({
  providers: z.number().int().positive(),
  examRooms: z.number().int().positive(),
  visitsPerProviderDay: z.number().positive(),
  reimbursementPerVisit: z.number().positive(),
  payerMix: z.object({
    medicare: z.number().min(0).max(100),
    medicaid: z.number().min(0).max(100),
    commercial: z.number().min(0).max(100),
    selfPay: z.number().min(0).max(100),
  }),
  cycleTimeMinutes: z.number().positive(),
  currentExamRoomUtilization: z.number().min(0).max(100),
  specialtyType: z.string(),
});

export const legalInputsSchema = z.object({
  partners: z.number().int().min(0),
  associates: z.number().int().min(0),
  paralegals: z.number().int().min(0),
  adminStaff: z.number().int().min(0),
  billableHourTarget: z.number().positive(),
  realizationRate: z.number().min(0).max(100),
  blendedBillingRate: z.number().positive(),
  practiceAreas: z.array(z.string()),
  courtProximityRequired: z.boolean(),
  depositionRoomsNeeded: z.number().int().min(0),
});

export const aerospaceInputsSchema = z.object({
  scifRequired: z.boolean(),
  sapfRequired: z.boolean(),
  facilityCleared: z.boolean(),
  clearanceLevel: z.enum(["CONFIDENTIAL", "SECRET", "TOP_SECRET", "SCI"]),
  itarCompliant: z.boolean(),
  cmmcLevel: z.number().int().min(1).max(5),
  powerRequirementKW: z.number().min(0),
  ceilingHeightFt: z.number().positive(),
  floorLoadPSF: z.number().positive(),
  proximityToPrimes: z.array(z.string()),
  proximityToGovernment: z.array(z.string()),
  prototypeCapability: z.boolean(),
  secureStorageRequired: z.boolean(),
});

export const techInputsSchema = z.object({
  engineers: z.number().int().positive(),
  productTeams: z.number().int().positive(),
  deploymentFrequency: z.string(),
  hybridWorkPercent: z.number().min(0).max(100),
  serverRoomRequired: z.boolean(),
  collaborationZonesNeeded: z.number().int().min(0),
  avgEngineerSalary: z.number().positive(),
});

export const financialInputsSchema = z.object({
  advisors: z.number().int().positive(),
  aum: z.number().min(0),
  clientMeetingsPerWeek: z.number().min(0),
  complianceLevel: z.enum(["BASIC", "SEC_REGISTERED", "FINRA", "BANKING"]),
  branchOffice: z.boolean(),
  vaultRequired: z.boolean(),
  avgAdvisorRevenue: z.number().positive(),
});
