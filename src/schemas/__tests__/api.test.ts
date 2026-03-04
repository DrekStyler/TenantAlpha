import { describe, it, expect } from "vitest";
import {
  aiSummaryRequestSchema,
  aiChatRequestSchema,
  pdfRequestSchema,
  aiNegotiateRequestSchema,
  calculateRequestSchema,
} from "../api";

describe("aiSummaryRequestSchema", () => {
  it("accepts valid request with dealId only", () => {
    const result = aiSummaryRequestSchema.safeParse({ dealId: "deal-123" });
    expect(result.success).toBe(true);
  });

  it("accepts request with calculationResults", () => {
    const result = aiSummaryRequestSchema.safeParse({
      dealId: "deal-123",
      calculationResults: { key: "value" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing dealId", () => {
    const result = aiSummaryRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty dealId", () => {
    const result = aiSummaryRequestSchema.safeParse({ dealId: "" });
    expect(result.success).toBe(false);
  });
});

describe("aiChatRequestSchema", () => {
  it("accepts valid chat request", () => {
    const result = aiChatRequestSchema.safeParse({
      dealId: "deal-123",
      messages: [{ role: "user", content: "What is the best option?" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts multiple messages", () => {
    const result = aiChatRequestSchema.safeParse({
      dealId: "deal-123",
      messages: [
        { role: "user", content: "Compare options" },
        { role: "assistant", content: "Option A is best..." },
        { role: "user", content: "Why?" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty messages array", () => {
    const result = aiChatRequestSchema.safeParse({
      dealId: "deal-123",
      messages: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects too many messages (>50)", () => {
    const messages = Array.from({ length: 51 }, (_, i) => ({
      role: "user" as const,
      content: `Message ${i}`,
    }));
    const result = aiChatRequestSchema.safeParse({
      dealId: "deal-123",
      messages,
    });
    expect(result.success).toBe(false);
  });

  it("rejects message with invalid role", () => {
    const result = aiChatRequestSchema.safeParse({
      dealId: "deal-123",
      messages: [{ role: "system", content: "Hello" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects message exceeding 5000 characters", () => {
    const result = aiChatRequestSchema.safeParse({
      dealId: "deal-123",
      messages: [{ role: "user", content: "x".repeat(5001) }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts message at exactly 5000 characters", () => {
    const result = aiChatRequestSchema.safeParse({
      dealId: "deal-123",
      messages: [{ role: "user", content: "x".repeat(5000) }],
    });
    expect(result.success).toBe(true);
  });
});

describe("pdfRequestSchema", () => {
  it("accepts valid PDF request", () => {
    const result = pdfRequestSchema.safeParse({
      dealId: "deal-123",
      calculationResults: { options: [] },
    });
    expect(result.success).toBe(true);
  });

  it("accepts PDF request with optional fields", () => {
    const result = pdfRequestSchema.safeParse({
      dealId: "deal-123",
      calculationResults: { options: [] },
      aiSummary: "This is a summary",
      chartImages: { npv: "base64data..." },
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing calculationResults", () => {
    const result = pdfRequestSchema.safeParse({
      dealId: "deal-123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects aiSummary exceeding 10000 chars", () => {
    const result = pdfRequestSchema.safeParse({
      dealId: "deal-123",
      calculationResults: {},
      aiSummary: "x".repeat(10001),
    });
    expect(result.success).toBe(false);
  });
});

describe("aiNegotiateRequestSchema", () => {
  it("accepts valid request", () => {
    const result = aiNegotiateRequestSchema.safeParse({ dealId: "deal-123" });
    expect(result.success).toBe(true);
  });

  it("rejects empty dealId", () => {
    const result = aiNegotiateRequestSchema.safeParse({ dealId: "" });
    expect(result.success).toBe(false);
  });
});

describe("calculateRequestSchema", () => {
  it("accepts minimal request", () => {
    const result = calculateRequestSchema.safeParse({ dealId: "deal-123" });
    expect(result.success).toBe(true);
  });

  it("accepts request with discounting mode", () => {
    const result = calculateRequestSchema.safeParse({
      dealId: "deal-123",
      discountingMode: { frequency: "monthly" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts request with annual discounting", () => {
    const result = calculateRequestSchema.safeParse({
      dealId: "deal-123",
      discountingMode: { frequency: "annual" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid discounting frequency", () => {
    const result = calculateRequestSchema.safeParse({
      dealId: "deal-123",
      discountingMode: { frequency: "quarterly" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts request with includeTIInEffectiveRent", () => {
    const result = calculateRequestSchema.safeParse({
      dealId: "deal-123",
      includeTIInEffectiveRent: true,
    });
    expect(result.success).toBe(true);
  });
});
