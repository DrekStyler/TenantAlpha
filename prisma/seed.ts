import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL environment variable is required");
  const adapter = new PrismaPg({ connectionString, ssl: { rejectUnauthorized: false } });
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

async function main() {
  // ── Demo broker profile ──────────────────────────────────────────
  const userId = "user_seed_demo";

  await prisma.userProfile.upsert({
    where: { clerkUserId: userId },
    update: {},
    create: {
      clerkUserId: userId,
      email: "demo@tenantalpha.com",
      name: "Alex Broker",
      brokerageName: "Summit Commercial Realty",
    },
  });

  // ── Deal 1: Acme Corp — Office Relocation ─────────────────────────
  const deal1 = await prisma.deal.upsert({
    where: { id: "seed-deal-acme" },
    update: {},
    create: {
      id: "seed-deal-acme",
      userId,
      dealName: "Acme Corp — Office Relocation",
      clientName: "Acme Corp",
      propertyType: "OFFICE",
      status: "CALCULATED",
    },
  });

  await prisma.leaseOption.upsert({
    where: { id: "seed-acme-a" },
    update: {},
    create: {
      id: "seed-acme-a",
      dealId: deal1.id,
      sortOrder: 0,
      optionName: "Option A — Downtown Tower",
      propertyAddress: "100 Main St, Ste 2000, Chicago IL 60601",
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
      existingCondition: "SECOND_GEN",
      discountRate: 8.0,
      annualRevenue: 8000000,
      employees: 35,
    },
  });

  await prisma.leaseOption.upsert({
    where: { id: "seed-acme-b" },
    update: {},
    create: {
      id: "seed-acme-b",
      dealId: deal1.id,
      sortOrder: 1,
      optionName: "Option B — Midtown Campus",
      propertyAddress: "500 Park Ave, Bldg 3, Chicago IL 60611",
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
      existingCondition: "SECOND_GEN",
      discountRate: 8.0,
      annualRevenue: 8000000,
      employees: 35,
    },
  });

  await prisma.leaseOption.upsert({
    where: { id: "seed-acme-c" },
    update: {},
    create: {
      id: "seed-acme-c",
      dealId: deal1.id,
      sortOrder: 2,
      optionName: "Option C — Suburban Park",
      propertyAddress: "1 Corporate Dr, Schaumburg IL 60173",
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
      existingCondition: "SHELL",
      discountRate: 8.0,
      annualRevenue: 8000000,
      employees: 35,
    },
  });

  // ── Deal 2: Brightline Logistics — Industrial Expansion ──────────
  const deal2 = await prisma.deal.upsert({
    where: { id: "seed-deal-brightline" },
    update: {},
    create: {
      id: "seed-deal-brightline",
      userId,
      dealName: "Brightline Logistics — Warehouse Expansion",
      clientName: "Brightline Logistics",
      propertyType: "INDUSTRIAL",
      status: "DRAFT",
    },
  });

  await prisma.leaseOption.upsert({
    where: { id: "seed-bright-a" },
    update: {},
    create: {
      id: "seed-bright-a",
      dealId: deal2.id,
      sortOrder: 0,
      optionName: "Option A — North Distribution Center",
      propertyAddress: "4200 Industrial Blvd, Elk Grove Village IL 60007",
      propertyType: "INDUSTRIAL",
      rentableSF: 50000,
      termMonths: 60,
      baseRentY1: 9.50,
      escalationType: "FIXED_PERCENT",
      escalationPercent: 3.0,
      freeRentMonths: 2,
      freeRentType: "ABATED",
      rentStructure: "NNN",
      opExPerSF: 2.5,
      parkingCostMonthly: 0,
      tiAllowance: 250000,
      estimatedBuildoutCost: 300000,
      existingCondition: "AS_IS",
      discountRate: 7.5,
      annualRevenue: 22000000,
      employees: 80,
    },
  });

  await prisma.leaseOption.upsert({
    where: { id: "seed-bright-b" },
    update: {},
    create: {
      id: "seed-bright-b",
      dealId: deal2.id,
      sortOrder: 1,
      optionName: "Option B — South Fulfillment Hub",
      propertyAddress: "900 Logistics Pkwy, Joliet IL 60435",
      propertyType: "INDUSTRIAL",
      rentableSF: 55000,
      termMonths: 72,
      baseRentY1: 8.25,
      escalationType: "FIXED_PERCENT",
      escalationPercent: 2.5,
      freeRentMonths: 4,
      freeRentType: "ABATED",
      rentStructure: "NNN",
      opExPerSF: 2.0,
      parkingCostMonthly: 0,
      tiAllowance: 385000,
      estimatedBuildoutCost: 400000,
      existingCondition: "SECOND_GEN",
      discountRate: 7.5,
      annualRevenue: 22000000,
      employees: 80,
    },
  });

  // ── Sample saved leases ───────────────────────────────────────────
  await prisma.savedLease.upsert({
    where: { id: "seed-lease-1" },
    update: {},
    create: {
      id: "seed-lease-1",
      userId,
      leaseName: "River North Office — 2022 Renewal",
      tenantName: "FinServ Partners LLC",
      propertyAddress: "350 N Orleans St, Chicago IL 60654",
      propertyType: "OFFICE",
      rentableSF: 4500,
      termMonths: 36,
      baseRentY1: 44.0,
      escalationType: "FIXED_PERCENT",
      escalationPercent: 3.0,
      rentStructure: "GROSS",
      tiAllowance: 90000,
      signedDate: new Date("2022-06-01"),
      notes: "Renewal with 3-month free rent concession.",
    },
  });

  await prisma.savedLease.upsert({
    where: { id: "seed-lease-2" },
    update: {},
    create: {
      id: "seed-lease-2",
      userId,
      leaseName: "Naperville Flex — New Lease 2023",
      tenantName: "Apex Manufacturing",
      propertyAddress: "1125 Flex Dr, Naperville IL 60563",
      propertyType: "FLEX",
      rentableSF: 12000,
      termMonths: 60,
      baseRentY1: 14.50,
      escalationType: "FIXED_PERCENT",
      escalationPercent: 2.5,
      rentStructure: "NNN",
      tiAllowance: 60000,
      signedDate: new Date("2023-03-15"),
      notes: "Tenant built out office portion at own expense.",
    },
  });

  console.log("✅ Seed complete:");
  console.log("   • 1 demo broker profile");
  console.log("   • 2 deals (Acme Corp office + Brightline industrial)");
  console.log("   • 5 lease options");
  console.log("   • 2 saved leases");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
