import { describe, it, expect } from "vitest";
import {
  buildDealContext,
  sanitizeDealContext,
  sanitizeOptions,
} from "../ai";

describe("buildDealContext", () => {
  const minimalOption = {
    optionName: "Option A",
    rentableSF: 10000,
    termMonths: 60,
    baseRentY1: 42,
    escalationType: "FIXED_PERCENT",
    escalationPercent: 3,
    freeRentMonths: 2,
    freeRentType: "ABATED",
    rentStructure: "GROSS",
    discountRate: 8,
  };

  it("produces context string containing option details", () => {
    const ctx = buildDealContext("Test Deal", [minimalOption]);
    expect(ctx).toContain("Option A");
    expect(ctx).toContain("10,000 SF");
    expect(ctx).toContain("60 months");
    expect(ctx).toContain("$42.00/SF/year");
    expect(ctx).toContain("3% fixed");
    expect(ctx).toContain("2 months");
  });

  it("includes optional fields when present", () => {
    const option = {
      ...minimalOption,
      opExPerSF: 15.5,
      tiAllowance: 50000,
      estimatedBuildoutCost: 75000,
      parkingCostMonthly: 250,
    };
    const ctx = buildDealContext("Deal", [option]);
    expect(ctx).toContain("OpEx: $15.50/SF/year");
    expect(ctx).toContain("TI Allowance: $50,000");
    expect(ctx).toContain("Est. Buildout: $75,000");
    expect(ctx).toContain("Parking: $250/month");
  });

  it("omits optional fields when null/undefined", () => {
    const ctx = buildDealContext("Deal", [minimalOption]);
    expect(ctx).not.toContain("OpEx:");
    expect(ctx).not.toContain("TI Allowance:");
    expect(ctx).not.toContain("Est. Buildout:");
    expect(ctx).not.toContain("Parking:");
  });

  it("includes calculation results when provided", () => {
    const results = {
      options: [
        {
          optionName: "Option A",
          rentableSF: 10000,
          termMonths: 60,
          totalOccupancyCost: 2500000,
          effectiveRentPerSF: 48.5,
          effectiveRentPerSFWithTI: 46.2,
          npvOfCosts: 2100000,
          tiGap: 25000,
          paybackPeriodMonths: 8,
          costPerEmployeePerYear: 5000,
          rentAsPercentOfRevenue: 18.5,
          totalFreeRentSavings: 70000,
          netEffectiveRentPerSF: 45.0,
          straightLineMonthlyRent: 20000,
          expenseStopExposure: 0,
          effectiveRentPerUSF: null,
          tiAllowancePerRSF: 25.0,
          pvOfConcessions: 320000,
          monthlyCosts: [],
          annualCashFlows: [],
          rentAsPercentOfRevenueByYear: [],
          monthlyBreakdown: [],
        },
      ],
      rankedByEffectiveRent: ["Option A"],
      rankedByNPV: ["Option A"],
      bestValueOption: "Option A",
      bestValueReasons: ["Lowest NPV"],
    };
    const ctx = buildDealContext("Deal", [minimalOption], results);
    expect(ctx).toContain("CALCULATED METRICS");
    expect(ctx).toContain("Total Occupancy Cost: $2,500,000");
    expect(ctx).toContain("Effective Rent: $48.50/SF");
    expect(ctx).toContain("NPV of Costs: $2,100,000");
    expect(ctx).toContain("RANKINGS");
    expect(ctx).toContain("Best Value: Option A");
  });

  it("handles CPI escalation type formatting", () => {
    const cpiOption = {
      ...minimalOption,
      escalationType: "CPI",
      escalationPercent: 2.5,
    };
    const ctx = buildDealContext("Deal", [cpiOption]);
    expect(ctx).toContain("CPI (assumed 2.5%)");
  });

  it("sanitizes deal name with PII", () => {
    const ctx = buildDealContext(
      "John's Deal at 123 Main St for john@test.com",
      [minimalOption]
    );
    // Email should be redacted
    expect(ctx).not.toContain("john@test.com");
    expect(ctx).toContain("[REDACTED]");
  });
});

