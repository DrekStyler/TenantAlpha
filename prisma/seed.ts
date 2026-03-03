import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create a test user profile (replace with a real Clerk user ID when testing)
  const userId = "user_test_seed";

  await prisma.userProfile.upsert({
    where: { clerkUserId: userId },
    update: {},
    create: {
      clerkUserId: userId,
      email: "demo@tenantalpha.com",
      name: "Demo Broker",
      brokerageName: "Demo Realty",
    },
  });

  // Create Acme Corp sample deal
  const deal = await prisma.deal.upsert({
    where: { id: "seed-acme-deal" },
    update: {},
    create: {
      id: "seed-acme-deal",
      userId,
      dealName: "Acme Corp — Office Relocation Analysis",
      clientName: "Acme Corp",
      propertyType: "OFFICE",
      status: "DRAFT",
    },
  });

  // Option A
  await prisma.leaseOption.upsert({
    where: { id: "seed-option-a" },
    update: {},
    create: {
      id: "seed-option-a",
      dealId: deal.id,
      sortOrder: 0,
      optionName: "Option A — Downtown Tower",
      propertyAddress: "100 Main St, Ste 2000",
      propertyType: "OFFICE",
      rentableSF: 6000,
      termMonths: 60,
      baseRentY1: 52.0,
      escalationType: "FIXED_PERCENT",
      escalationPercent: 3.0,
      freeRentMonths: 3,
      freeRentType: "ABATED",
      rentStructure: "GROSS",
      parkingCostMonthly: 3000,
      tiAllowance: 300000,
      estimatedBuildoutCost: 400000,
      discountRate: 8.0,
      annualRevenue: 8000000,
      employees: 35,
    },
  });

  // Option B
  await prisma.leaseOption.upsert({
    where: { id: "seed-option-b" },
    update: {},
    create: {
      id: "seed-option-b",
      dealId: deal.id,
      sortOrder: 1,
      optionName: "Option B — Midtown Campus",
      propertyAddress: "500 Park Ave, Bldg 3",
      propertyType: "OFFICE",
      rentableSF: 6500,
      termMonths: 60,
      baseRentY1: 46.0,
      escalationType: "FIXED_PERCENT",
      escalationPercent: 2.5,
      freeRentMonths: 2,
      freeRentType: "ABATED",
      rentStructure: "GROSS",
      parkingCostMonthly: 2500,
      tiAllowance: 195000,
      estimatedBuildoutCost: 250000,
      discountRate: 8.0,
      annualRevenue: 8000000,
      employees: 35,
    },
  });

  // Option C
  await prisma.leaseOption.upsert({
    where: { id: "seed-option-c" },
    update: {},
    create: {
      id: "seed-option-c",
      dealId: deal.id,
      sortOrder: 2,
      optionName: "Option C — Suburban Park",
      propertyAddress: "1 Corporate Dr",
      propertyType: "OFFICE",
      rentableSF: 7000,
      termMonths: 84,
      baseRentY1: 32.0,
      escalationType: "FIXED_PERCENT",
      escalationPercent: 3.0,
      freeRentMonths: 6,
      freeRentType: "ABATED",
      rentStructure: "NNN",
      opExPerSF: 14.0,
      parkingCostMonthly: 0,
      tiAllowance: 420000,
      estimatedBuildoutCost: 420000,
      discountRate: 8.0,
      annualRevenue: 8000000,
      employees: 35,
    },
  });

  console.log("✅ Seed complete — Acme Corp deal created");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
