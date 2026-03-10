import { prisma } from "@/lib/prisma";
import { calculateFullROI } from "@/engine/roi";
import type { CostAvoidanceInput, ProductivityInput, StrategicInput, CapitalInput } from "@/engine/roi/types";
import type { IndustryType, ROIOutputs } from "@/types/survey";
import { INDUSTRY_BENCHMARKS } from "@/engine/roi/benchmarks";

// ─── Enum Validators ─────────────────────────────────────────────

const VALID_PROPERTY_TYPES = new Set(["OFFICE", "RETAIL", "INDUSTRIAL", "FLEX", "OTHER"]);
const VALID_RENT_STRUCTURES = new Set(["GROSS", "NNN", "MODIFIED_GROSS"]);
const VALID_INDUSTRY_TYPES = new Set(["MEDICAL", "LEGAL", "AEROSPACE_DEFENSE", "TECH", "FINANCIAL", "GENERAL_OFFICE"]);

function normalizePropertyType(value: string | undefined): "OFFICE" | "RETAIL" | "INDUSTRIAL" | "FLEX" | "OTHER" {
  if (!value) return "OFFICE";
  const upper = value.toUpperCase().replace(/[\s-]+/g, "_");
  if (VALID_PROPERTY_TYPES.has(upper)) return upper as "OFFICE" | "RETAIL" | "INDUSTRIAL" | "FLEX" | "OTHER";
  if (upper.includes("OFFICE")) return "OFFICE";
  if (upper.includes("RETAIL") || upper.includes("SHOP")) return "RETAIL";
  if (upper.includes("INDUSTRIAL") || upper.includes("WAREHOUSE")) return "INDUSTRIAL";
  if (upper.includes("FLEX")) return "FLEX";
  return "OFFICE";
}

function normalizeRentStructure(value: string | undefined): "GROSS" | "NNN" | "MODIFIED_GROSS" {
  if (!value) return "GROSS";
  const upper = value.toUpperCase().replace(/[\s-]+/g, "_");
  if (VALID_RENT_STRUCTURES.has(upper)) return upper as "GROSS" | "NNN" | "MODIFIED_GROSS";
  if (upper.includes("NNN") || upper.includes("TRIPLE")) return "NNN";
  if (upper.includes("MODIFIED")) return "MODIFIED_GROSS";
  return "GROSS";
}

function normalizeIndustryType(value: string): IndustryType {
  if (!value) return "GENERAL_OFFICE";
  const upper = value.toUpperCase().replace(/[\s-]+/g, "_");
  if (VALID_INDUSTRY_TYPES.has(upper)) return upper as IndustryType;
  return "GENERAL_OFFICE";
}

export interface SurveyDealData {
  industry: string;
  companyName?: string;
  headcount: number;
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
  industryInputs?: Record<string, unknown>;
  leasePreferences?: {
    preferredTerm?: number;
    preferredRentStructure?: string;
    preferredPropertyType?: string;
    maxBaseRent?: number;
    tiExpectation?: number;
    freeRentExpectation?: number;
  };
  currentLease?: {
    currentRent?: number;
    currentEscalation?: number;
    currentOpEx?: number;
    currentSF?: number;
    painPoints?: string[];
  };
}

export interface CreateDealParams {
  clientId: string;
  clientUserId: string;
  clientName: string;
  data: SurveyDealData;
  sourceType: "AI_SURVEY" | "STATIC";
  dealNameSuffix: string;
  surveySessionId?: string;
}

