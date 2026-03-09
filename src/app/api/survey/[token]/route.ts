import { anthropic } from "@ai-sdk/anthropic";
import { streamText, tool, stepCountIs } from "ai";
import { prisma } from "@/lib/prisma";
import { ok, notFound, badRequest, err, tooManyRequests } from "@/lib/api";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { surveyMessageSchema, extractedDataSchema, type ExtractedDataInput } from "@/schemas/survey";
import {
  SURVEY_AGENT_SYSTEM_PROMPT,
  buildSurveyContext,
} from "@/lib/survey-ai";
import { mapToEngineIndustry } from "@/lib/industry-config";
import type { SurveyMessage, ExtractedSurveyData, SurveyPhase } from "@/types/survey";

function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return new Date() > expiresAt;
}

// GET: Fetch survey session state (public, no auth)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const rl = checkRateLimit(`survey:${token}`, RATE_LIMITS.survey);
  if (!rl.allowed) return tooManyRequests(rl.retryAfterMs);

  const client = await prisma.client.findUnique({
    where: { token },
    select: {
      id: true,
      name: true,
      company: true,
      industry: true,
      surveyMode: true,
      tokenExpiresAt: true,
      questionnaireCompletedAt: true,
      user: { select: { name: true, brokerageName: true } },
      surveySession: {
        select: {
          phase: true,
          messages: true,
          extractedData: true,
        },
      },
    },
  });

  if (!client) return notFound("Survey");
  if (isTokenExpired(client.tokenExpiresAt)) {
    return err("This survey link has expired. Please request a new one from your broker.", 410);
  }

  const session = client.surveySession;

  return ok({
    clientName: client.name,
    company: client.company,
    industry: client.industry,
    surveyMode: client.surveyMode,
    brokerName: client.user?.name,
    brokerageName: client.user?.brokerageName,
    alreadyCompleted: !!client.questionnaireCompletedAt,
    phase: session?.phase ?? "INDUSTRY_DETECTION",
    messages: (session?.messages as unknown as SurveyMessage[]) ?? [],
    extractedData: (session?.extractedData as unknown as ExtractedSurveyData) ?? {},
  });
}

