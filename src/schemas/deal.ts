import { z } from "zod";

export const DEAL_STAGES = [
  "PROSPECTING",
  "REQUIREMENTS",
  "TOUR",
  "LOI",
  "NEGOTIATION",
  "UNDER_REVIEW",
  "EXECUTED",
  "DEAD",
] as const;

export type DealStage = (typeof DEAL_STAGES)[number];

export const dealSchema = z.object({
  dealName: z.string().min(1, "Deal name is required"),
  clientName: z.string().optional(),
  clientId: z.string().optional(),
  propertyType: z.enum(["OFFICE", "RETAIL", "INDUSTRIAL", "FLEX", "OTHER"]),
  stage: z.enum(DEAL_STAGES).optional(),
});

export type DealFormData = z.infer<typeof dealSchema>;
