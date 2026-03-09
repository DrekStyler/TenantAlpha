import { prisma } from "@/lib/prisma";
import { ok, notFound, badRequest, err, tooManyRequests } from "@/lib/api";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { calculateFullROI } from "@/engine/roi";
import type { ExtractedSurveyData, SurveyPhase } from "@/types/survey";
import type { CostAvoidanceInput, ProductivityInput, StrategicInput, CapitalInput } from "@/engine/roi/types";
import { INDUSTRY_BENCHMARKS } from "@/engine/roi/benchmarks";

// POST: Finalize the survey, create Deal + LeaseOption, compute ROI
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const rl = checkRateLimit(`survey:${token}`, RATE_LIMITS.survey);
  if (!rl.allowed) return tooManyRequests(rl.retryAfterMs);

  const client = await prisma.client.findUnique({
    where: { token },
    include: { surveySession: true },
  });

  if (!client) return notFound("Survey");
  if (client.questionnaireCompletedAt) {
    return err("This survey has already been completed.", 409);
  }

  const session = client.surveySession;
  if (!session) return badRequest("No survey session found.");

  const data = (session.extractedData as ExtractedSurveyData) ?? {};

  // Validate minimum required data
  if (!data.headcount || !data.industry) {
    return badRequest("Survey is incomplete. Industry and headcount are required.");
  }

  const industry = data.industry;
  const benchmarks = INDUSTRY_BENCHMARKS[industry as keyof typeof INDUSTRY_BENCHMARKS]
    ?? INDUSTRY_BENCHMARKS.GENERAL_OFFICE;

  // Derive reasonable defaults from gathered data
  const headcount = data.headcount ?? 10;
  const annualRevenue = data.annualRevenue ?? headcount * (("avgRevenuePerEmployee" in benchmarks ? benchmarks.avgRevenuePerEmployee as number : 250_000));
  const revenuePerEmployee = data.revenuePerEmployee ?? annualRevenue / headcount;
  const sfPerEmployee = data.sfPerEmployee ?? ("avgSFPerEmployee" in benchmarks ? benchmarks.avgSFPerEmployee as number : 180);
  const rentableSF = headcount * sfPerEmployee;
  const termMonths = data.leasePreferences?.preferredTerm ?? 60;
  const avgSalary = data.avgEmployeeSalary ?? ("avgEmployeeSalary" in benchmarks ? benchmarks.avgEmployeeSalary as number : 75_000);
  const turnover = data.currentEmployeeTurnover ?? ("avgTurnoverRate" in benchmarks ? (benchmarks.avgTurnoverRate as number) * 100 : 15);

  // Lease defaults
  const lp = data.leasePreferences ?? {};
  const baseRentY1 = lp.maxBaseRent ?? 35; // $/SF/yr default
  const tiAllowance = lp.tiExpectation ?? rentableSF * 40; // $40/SF default
  const freeRentMonths = lp.freeRentExpectation ?? 3;
  const estimatedBuildoutCost = rentableSF * 60; // $60/SF default buildout
  const monthlyBaseRent = (baseRentY1 * rentableSF) / 12;

  // Current lease defaults for cost avoidance
  const cl = data.currentLease ?? {};
  const currentRent = cl.currentRent ?? baseRentY1 * 1.1;
  const currentEscalation = cl.currentEscalation ?? 3.5;
  const currentOpEx = cl.currentOpEx ?? 12;
  const proposedOpEx = currentOpEx * 0.9; // assume 10% improvement in new space

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
    currentSFPerEmployee: sfPerEmployee * 0.85, // assume current space is suboptimal
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
    walkScore: 70, // default
    transitAccess: data.criticalAmenities?.includes("Public transit access") ?? false,
    amenityCount: data.criticalAmenities?.length ?? 0,
    buildingClass: "B", // default
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
    movingCosts: headcount * 500, // $500/person moving estimate
    furnitureIT: headcount * 3000, // $3000/person FF&E estimate
  };

  // Calculate ROI
  const roiOutputs = calculateFullROI(
    { costAvoidance, productivity, strategic, capital, industryType: industry, industryInputs: data.industryInputs ?? {} }
  );

  // Create Deal + LeaseOption + IndustryProfile in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update client with gathered data
    await tx.client.update({
      where: { id: client.id },
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

    // Create industry profile
    await tx.industryProfile.create({
      data: {
        clientId: client.id,
        industryType: industry,
        industryInputs: JSON.parse(JSON.stringify(data.industryInputs ?? {})),
        roiOutputs: JSON.parse(JSON.stringify(roiOutputs)),
      },
    });

    // Create Deal
    const deal = await tx.deal.create({
      data: {
        userId: client.userId,
        dealName: `${data.companyName ?? client.name} - AI Survey Analysis`,
        clientName: client.name,
        clientId: client.id,
        propertyType: (lp.preferredPropertyType as "OFFICE" | "RETAIL" | "INDUSTRIAL" | "FLEX" | "OTHER") ?? "OFFICE",
        sourceType: "AI_SURVEY",
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
        baseRentY1: baseRentY1,
        escalationType: "FIXED_PERCENT",
        escalationPercent: 3.0,
        freeRentMonths,
        freeRentType: "ABATED",
        rentStructure: (lp.preferredRentStructure as "GROSS" | "NNN" | "MODIFIED_GROSS") ?? "GROSS",
        tiAllowance,
        estimatedBuildoutCost,
        discountRate: 8.0,
        annualRevenue,
        employees: headcount,
        expectedRevenueGrowth: data.projectedRevenueGrowth,
        opExPerSF: proposedOpEx,
      },
    });

    // Mark survey session as completed
    await tx.surveySession.update({
      where: { id: session!.id },
      data: { phase: "COMPLETED" },
    });

    return { dealId: deal.id };
  });

  return ok({
    dealId: result.dealId,
    token,
    roiOutputs,
  });
}
