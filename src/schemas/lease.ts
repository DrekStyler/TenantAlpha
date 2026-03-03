import { z } from "zod";

export const savedLeaseSchema = z.object({
  leaseName: z.string().min(1, "Lease name is required"),
  tenantName: z.string().optional(),
  propertyAddress: z.string().optional(),
  propertyType: z
    .enum(["OFFICE", "RETAIL", "INDUSTRIAL", "FLEX", "OTHER"])
    .optional(),
  rentableSF: z.number().positive("Rentable SF must be positive"),
  termMonths: z.number().int().positive(),
  baseRentY1: z.number().positive(),
  escalationType: z.enum(["FIXED_PERCENT", "CPI"]),
  escalationPercent: z.number().min(0).max(50),
  rentStructure: z.enum(["GROSS", "NNN", "MODIFIED_GROSS"]),
  tiAllowance: z.number().min(0).optional(),
  signedDate: z.string().optional(),
  notes: z.string().optional(),
});

export type SavedLeaseFormData = z.infer<typeof savedLeaseSchema>;
