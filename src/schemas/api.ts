import { z } from "zod";

/** Max request body size for AI and PDF endpoints: 512 KB */
export const MAX_REQUEST_BODY_SIZE = 512 * 1024;

// Zod v4: z.record requires (keySchema, valueSchema)
const jsonRecord = z.record(z.string(), z.unknown());
const stringRecord = z.record(z.string(), z.string());

export const aiSummaryRequestSchema = z.object({
  dealId: z.string().min(1, "dealId is required"),
  calculationResults: jsonRecord.optional(),
});

export const aiChatRequestSchema = z.object({
  dealId: z.string().min(1, "dealId is required"),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(5000, "Message too long"),
      })
    )
    .min(1, "At least one message is required")
    .max(50, "Too many messages"),
  calculationResults: jsonRecord.optional(),
});

export const pdfRequestSchema = z.object({
  dealId: z.string().min(1, "dealId is required"),
  calculationResults: jsonRecord,
  aiSummary: z.string().max(10000).optional(),
  chartImages: stringRecord.optional(),
});

export const aiNegotiateRequestSchema = z.object({
  dealId: z.string().min(1, "dealId is required"),
});

/** Schema for the structured AI negotiation analysis response */
export const negotiationAnalysisSchema = z.object({
  recommendedOptionIndex: z
    .number()
    .describe("0-based index of the option most likely to become the best through negotiation"),
  summary: z
    .string()
    .describe("2-3 sentence executive summary of the negotiation opportunity"),
  highlights: z
    .array(
      z.object({
        optionIndex: z.number().describe("0-based index of the option"),
        field: z.string().describe("Field key (e.g. baseRentY1, freeRentMonths)"),
        reason: z
          .string()
          .describe("1 sentence why this field is realistically negotiable"),
      })
    )
    .describe("Cells to highlight as negotiable, ordered by impact. Max 8 items."),
  negotiationTips: z
    .array(z.string())
    .describe("3-5 specific, actionable negotiation tactics"),
});

export type NegotiationAnalysis = z.infer<typeof negotiationAnalysisSchema>;

export const calculateRequestSchema = z.object({
  dealId: z.string().min(1, "dealId is required"),
  discountingMode: z
    .object({ frequency: z.enum(["monthly", "annual"]) })
    .optional(),
  includeTIInEffectiveRent: z.boolean().optional(),
});
