import { describe, it, expect } from "vitest";
import { prismaOptionToLeaseInput, type PrismaOption } from "../mappers";

/** Helper: builds a complete PrismaOption with sensible defaults. */
function buildPrismaOption(
  overrides: Partial<PrismaOption> = {}
): PrismaOption {
  return {
    id: "opt-1",
    optionName: "Option A",
    rentableSF: 10000,
    termMonths: 60,
    baseRentY1: 42,
    escalationType: "FIXED_PERCENT",
    escalationPercent: 3,
    freeRentMonths: 3,
    freeRentType: "ABATED",
    rentStructure: "GROSS",
    discountRate: 8,
    ...overrides,
  };
}

describe("prismaOptionToLeaseInput", () => {
  it("maps all required fields correctly", () => {
    const prisma = buildPrismaOption();
    const result = prismaOptionToLeaseInput(prisma);
    expect(result.optionName).toBe("Option A");
    expect(result.rentableSF).toBe(10000);
    expect(result.termMonths).toBe(60);
    expect(result.baseRentY1).toBe(42);
    expect(result.escalationType).toBe("FIXED_PERCENT");
    expect(result.escalationPercent).toBe(3);
    expect(result.freeRentMonths).toBe(3);
    expect(result.freeRentType).toBe("ABATED");
    expect(result.rentStructure).toBe("GROSS");
    expect(result.discountRate).toBe(8);
  });

  it("converts null optional fields to undefined", () => {
    const prisma = buildPrismaOption({
      usableSF: null,
      loadFactor: null,
      cpiAssumedPercent: null,
      opExPerSF: null,
      opExEscalation: null,
      propertyTax: null,
      parkingCostMonthly: null,
      otherMonthlyFees: null,
      tiAllowance: null,
      estimatedBuildoutCost: null,
      annualRevenue: null,
      employees: null,
      expectedRevenueGrowth: null,
    });
    const result = prismaOptionToLeaseInput(prisma);
    expect(result.usableSF).toBeUndefined();
    expect(result.loadFactor).toBeUndefined();
    expect(result.cpiAssumedPercent).toBeUndefined();
    expect(result.opExPerSF).toBeUndefined();
    expect(result.opExEscalation).toBeUndefined();
    expect(result.propertyTax).toBeUndefined();
    expect(result.parkingCostMonthly).toBeUndefined();
    expect(result.otherMonthlyFees).toBeUndefined();
    expect(result.tiAllowance).toBeUndefined();
    expect(result.estimatedBuildoutCost).toBeUndefined();
    expect(result.annualRevenue).toBeUndefined();
    expect(result.employees).toBeUndefined();
    expect(result.expectedRevenueGrowth).toBeUndefined();
  });

  it("preserves numeric optional fields when present", () => {
    const prisma = buildPrismaOption({
      usableSF: 9000,
      loadFactor: 11.1,
      cpiAssumedPercent: 2.5,
      opExPerSF: 15,
      opExEscalation: 2,
      propertyTax: 3.5,
      parkingCostMonthly: 250,
      otherMonthlyFees: 100,
      tiAllowance: 50000,
      estimatedBuildoutCost: 75000,
      annualRevenue: 500000,
      employees: 25,
      expectedRevenueGrowth: 5,
    });
    const result = prismaOptionToLeaseInput(prisma);
    expect(result.usableSF).toBe(9000);
    expect(result.loadFactor).toBe(11.1);
    expect(result.cpiAssumedPercent).toBe(2.5);
    expect(result.opExPerSF).toBe(15);
    expect(result.opExEscalation).toBe(2);
    expect(result.propertyTax).toBe(3.5);
    expect(result.parkingCostMonthly).toBe(250);
    expect(result.otherMonthlyFees).toBe(100);
    expect(result.tiAllowance).toBe(50000);
    expect(result.estimatedBuildoutCost).toBe(75000);
    expect(result.annualRevenue).toBe(500000);
    expect(result.employees).toBe(25);
    expect(result.expectedRevenueGrowth).toBe(5);
  });

  it("correctly casts string enums to union types", () => {
    const prisma = buildPrismaOption({
      escalationType: "CPI",
      freeRentType: "DEFERRED",
      rentStructure: "NNN",
    });
    const result = prismaOptionToLeaseInput(prisma);
    expect(result.escalationType).toBe("CPI");
    expect(result.freeRentType).toBe("DEFERRED");
    expect(result.rentStructure).toBe("NNN");
  });

  it("strips extra Prisma fields (id, foreign keys, timestamps)", () => {
    const prisma = buildPrismaOption({
      id: "clxyz123",
      // Simulate extra Prisma fields
      dealId: "deal-abc",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as unknown as PrismaOption);
    const result = prismaOptionToLeaseInput(prisma);
    // Result should not contain these keys
    expect("id" in result).toBe(false);
    expect("dealId" in result).toBe(false);
    expect("createdAt" in result).toBe(false);
    expect("updatedAt" in result).toBe(false);
  });

  it("handles zero values correctly (does not convert to undefined)", () => {
    const prisma = buildPrismaOption({
      freeRentMonths: 0,
      escalationPercent: 0,
      discountRate: 0,
    });
    const result = prismaOptionToLeaseInput(prisma);
    expect(result.freeRentMonths).toBe(0);
    expect(result.escalationPercent).toBe(0);
    expect(result.discountRate).toBe(0);
  });
});