describe("sanitizeDealContext", () => {
  it("redacts email addresses", () => {
    const input = "Contact: john.doe@company.com for details";
    expect(sanitizeDealContext(input)).toBe(
      "Contact: [REDACTED] for details"
    );
  });

  it("redacts multiple emails", () => {
    const input = "CC: a@b.com and c@d.org";
    const result = sanitizeDealContext(input);
    expect(result).not.toContain("a@b.com");
    expect(result).not.toContain("c@d.org");
  });

  it("redacts US phone numbers", () => {
    const testCases = [
      "Call (555) 123-4567",
      "Call 555-123-4567",
      "Call 555.123.4567",
      "Call +1-555-123-4567",
      "Call 1.555.123.4567",
    ];
    testCases.forEach((input) => {
      const result = sanitizeDealContext(input);
      expect(result).toContain("[REDACTED]");
      expect(result).not.toMatch(/555.*123.*4567/);
    });
  });

  it("redacts street addresses", () => {
    const addresses = [
      "Located at 123 Main Street",
      "Located at 456 Oak Ave",
      "Located at 789 Broadway Blvd",
      "Located at 1 Park Drive",
      "Located at 42 Elm Lane",
      "Located at 555 Market Court",
    ];
    addresses.forEach((input) => {
      expect(sanitizeDealContext(input)).toContain("[REDACTED]");
    });
  });

  it("redacts addresses with suite/unit/floor", () => {
    const input =
      "Office at 100 Technology Pkwy Suite 200";
    const result = sanitizeDealContext(input);
    expect(result).toContain("[REDACTED]");
    expect(result).not.toContain("100 Technology Pkwy");
  });

  it("preserves non-PII content", () => {
    const input =
      "Option A has 10,000 SF with $42/SF base rent and 3% escalation";
    expect(sanitizeDealContext(input)).toBe(input);
  });

  it("handles mixed PII and CRE data", () => {
    const input =
      "Deal for john@acme.com at 500 Market Street with 10,000 SF at $42/SF";
    const result = sanitizeDealContext(input);
    expect(result).not.toContain("john@acme.com");
    expect(result).not.toContain("500 Market Street");
    expect(result).toContain("10,000 SF");
    expect(result).toContain("$42/SF");
  });
});

describe("sanitizeOptions", () => {
  it("filters to only allowed fields", () => {
    const option = {
      optionName: "Option A",
      rentableSF: 10000,
      baseRentY1: 42,
      termMonths: 60,
      escalationType: "FIXED_PERCENT",
      escalationPercent: 3,
      freeRentMonths: 2,
      freeRentType: "ABATED",
      rentStructure: "GROSS",
      discountRate: 8,
      // Fields that should be stripped
      id: "clxyz123",
      dealId: "deal-abc",
      propertyAddress: "123 Main St, San Francisco",
      clientName: "John Doe",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    };
    const [result] = sanitizeOptions([option]);
    expect(result.optionName).toBe("Option A");
    expect(result.rentableSF).toBe(10000);
    expect("id" in result).toBe(false);
    expect("dealId" in result).toBe(false);
    expect("propertyAddress" in result).toBe(false);
    expect("clientName" in result).toBe(false);
    expect("createdAt" in result).toBe(false);
    expect("updatedAt" in result).toBe(false);
  });

  it("includes all allowed CRE fields when present", () => {
    const option = {
      optionName: "Option A",
      rentableSF: 10000,
      usableSF: 9000,
      loadFactor: 11.1,
      termMonths: 60,
      baseRentY1: 42,
      escalationType: "FIXED_PERCENT",
      escalationPercent: 3,
      cpiAssumedPercent: 2.5,
      freeRentMonths: 2,
      freeRentType: "ABATED",
      rentStructure: "NNN",
      opExPerSF: 15,
      opExEscalation: 2,
      propertyTax: 3.5,
      parkingCostMonthly: 250,
      otherMonthlyFees: 100,
      tiAllowance: 50000,
      estimatedBuildoutCost: 75000,
      existingCondition: "SHELL",
      discountRate: 8,
    };
    const [result] = sanitizeOptions([option]);
    expect(Object.keys(result).length).toBe(21); // All 21 allowed fields
  });

  it("omits null/undefined fields from output", () => {
    const option = {
      optionName: "Option A",
      rentableSF: 10000,
      termMonths: 60,
      baseRentY1: 42,
      escalationType: "FIXED_PERCENT",
      escalationPercent: 3,
      freeRentMonths: 2,
      freeRentType: "ABATED",
      rentStructure: "GROSS",
      discountRate: 8,
      opExPerSF: null,
      tiAllowance: undefined,
    };
    const [result] = sanitizeOptions([option as Record<string, unknown>]);
    expect("opExPerSF" in result).toBe(false);
    expect("tiAllowance" in result).toBe(false);
  });

  it("sanitizes multiple options", () => {
    const options = [
      {
        optionName: "A",
        rentableSF: 10000,
        id: "1",
        termMonths: 60,
        baseRentY1: 42,
        escalationType: "FIXED_PERCENT",
        escalationPercent: 3,
        freeRentMonths: 2,
        freeRentType: "ABATED",
        rentStructure: "GROSS",
        discountRate: 8,
      },
      {
        optionName: "B",
        rentableSF: 12000,
        id: "2",
        termMonths: 60,
        baseRentY1: 38,
        escalationType: "CPI",
        escalationPercent: 2.5,
        freeRentMonths: 4,
        freeRentType: "DEFERRED",
        rentStructure: "NNN",
        discountRate: 7,
      },
    ];
    const results = sanitizeOptions(options);
    expect(results).toHaveLength(2);
    expect(results[0].optionName).toBe("A");
    expect(results[1].optionName).toBe("B");
    expect("id" in results[0]).toBe(false);
    expect("id" in results[1]).toBe(false);
  });
});
