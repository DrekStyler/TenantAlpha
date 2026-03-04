import { auth } from "@clerk/nextjs/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { prisma } from "@/lib/prisma";
import { calculateDealComparison } from "@/engine";
import type { CalculationConfig } from "@/engine/types";
import { prismaOptionToLeaseInput } from "@/lib/mappers";
import { computeTippingPoints } from "@/lib/tipping-points";
import {
  buildDealContext,
  sanitizeDealContext,
  sanitizeOptions,
} from "@/lib/ai";
import { unauthorized, notFound, forbidden, badRequest, tooManyRequests, err } from "@/lib/api";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { aiNegotiateRequestSchema, negotiationAnalysisSchema } from "@/schemas/api";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const rl = checkRateLimit(`ai:${userId}`, RATE_LIMITS.ai);
  if (!rl.allowed) return tooManyRequests(rl.retryAfterMs);

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > 512 * 1024) {
    return err("Request body too large", 413);
  }

  const body = await req.json();
  const parsed = aiNegotiateRequestSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const { dealId } = parsed.data;

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });

  if (!deal) return notFound("Deal");
  if (deal.userId !== userId) return forbidden();
  if (deal.options.length < 2)
    return badRequest("At least 2 lease options are required");

  // Run calculations server-side
  const inputs = deal.options.map(prismaOptionToLeaseInput);
  const config: CalculationConfig = {
    discountingMode: { frequency: "monthly" },
    includeTIInEffectiveRent: false,
  };
  const results = calculateDealComparison(inputs, config);

  // Compute tipping points
  const tippingPoints = computeTippingPoints(inputs, config, results);

  // Build deal context for AI (sanitized)
  const dealContext = sanitizeDealContext(
    buildDealContext(
      deal.dealName,
      sanitizeOptions(deal.options),
      results
    )
  );

  // Build tipping points context
  const tippingPointsText = tippingPoints.length > 0
    ? tippingPoints
        .map(
          (tp) =>
            `- ${tp.optionName} [index ${tp.optionIndex}]: ${tp.field} can change from ${tp.currentValue} to ${tp.targetValue} (${tp.changePercent > 0 ? "+" : ""}${tp.changePercent}%) to beat the best option`
        )
        .join("\n")
    : "No achievable tipping points found — the best option dominates.";

  const systemPrompt = `You are a senior commercial real estate broker advisor analysing a lease negotiation.

Your task: Given a comparative lease analysis and computed "tipping points" (the exact field values that would make a non-best option become the best by NPV), identify which fields are REALISTICALLY negotiable based on CRE market norms and recommend a negotiation strategy.

RULES:
- Only highlight fields where the required change is achievable in a real negotiation
- Base rent reductions of 5-15% are common; >25% is unrealistic
- Free rent of 1-6 months is common for multi-year leases; >12 months is rare
- Escalation reduction of 0.5-1% is common; dropping below 2% is unusual
- OpEx reduction is difficult — landlords rarely negotiate this significantly
- Parking cost reduction of 10-30% is sometimes achievable
- Prioritise fields with the smallest percentage change needed
- Reference specific dollar amounts and percentages from the data
- Do NOT mention addresses, client names, or personally identifying information
- Keep reasons concise — one sentence each
- Limit highlights to the 4-8 most impactful and achievable changes`;

  const userMessage = `${dealContext}

## TIPPING POINTS (computed)
${tippingPointsText}

Analyse which option has the best chance of becoming the most cost-effective through realistic negotiation. Identify the specific fields (cells) that a broker should focus on negotiating, and provide actionable tips.`;

  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    prompt: userMessage,
    schema: negotiationAnalysisSchema,
    maxOutputTokens: 1000,
  });

  // Return the analysis along with the computed tipping points
  return Response.json({
    analysis: object,
    tippingPoints: tippingPoints.map((tp) => ({
      optionIndex: tp.optionIndex,
      optionName: tp.optionName,
      field: tp.field,
      currentValue: tp.currentValue,
      targetValue: tp.targetValue,
      changePercent: tp.changePercent,
      direction: tp.direction,
    })),
  });
}
