import { z } from "zod";

export const leaseOptionSchema = z.object({
  optionName: z.string().min(1, "Option name is required"),
  propertyAddress: z.string().optional(),
  propertyType: z
    .enum(["OFFICE", "RETAIL", "INDUSTRIAL", "FLEX", "OTHER"])
    .optional(),
  rentableSF: z.number().positive("Rentable SF must be positive"),
  usableSF: z.number().positive().optional(),
  loadFactor: z.number().min(0).max(100).optional(),
  leaseCommencementDate: z.string().optional(),
  termMonths: z
    .number()
    .int()
    .positive("Lease term must be positive")
    .max(360, "Lease term cannot exceed 30 years"),
  baseRentY1: z.number().positive("Base rent must be positive"),
  escalationType: z.enum(["FIXED_PERCENT", "CPI"]),
  escalationPercent: z.number().min(0).max(50),
  cpiAssumedPercent: z.number().min(0).max(50).optional(),
  freeRentMonths: z.number().int().min(0),
  freeRentType: z.enum(["ABATED", "DEFERRED"]),
  rentStructure: z.enum(["GROSS", "NNN", "MODIFIED_GROSS"]),
  opExPerSF: z.number().min(0).optional(),
  opExEscalation: z.number().min(0).max(50).optional(),
  propertyTax: z.number().min(0).optional(),
  parkingCostMonthly: z.number().min(0).optional(),
  otherMonthlyFees: z.number().min(0).optional(),
  tiAllowance: z.number().min(0).optional(),
  estimatedBuildoutCost: z.number().min(0).optional(),
  existingCondition: z
    .enum(["SHELL", "SECOND_GEN", "TURNKEY", "AS_IS"])
    .optional(),
  discountRate: z.number().min(0).max(100),
  annualRevenue: z.number().positive().optional(),
  employees: z.number().int().positive().optional(),
  expectedRevenueGrowth: z.number().min(-100).max(100).optional(),
  sortOrder: z.number().int().optional(),
});

export type LeaseOptionFormData = z.infer<typeof leaseOptionSchema>;
