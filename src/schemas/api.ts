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

export const calculateRequestSchema = z.object({
  dealId: z.string().min(1, "dealId is required"),
  discountingMode: z
    .object({ frequency: z.enum(["monthly", "annual"]) })
    .optional(),
  includeTIInEffectiveRent: z.boolean().optional(),
});
