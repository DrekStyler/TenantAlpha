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
  searchLocation: z.string().optional(),
  searchLocationBounds: z.record(z.string(), z.unknown()).optional(),
  targetSF: z.coerce.number().int().positive().optional(),
});

export type DealFormData = z.infer<typeof dealSchema>;

/** Narrower schema for the new-deal setup form (no search fields) */
export const dealSetupSchema = z.object({
  dealName: z.string().min(1, "Deal name is required"),
  clientName: z.string().optional(),
  clientId: z.string().optional(),
  propertyType: z.enum(["OFFICE", "RETAIL", "INDUSTRIAL", "FLEX", "OTHER"]),
  stage: z.enum(DEAL_STAGES).optional(),
});

export type DealSetupFormData = z.infer<typeof dealSetupSchema>;
