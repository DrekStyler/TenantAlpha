import { auth } from "@clerk/nextjs/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { prisma } from "@/lib/prisma";
import type { ComparisonResult } from "@/engine/types";
import {
  CRE_ADVISOR_SYSTEM_PROMPT,
  buildDealContext,
  sanitizeDealContext,
  sanitizeOptions,
} from "@/lib/ai";
import { unauthorized, notFound, forbidden, badRequest, tooManyRequests, err } from "@/lib/api";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { aiChatRequestSchema, MAX_REQUEST_BODY_SIZE } from "@/schemas/api";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const rl = checkRateLimit(`ai:${userId}`, RATE_LIMITS.ai);
  if (!rl.allowed) return tooManyRequests(rl.retryAfterMs);

  // Enforce request body size limit
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BODY_SIZE) {
    return err("Request body too large", 413);
  }

  const body = await req.json();
  const parsed = aiChatRequestSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const { dealId, messages, calculationResults } = parsed.data;

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });

  if (!deal) return notFound("Deal");
  if (deal.userId !== userId) return forbidden();

  const dealContext = sanitizeDealContext(
    buildDealContext(deal.dealName, sanitizeOptions(deal.options), calculationResults as ComparisonResult | undefined)
  );

  // Sanitize user messages to prevent PII injection into prompts
  const sanitizedMessages = messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.role === "user" ? sanitizeDealContext(m.content) : m.content,
  }));

  const systemPrompt = `${CRE_ADVISOR_SYSTEM_PROMPT}

---

${dealContext}`;

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages: sanitizedMessages,
    maxOutputTokens: 1000,
  });

  return result.toTextStreamResponse();
}