export async function createDealFromSurvey(
  params: CreateDealParams
): Promise<{ dealId: string; roiOutputs: ROIOutputs }> {
  const { clientId, clientUserId, clientName, data, sourceType, dealNameSuffix, surveySessionId } = params;

  // Normalize industry type to ensure it matches Prisma enum
  const industry = normalizeIndustryType(data.industry);
  const benchmarks = INDUSTRY_BENCHMARKS[industry as keyof typeof INDUSTRY_BENCHMARKS]
    ?? INDUSTRY_BENCHMARKS.GENERAL_OFFICE;

  // Derive reasonable defaults from gathered data
  const headcount = data.headcount;
  const annualRevenue = data.annualRevenue ?? headcount * (("avgRevenuePerEmployee" in benchmarks ? benchmarks.avgRevenuePerEmployee as number : 250_000));
  const revenuePerEmployee = data.revenuePerEmployee ?? annualRevenue / headcount;
  const sfPerEmployee = data.sfPerEmployee ?? ("avgSFPerEmployee" in benchmarks ? benchmarks.avgSFPerEmployee as number : 180);
  const rentableSF = headcount * sfPerEmployee;
  const termMonths = data.leasePreferences?.preferredTerm ?? 60;
  const avgSalary = data.avgEmployeeSalary ?? ("avgEmployeeSalary" in benchmarks ? benchmarks.avgEmployeeSalary as number : 75_000);
  const turnover = data.currentEmployeeTurnover ?? ("avgTurnoverRate" in benchmarks ? (benchmarks.avgTurnoverRate as number) * 100 : 15);

  // Lease defaults
  const lp = data.leasePreferences ?? {};
  const baseRentY1 = lp.maxBaseRent ?? 35;
  const tiAllowance = lp.tiExpectation ?? rentableSF * 40;
  const freeRentMonths = lp.freeRentExpectation ?? 3;
  const estimatedBuildoutCost = rentableSF * 60;
  const monthlyBaseRent = (baseRentY1 * rentableSF) / 12;

  // Current lease defaults for cost avoidance
  const cl = data.currentLease ?? {};
  const currentRent = cl.currentRent ?? baseRentY1 * 1.1;
  const currentEscalation = cl.currentEscalation ?? 3.5;
  const currentOpEx = cl.currentOpEx ?? 12;
  const proposedOpEx = currentOpEx * 0.9;

  // Build ROI inputs
  const costAvoidance: CostAvoidanceInput = {
    currentRentPerSF: currentRent,
    proposedRentPerSF: baseRentY1,
    currentEscalationPercent: currentEscalation,
    proposedEscalationPercent: 3.0,
    rentableSF,
    termMonths,
    headcount,
    revenuePerEmployee,
    estimatedDowntimeDays: 5,
    currentOpExPerSF: currentOpEx,
    proposedOpExPerSF: proposedOpEx,
  };

  const productivity: ProductivityInput = {
    industryType: industry,
    headcount,
    annualRevenue,
    revenuePerEmployee,
    currentSFPerEmployee: sfPerEmployee * 0.85,
    proposedSFPerEmployee: sfPerEmployee,
    currentEmployeeTurnover: turnover,
    avgEmployeeSalary: avgSalary,
    industryInputs: data.industryInputs ?? {},
    hasPrivateOffices: industry === "LEGAL" || industry === "FINANCIAL",
    hasCollaborationZones: industry === "TECH" || industry === "GENERAL_OFFICE",
    hasAmenities: (data.criticalAmenities?.length ?? 0) >= 3,
    transitAccessible: data.criticalAmenities?.includes("Public transit access") ?? false,
  };

  const strategic: StrategicInput = {
    industryType: industry,
    walkScore: 70,
    transitAccess: data.criticalAmenities?.includes("Public transit access") ?? false,
    amenityCount: data.criticalAmenities?.length ?? 0,
    buildingClass: "B",
    submarketPrestige: "MEDIUM",
    signageAvailable: data.criticalAmenities?.includes("Signage / visibility") ?? false,
    industryInputs: data.industryInputs ?? {},
    annualRevenue,
    headcount,
  };

  const capital: CapitalInput = {
    tiAllowance,
    estimatedBuildoutCost,
    freeRentMonths,
    monthlyBaseRent,
    cashAllowance: 0,
    movingCosts: headcount * 500,
    furnitureIT: headcount * 3000,
  };

  // Calculate ROI (wrapped in try-catch for robustness)
  let roiOutputs: ROIOutputs;
  try {
    roiOutputs = calculateFullROI({
      costAvoidance,
      productivity,
      strategic,
      capital,
      industryType: industry,
      industryInputs: data.industryInputs ?? {},
    });
  } catch (calcError) {
    console.error("[createDealFromSurvey] ROI calculation failed:", calcError);
    console.error("[createDealFromSurvey] Inputs:", JSON.stringify({ costAvoidance, productivity, strategic, capital }, null, 2));
    throw new Error(`ROI calculation failed: ${calcError instanceof Error ? calcError.message : String(calcError)}`);
  }

  // Ensure UserProfile exists (defensive — should already exist via Client FK)
  await prisma.userProfile.upsert({
    where: { clerkUserId: clientUserId },
    update: {},
    create: { clerkUserId: clientUserId, email: "" },
  });

  // Create Deal + LeaseOption + IndustryProfile in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update client with gathered data
    await tx.client.update({
      where: { id: clientId },
      data: {
        industry,
        currentHeadcount: headcount,
        projectedHeadcount12mo: data.projectedHeadcount12mo ?? headcount,
        currentAnnualRevenue: annualRevenue,
        revenuePerEmployee,
        projectedRevenueGrowth: data.projectedRevenueGrowth,
        sfPerEmployee,
        budgetConstraint: data.budgetConstraint,
        primaryGoal: data.primaryGoal,
        expansionTimeline: data.expansionTimeline,
        criticalAmenities: data.criticalAmenities ? JSON.stringify(data.criticalAmenities) : null,
        questionnaireCompletedAt: new Date(),
      },
    });

    // Upsert industry profile (handles re-runs and race conditions gracefully)
    await tx.industryProfile.upsert({
      where: { clientId },
      update: {
        industryType: industry,
        industryInputs: JSON.parse(JSON.stringify(data.industryInputs ?? {})),
        roiOutputs: JSON.parse(JSON.stringify(roiOutputs)),
        roiCalcInputs: JSON.parse(JSON.stringify({ costAvoidance, productivity, strategic, capital })),
      },
      create: {
        clientId,
        industryType: industry,
        industryInputs: JSON.parse(JSON.stringify(data.industryInputs ?? {})),
        roiOutputs: JSON.parse(JSON.stringify(roiOutputs)),
        roiCalcInputs: JSON.parse(JSON.stringify({ costAvoidance, productivity, strategic, capital })),
      },
    });

    // Create Deal
    const deal = await tx.deal.create({
      data: {
        userId: clientUserId,
        dealName: `${data.companyName ?? clientName} - ${dealNameSuffix}`,
        clientName,
        clientId,
        propertyType: normalizePropertyType(lp.preferredPropertyType),
        sourceType,
        status: "CALCULATED",
      },
    });

    // Create a baseline lease option from gathered preferences
    await tx.leaseOption.create({
      data: {
        dealId: deal.id,
        sortOrder: 0,
        optionName: "Proposed Lease",
        rentableSF,
        termMonths,
        baseRentY1,
        escalationType: "FIXED_PERCENT",
        escalationPercent: 3.0,
        freeRentMonths,
        freeRentType: "ABATED",
        rentStructure: normalizeRentStructure(lp.preferredRentStructure),
        tiAllowance,
        estimatedBuildoutCost,
        discountRate: 8.0,
        annualRevenue,
        employees: headcount,
        expectedRevenueGrowth: data.projectedRevenueGrowth,
        opExPerSF: proposedOpEx,
      },
    });

    // Mark survey session as completed if provided
    if (surveySessionId) {
      await tx.surveySession.update({
        where: { id: surveySessionId },
        data: { phase: "COMPLETED" },
      });
    }

    return { dealId: deal.id };
  });

  return { dealId: result.dealId, roiOutputs };
}
