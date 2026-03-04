import { z } from "zod";

export const dealSchema = z.object({
  dealName: z.string().min(1, "Deal name is required"),
  clientName: z.string().optional(),
  clientId: z.string().optional(),
  propertyType: z.enum(["OFFICE", "RETAIL", "INDUSTRIAL", "FLEX", "OTHER"]),
});

export type DealFormData = z.infer<typeof dealSchema>;
