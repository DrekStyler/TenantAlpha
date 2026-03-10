import { auth } from "@clerk/nextjs/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dealSchema } from "@/schemas/deal";
import { ok, unauthorized, badRequest, forbidden, err } from "@/lib/api";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const deals = await prisma.deal.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { options: true } },
        options: { select: { rentableSF: true } },
      },
    });

    // Include sourceType in the response for ROI link rendering
    return ok(deals);
  } catch (e) {
    console.error("[api/deals] GET error:", e);
    return err("Failed to load deals", 500);
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const body = await req.json();
  const parsed = dealSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  // Fetch client data for intelligent defaults if a client is linked
  let clientData: {
    currentHeadcount: number | null;
    sfPerEmployee: number | null;
    currentAnnualRevenue: number | null;
    projectedRevenueGrowth: number | null;
    industryProfile: {
      roiCalcInputs: unknown;
    } | null;
  } | null = null;

  if (parsed.data.clientId) {
    const client = await prisma.client.findUnique({
      where: { id: parsed.data.clientId },
      select: {
        userId: true,
        currentHeadcount: true,
        sfPerEmployee: true,
        currentAnnualRevenue: true,
        projectedRevenueGrowth: true,
        industryProfile: { select: { roiCalcInputs: true } },
      },
    });
    if (!client || client.userId !== userId) {
      return forbidden();
    }
    clientData = client;
  }

  try {
    // Ensure user profile exists
    await prisma.userProfile.upsert({
      where: { clerkUserId: userId },
      update: {},
      create: { clerkUserId: userId, email: "" },
    });

    // Build intelligent defaults from client survey data
    const targetSF = parsed.data.targetSF;
    const sfFromClient =
      clientData?.currentHeadcount && clientData?.sfPerEmployee
        ? Math.round(clientData.currentHeadcount * clientData.sfPerEmployee)
        : null;
    const rentableSF = targetSF ?? sfFromClient ?? 5000;

    // Extract ROI calc inputs if available
    const roiInputs = clientData?.industryProfile?.roiCalcInputs as {
      costAvoidance?: { currentRentPerSF?: number; currentEscalationPercent?: number };
      capital?: { tiAllowance?: number; estimatedBuildoutCost?: number; freeRentMonths?: number };
    } | null;

    // Current lease data from survey
    const surveyCurrentRent = roiInputs?.costAvoidance?.currentRentPerSF;
    const surveyCurrentEscalation = roiInputs?.costAvoidance?.currentEscalationPercent;
    const surveyTI = roiInputs?.capital?.tiAllowance;
    const surveyBuildout = roiInputs?.capital?.estimatedBuildoutCost;

    // Business context fields
    const annualRevenue = clientData?.currentAnnualRevenue ?? undefined;
    const employees = clientData?.currentHeadcount ?? undefined;
    const expectedRevenueGrowth = clientData?.projectedRevenueGrowth ?? undefined;

    // Shared defaults across all options
    const shared = {
      rentableSF,
      termMonths: 60,
      escalationType: "FIXED_PERCENT" as const,
      freeRentType: "ABATED" as const,
      rentStructure: "GROSS" as const,
      discountRate: 8.0,
      propertyType: parsed.data.propertyType,
      ...(annualRevenue != null ? { annualRevenue } : {}),
      ...(employees != null ? { employees } : {}),
      ...(expectedRevenueGrowth != null ? { expectedRevenueGrowth } : {}),
    };

    // Create deal + 3 options in a transaction
    const deal = await prisma.$transaction(async (tx) => {
      const newDeal = await tx.deal.create({
        data: { ...parsed.data, userId } as Prisma.DealUncheckedCreateInput,
      });

      // Option A: Current Lease — baseline/existing conditions
      await tx.leaseOption.create({
        data: {
          dealId: newDeal.id,
          sortOrder: 0,
          optionName: "Option A",
          baseRentY1: surveyCurrentRent ?? 45,
          escalationPercent: surveyCurrentEscalation ?? 3.5,
          freeRentMonths: 0,
          estimatedBuildoutCost: surveyBuildout ?? undefined,
          ...shared,
        },
      });

      // Option B: Proposed Lease — main deal being negotiated
      await tx.leaseOption.create({
        data: {
          dealId: newDeal.id,
          sortOrder: 1,
          optionName: "Option B",
          baseRentY1: surveyCurrentRent ? Math.round(surveyCurrentRent * 0.9) : 40,
          escalationPercent: 3.0,
          freeRentMonths: 3,
          tiAllowance: surveyTI ?? rentableSF * 40,
          estimatedBuildoutCost: surveyBuildout ?? rentableSF * 60,
          ...shared,
        },
      });

      // Option C: Aggressive Negotiation — best-case scenario
      await tx.leaseOption.create({
        data: {
          dealId: newDeal.id,
          sortOrder: 2,
          optionName: "Option C",
          baseRentY1: surveyCurrentRent ? Math.round(surveyCurrentRent * 0.78) : 35,
          escalationPercent: 2.5,
          freeRentMonths: 6,
          tiAllowance: surveyTI ? Math.round(surveyTI * 1.35) : rentableSF * 55,
          estimatedBuildoutCost: surveyBuildout ?? rentableSF * 60,
          ...shared,
        },
      });

      return newDeal;
    });

    return ok(deal, 201);
  } catch (e) {
    console.error("[api/deals] POST error:", e);
    return err("Failed to create deal", 500);
  }
}
