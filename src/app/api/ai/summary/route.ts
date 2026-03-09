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
import { aiSummaryRequestSchema, MAX_REQUEST_BODY_SIZE } from "@/schemas/api";

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
  const parsed = aiSummaryRequestSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const { dealId, calculationResults } = parsed.data;

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      options: { orderBy: { sortOrder: "asc" } },
      aiSummary: true,
    },
  });

  if (!deal) return notFound("Deal");
  if (deal.userId !== userId) return forbidden();

  // Return cached summary if options haven't changed since it was generated
  if (deal.aiSummary?.summaryText) {
    const summaryTime = deal.aiSummary.generatedAt.getTime();
    const dealChanged = deal.updatedAt.getTime() > summaryTime;
    const optionsChanged = deal.options.some(
      (o) => o.updatedAt.getTime() > summaryTime
    );

    if (!dealChanged && !optionsChanged) {
      return new Response(deal.aiSummary.summaryText, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  }

  const dealContext = sanitizeDealContext(
    buildDealContext(deal.dealName, sanitizeOptions(deal.options), calculationResults as ComparisonResult | undefined)
  );

  const userMessage = `Please provide a 3-5 sentence executive summary of this lease analysis, highlighting the key recommendation and top trade-offs.

${dealContext}`;

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: CRE_ADVISOR_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
    maxOutputTokens: 500,
    onFinish: async ({ text }) => {
      // Cache the summary
      await prisma.aISummary.upsert({
        where: { dealId },
        update: { summaryText: text, generatedAt: new Date() },
        create: { dealId, summaryText: text },
      });
    },
  });

  return result.toTextStreamResponse();
}
