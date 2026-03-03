import { auth } from "@clerk/nextjs/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { prisma } from "@/lib/prisma";
import { CRE_ADVISOR_SYSTEM_PROMPT, buildDealContext } from "@/lib/ai";
import { unauthorized, notFound, forbidden, badRequest } from "@/lib/api";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { dealId, calculationResults } = await req.json();
  if (!dealId) return badRequest("dealId is required");

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

  const userMessage = `Please provide a 3-5 sentence executive summary of this lease analysis, highlighting the key recommendation and top trade-offs.

${dealContext}`;

  let accumulatedText = "";

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: CRE_ADVISOR_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
    maxOutputTokens: 500,
    onFinish: async ({ text }) => {
      accumulatedText = text;
      // Cache the summary
      await prisma.aISummary.upsert({
        where: { dealId },
        update: { summaryText: accumulatedText, generatedAt: new Date() },
        create: { dealId, summaryText: accumulatedText },
      });
    },
  });

  return result.toTextStreamResponse();
}
