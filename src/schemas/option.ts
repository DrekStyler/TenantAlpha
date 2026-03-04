import { z } from "zod";

// React Hook Form with valueAsNumber returns NaN for empty inputs.
// Prisma returns null for unset optional fields.
// .catch(undefined) makes any parsing failure (NaN, null) return undefined,
// which preserves TypeScript inference as `number | undefined`.
export const leaseOptionSchema = z.object({
  optionName: z.string().min(1, "Option name is required"),
  propertyAddress: z.string().optional(),
  propertyType: z
    .enum(["OFFICE", "RETAIL", "INDUSTRIAL", "FLEX", "OTHER"])
    .optional(),
  rentableSF: z.number().positive("Rentable SF must be positive"),
  usableSF: z.number().positive().optional().catch(undefined),
  loadFactor: z.number().min(0).max(100).optional().catch(undefined),
  leaseCommencementDate: z.string().optional(),
  termMonths: z
    .number()
    .int()
    .positive("Lease term must be positive")
    .max(360, "Lease term cannot exceed 30 years"),
  baseRentY1: z.number().positive("Base rent must be positive"),
  escalationType: z.enum(["FIXED_PERCENT", "CPI"]),
  escalationPercent: z.number().min(0).max(50),
  cpiAssumedPercent: z.number().min(0).max(50).optional().catch(undefined),
  freeRentMonths: z.number().int().min(0),
  freeRentType: z.enum(["ABATED", "DEFERRED"]),
  rentStructure: z.enum(["GROSS", "NNN", "MODIFIED_GROSS"]),
  opExPerSF: z.number().min(0).optional().catch(undefined),
  opExEscalation: z.number().min(0).max(50).optional().catch(undefined),
  propertyTax: z.number().min(0).optional().catch(undefined),
  parkingCostMonthly: z.number().min(0).optional().catch(undefined),
  otherMonthlyFees: z.number().min(0).optional().catch(undefined),
  tiAllowance: z.number().min(0).optional().catch(undefined),
  estimatedBuildoutCost: z.number().min(0).optional().catch(undefined),
  existingCondition: z
    .enum(["SHELL", "SECOND_GEN", "TURNKEY", "AS_IS"])
    .optional()
    .catch(undefined),
  discountRate: z.number().min(0).max(100).catch(8.0),
  annualRevenue: z.number().positive().optional().catch(undefined),
  employees: z.number().int().positive().optional().catch(undefined),
  expectedRevenueGrowth: z.number().min(-100).max(100).optional().catch(undefined),
  sortOrder: z.number().int().optional().catch(undefined),
});

export type LeaseOptionFormData = z.infer<typeof leaseOptionSchema>;
