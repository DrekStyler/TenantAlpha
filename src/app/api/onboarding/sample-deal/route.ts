import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { SAMPLE_DEAL, SAMPLE_OPTIONS } from "@/config/sampleData";
import { ok, unauthorized, err } from "@/lib/api";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  // Guard against duplicate sample deals
  const existing = await prisma.deal.findFirst({
    where: { userId, dealName: SAMPLE_DEAL.dealName },
    select: { id: true },
  });
  if (existing) {
    return ok({ dealId: existing.id, dealName: SAMPLE_DEAL.dealName });
  }

  try {
    // Ensure user profile exists
    await prisma.userProfile.upsert({
      where: { clerkUserId: userId },
      update: { onboardingCompletedAt: new Date() },
      create: { clerkUserId: userId, email: "" },
    });

    // Create deal + options in a transaction
    const deal = await prisma.$transaction(async (tx) => {
      const newDeal = await tx.deal.create({
        data: {
          dealName: SAMPLE_DEAL.dealName,
          clientName: SAMPLE_DEAL.clientName,
          propertyType: SAMPLE_DEAL.propertyType,
          sourceType: "MANUAL",
          status: "DRAFT",
          userId,
        },
      });

      for (let i = 0; i < SAMPLE_OPTIONS.length; i++) {
        const opt = SAMPLE_OPTIONS[i];
        await tx.leaseOption.create({
          data: {
            dealId: newDeal.id,
            sortOrder: i,
            optionName: opt.optionName,
            rentableSF: opt.rentableSF,
            termMonths: opt.termMonths,
            baseRentY1: opt.baseRentY1,
            escalationType: opt.escalationType,
            escalationPercent: opt.escalationPercent,
            freeRentMonths: opt.freeRentMonths,
            freeRentType: opt.freeRentType ?? "ABATED",
            rentStructure: opt.rentStructure ?? "GROSS",
            opExPerSF: opt.opExPerSF,
            parkingCostMonthly: opt.parkingCostMonthly,
            tiAllowance: opt.tiAllowance,
            estimatedBuildoutCost: opt.estimatedBuildoutCost,
            discountRate: opt.discountRate ?? 8.0,
            annualRevenue: opt.annualRevenue,
            employees: opt.employees,
            propertyType: SAMPLE_DEAL.propertyType,
          },
        });
      }

      return newDeal;
    });

    return ok({ dealId: deal.id, dealName: deal.dealName }, 201);
  } catch (e) {
    console.error("[api/onboarding/sample-deal] Error:", e);
    return err("Failed to create sample deal", 500);
  }
}
