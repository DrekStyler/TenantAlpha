import { describe, it, expect } from "vitest";
import { leaseOptionSchema } from "../option";

/** Helper: builds a valid lease option form data object. */
function validOption(overrides: Record<string, unknown> = {}) {
  return {
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
    ...overrides,
  };
}

describe("leaseOptionSchema", () => {
  describe("valid inputs", () => {
    it("parses a minimal valid option", () => {
      const result = leaseOptionSchema.safeParse(validOption());
      expect(result.success).toBe(true);
    });

    it("parses a fully-specified option", () => {
      const result = leaseOptionSchema.safeParse(
        validOption({
          propertyAddress: "123 Main St",
          propertyType: "OFFICE",
          usableSF: 9000,
          loadFactor: 11.1,
          leaseCommencementDate: "2025-01-01",
          cpiAssumedPercent: 2.5,
          opExPerSF: 15,
          opExEscalation: 2,
          propertyTax: 3.5,
          parkingCostMonthly: 250,
          otherMonthlyFees: 100,
          tiAllowance: 50000,
          estimatedBuildoutCost: 75000,
          existingCondition: "SHELL",
          annualRevenue: 500000,
          employees: 25,
          expectedRevenueGrowth: 5,
          sortOrder: 1,
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe("required field validation", () => {
    it("rejects missing optionName", () => {
      const { optionName, ...rest } = validOption();
      const result = leaseOptionSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects empty optionName", () => {
      const result = leaseOptionSchema.safeParse(
        validOption({ optionName: "" })
      );
      expect(result.success).toBe(false);
    });

    it("rejects missing rentableSF", () => {
      const { rentableSF, ...rest } = validOption();
      const result = leaseOptionSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects zero rentableSF", () => {
      const result = leaseOptionSchema.safeParse(
        validOption({ rentableSF: 0 })
      );
      expect(result.success).toBe(false);
    });

    it("rejects negative rentableSF", () => {
      const result = leaseOptionSchema.safeParse(
        validOption({ rentableSF: -1000 })
      );
      expect(result.success).toBe(false);
    });

    it("rejects missing termMonths", () => {
      const { termMonths, ...rest } = validOption();
      const result = leaseOptionSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects zero termMonths", () => {
      const result = leaseOptionSchema.safeParse(
        validOption({ termMonths: 0 })
      );
      expect(result.success).toBe(false);
    });

    it("rejects termMonths exceeding 30 years", () => {
      const result = leaseOptionSchema.safeParse(
        validOption({ termMonths: 361 })
      );
      expect(result.success).toBe(false);
    });

    it("accepts maximum termMonths (360)", () => {
      const result = leaseOptionSchema.safeParse(
        validOption({ termMonths: 360 })
      );
      expect(result.success).toBe(true);
    });

    it("rejects non-integer termMonths", () => {
      const result = leaseOptionSchema.safeParse(
        validOption({ termMonths: 60.5 })
      );
      expect(result.success).toBe(false);
    });

    it("rejects missing baseRentY1", () => {
      const { baseRentY1, ...rest } = validOption();
      const result = leaseOptionSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects zero baseRentY1", () => {
      const result = leaseOptionSchema.safeParse(
        validOption({ baseRentY1: 0 })
      );
      expect(result.success).toBe(false);
    });
  });

  describe("enum validation", () => {
    it("accepts all valid escalation types", () => {
      for (const type of ["FIXED_PERCENT", "CPI"]) {
        const result = leaseOptionSchema.safeParse(
          validOption({ escalationType: type })
        );
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid escalation type", () => {
      const result = leaseOptionSchema.safeParse(
        validOption({ escalationType: "LINEAR" })
      );
      expect(result.success).toBe(false);
    });

    it("accepts all valid free rent types", () => {
      for (const type of ["ABATED", "DEFERRED"]) {
        const result = leaseOptionSchema.safeParse(
          validOption({ freeRentType: type })
        );
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid free rent type", () => {
      const result = leaseOptionSchema.safeParse(
        validOption({ freeRentType: "REDUCED" })
      );
      expect(result.success).toBe(false);
    });

    it("accepts all valid rent structures", () => {
      for (const type of ["GROSS", "NNN", "MODIFIED_GROSS"]) {
        const result = leaseOptionSchema.safeParse(
          validOption({ rentStructure: type })
        );
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid rent structure", () => {
      const result = leaseOptionSchema.safeParse(
        validOption({ rentStructure: "FULL_SERVICE" })
      );
      expect(result.success).toBe(false);
    });

    it("accepts all valid property types", () => {
      for (const type of ["OFFICE", "RETAIL", "INDUSTRIAL", "FLEX", "OTHER"]) {
        const result = leaseOptionSchema.safeParse(
          validOption({ propertyType: type })
        );
        expect(result.success).toBe(true);
      }
    });

    it("accepts all valid existing conditions", () => {
      for (const type of ["SHELL", "SECOND_GEN", "TURNKEY", "AS_IS"]) {
        const result = leaseOptionSchema.safeParse(
          validOption({ existingCondition: type })
        );
        expect(result.success).toBe(true);
      }
    });
  });

  describe("optional fields with .catch(undefined)", () => {
    it("converts NaN to undefined for numeric optional fields", () => {
      // React Hook Form with valueAsNumber returns NaN for empty inputs
      const result = leaseOptionSchema.safeParse(
        validOption({
          usableSF: NaN,
          loadFactor: NaN,
          opExPerSF: NaN,
          tiAllowance: NaN,
          employees: NaN,
        })
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.usableSF).toBeUndefined();
        expect(result.data.loadFactor).toBeUndefined();
        expect(result.data.opExPerSF).toBeUndefined();
        expect(result.data.tiAllowance).toBeUndefined();
        expect(result.data.employees).toBeUndefined();
      }
    });

    it("converts null to undefined for optional fields", () => {
      const result = leaseOptionSchema.safeParse(
        validOption({
          usableSF: null,
          cpiAssumedPercent: null,
          opExPerSF: null,
          annualRevenue: null,
        })
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.usableSF).toBeUndefined();
        expect(result.data.cpiAssumedPercent).toBeUndefined();
        expect(result.data.opExPerSF).toBeUndefined();
        expect(result.data.annualRevenue).toBeUndefined();
      }
    });
  });

  describe("range validation", () => {
    it("rejects escalationPercent over 50", () => {
      const result = leaseOptionSchema.safeParse(
        validOption({ escalationPercent: 51 })
      );
      expect(result.success).toBe(false);
    });

    it("rejects negative escalationPercent", () => {
      const result = leaseOptionSchema.safeParse(
        validOption({ escalationPercent: -1 })
      );
      expect(result.success).toBe(false);
    });

    it("rejects negative freeRentMonths", () => {
      const result = leaseOptionSchema.safeParse(
        validOption({ freeRentMonths: -1 })
      );
      expect(result.success).toBe(false);
    });

    it("accepts zero freeRentMonths", () => {
      const result = leaseOptionSchema.safeParse(
        validOption({ freeRentMonths: 0 })
      );
      expect(result.success).toBe(true);
    });

    it("defaults discountRate to 8.0 on invalid input", () => {
      const result = leaseOptionSchema.safeParse(
        validOption({ discountRate: "not a number" })
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.discountRate).toBe(8.0);
      }
    });

    it("falls back to 8.0 when discountRate exceeds 100", () => {
      // discountRate uses .catch(8.0), so out-of-range values fall back
      const result = leaseOptionSchema.safeParse(
        validOption({ discountRate: 101 })
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.discountRate).toBe(8.0);
      }
    });

    it("rejects loadFactor over 100", () => {
      const result = leaseOptionSchema.safeParse(
        validOption({ loadFactor: 101 })
      );
      // .catch(undefined) means it doesn't fail — it falls back
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.loadFactor).toBeUndefined();
      }
    });

    it("rejects expectedRevenueGrowth below -100", () => {
      const result = leaseOptionSchema.safeParse(
        validOption({ expectedRevenueGrowth: -101 })
      );
      // .catch(undefined) catches it
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.expectedRevenueGrowth).toBeUndefined();
      }
    });

    it("allows expectedRevenueGrowth of -100 (total decline)", () => {
      const result = leaseOptionSchema.safeParse(
        validOption({ expectedRevenueGrowth: -100 })
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.expectedRevenueGrowth).toBe(-100);
      }
    });

    it("rejects non-integer employees", () => {
      const result = leaseOptionSchema.safeParse(
        validOption({ employees: 10.5 })
      );
      // .catch(undefined) catches the int validation failure
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.employees).toBeUndefined();
      }
    });

    it("rejects negative employees", () => {
      const result = leaseOptionSchema.safeParse(
        validOption({ employees: -5 })
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.employees).toBeUndefined();
      }
    });
  });
});
