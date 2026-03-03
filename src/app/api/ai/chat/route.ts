import { auth } from "@clerk/nextjs/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { prisma } from "@/lib/prisma";
import { CRE_ADVISOR_SYSTEM_PROMPT, buildDealContext } from "@/lib/ai";
import { unauthorized, notFound, forbidden, badRequest } from "@/lib/api";

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return unauthorized();

  const { dealId, messages, calculationResults } = await req.json();
  if (!dealId) return badRequest("dealId is required");
  if (!messages || !Array.isArray(messages))
    return badRequest("messages array is required");

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });

  if (!deal) return notFound("Deal");
  if (deal.userId !== userId) return forbidden();

  const dealContext = buildDealContext(
    deal.dealName,
    deal.options,
    calculationResults
  );

  const systemPrompt = `${CRE_ADVISOR_SYSTEM_PROMPT}

---

${dealContext}`;

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages,
    maxOutputTokens: 1000,
  });

  return result.toTextStreamResponse();
}