// POST: Send a message to the survey agent (public, no auth)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const rl = checkRateLimit(`survey:${token}`, RATE_LIMITS.survey);
  if (!rl.allowed) return tooManyRequests(rl.retryAfterMs);

  const client = await prisma.client.findUnique({
    where: { token },
    include: {
      surveySession: true,
    },
  });

  if (!client) return notFound("Survey");
  if (isTokenExpired(client.tokenExpiresAt)) {
    return err("This survey link has expired.", 410);
  }
  if (client.questionnaireCompletedAt) {
    return err("This survey has already been completed.", 409);
  }
  if (client.surveyMode !== "AI_AGENT") {
    return badRequest("This client is not configured for AI survey mode.");
  }

  const body = await req.json();
  const parsed = surveyMessageSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const { message } = parsed.data;

  // Get or create session
  let session = client.surveySession;
  if (!session) {
    // If broker already set the industry, pre-populate and skip detection
    const engineIndustry = mapToEngineIndustry(client.industry);
    const initialPhase = engineIndustry ? "INDUSTRY_QUESTIONS" : "INDUSTRY_DETECTION";
    const initialData = engineIndustry ? { industry: engineIndustry } : {};

    session = await prisma.surveySession.create({
      data: {
        clientId: client.id,
        token: client.token,
        phase: initialPhase,
        messages: [],
        extractedData: initialData,
      },
    });
  }

  const existingMessages = (session.messages as unknown as SurveyMessage[]) ?? [];
  const extractedData = (session.extractedData as unknown as ExtractedSurveyData) ?? {};
  const phase = session.phase as SurveyPhase;

  // Enforce max conversation length
  if (existingMessages.length >= 40) {
    return err("Survey conversation limit reached. Please review and submit your data.", 400);
  }

  // Add user message
  const userMsg: SurveyMessage = {
    role: "user",
    content: message,
    timestamp: new Date().toISOString(),
  };

  const updatedMessages = [...existingMessages, userMsg];

  // Build context for Claude
  const surveyContext = buildSurveyContext(phase, extractedData, client.name, client.industry);

  const systemPrompt = `${SURVEY_AGENT_SYSTEM_PROMPT}

---

${surveyContext}`;

  // Build message history for Claude
  const aiMessages = updatedMessages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Stream response from Claude Opus
  const result = streamText({
    model: anthropic("claude-opus-4-20250514"),
    system: systemPrompt,
    messages: aiMessages,
    maxOutputTokens: 1000,
    stopWhen: stepCountIs(3),
    tools: {
      extract_data: tool({
        description:
          "Extract structured data from the user's response. Call this after every user message to report any new data points you identified.",
        inputSchema: extractedDataSchema,
        execute: async (extractedFields: ExtractedDataInput) => {
          // Merge extracted fields into session data
          const merged = { ...extractedData };

          if (extractedFields.industry) merged.industry = extractedFields.industry;
          if (extractedFields.companyName) merged.companyName = extractedFields.companyName;
          if (extractedFields.headcount) merged.headcount = extractedFields.headcount;
          if (extractedFields.projectedHeadcount12mo) merged.projectedHeadcount12mo = extractedFields.projectedHeadcount12mo;
          if (extractedFields.annualRevenue) merged.annualRevenue = extractedFields.annualRevenue;
          if (extractedFields.revenuePerEmployee) merged.revenuePerEmployee = extractedFields.revenuePerEmployee;
          if (extractedFields.projectedRevenueGrowth) merged.projectedRevenueGrowth = extractedFields.projectedRevenueGrowth;
          if (extractedFields.sfPerEmployee) merged.sfPerEmployee = extractedFields.sfPerEmployee;
          if (extractedFields.budgetConstraint) merged.budgetConstraint = extractedFields.budgetConstraint;
          if (extractedFields.primaryGoal) merged.primaryGoal = extractedFields.primaryGoal;
          if (extractedFields.criticalAmenities) merged.criticalAmenities = extractedFields.criticalAmenities;
          if (extractedFields.expansionTimeline) merged.expansionTimeline = extractedFields.expansionTimeline;
          if (extractedFields.currentEmployeeTurnover) merged.currentEmployeeTurnover = extractedFields.currentEmployeeTurnover;
          if (extractedFields.avgEmployeeSalary) merged.avgEmployeeSalary = extractedFields.avgEmployeeSalary;

          // Industry inputs (merge deeply)
          if (extractedFields.industryInputs) {
            merged.industryInputs = {
              ...(merged.industryInputs ?? {}),
              ...extractedFields.industryInputs,
            };
          }

          // Lease preferences (merge deeply)
          if (extractedFields.leasePreferences) {
            merged.leasePreferences = {
              ...(merged.leasePreferences ?? {}),
              ...extractedFields.leasePreferences,
            };
          }

          // Current lease (merge deeply)
          if (extractedFields.currentLease) {
            merged.currentLease = {
              ...(merged.currentLease ?? {}),
              ...extractedFields.currentLease,
            };
          }

          // Phase transition
          const newPhase = extractedFields.phase ?? phase;

          // Persist the merged data
          await prisma.surveySession.update({
            where: { id: session!.id },
            data: {
              extractedData: JSON.parse(JSON.stringify(merged)),
              phase: newPhase,
            },
          });

          return { success: true, phase: newPhase };
        },
      }),
    },
    onFinish: async ({ text }) => {
      // Don't save empty assistant messages (can happen if tool call dominated)
      if (!text.trim()) return;

      const assistantMsg: SurveyMessage = {
        role: "assistant",
        content: text,
        timestamp: new Date().toISOString(),
      };

      await prisma.surveySession.update({
        where: { id: session!.id },
        data: {
          messages: JSON.parse(JSON.stringify([...updatedMessages, assistantMsg])),
        },
      });
    },
  });

  return result.toTextStreamResponse();
}
