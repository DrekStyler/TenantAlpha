import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { sectionOutputSchema } from "@/schemas/memo";
import type { SectionOutput } from "@/schemas/memo";
import type { ComparisonResult } from "@/engine/types";
import type { MemoAudience, MemoTone, MemoSectionId, MemoSectionOutput } from "./types";
import { buildMemoSystemPrompt, buildSectionUserPrompt } from "./prompts";
import { buildDealContext, sanitizeOptions } from "@/lib/ai";

const MODEL = anthropic("claude-sonnet-4-20250514");

interface OptionForMemo {
  optionName: string;
  rentableSF: number;
  termMonths: number;
  baseRentY1: number;
  escalationType: string;
  escalationPercent: number;
  freeRentMonths: number;
  freeRentType: string;
  rentStructure: string;
  opExPerSF?: number | null;
  opExEscalation?: number | null;
  tiAllowance?: number | null;
  estimatedBuildoutCost?: number | null;
  discountRate: number;
  parkingCostMonthly?: number | null;
  annualRevenue?: number | null;
  employees?: number | null;
  [key: string]: unknown;
}

interface LocationSummary {
  optionName: string;
  walkScore?: number | null;
  driveScore?: number | null;
  amenityCount?: number;
}

/**
 * Generate a single memo section using AI.
 */
export async function generateSection(
  sectionId: MemoSectionId,
  systemPrompt: string,
  dealContext: string
): Promise<MemoSectionOutput> {
  const userPrompt = buildSectionUserPrompt(sectionId, dealContext);

  const { object } = await generateObject({
    model: MODEL,
    schema: sectionOutputSchema,
    system: systemPrompt,
    prompt: userPrompt,
    maxOutputTokens: 4096,
  });

  return toMemoSectionOutput(object);
}

/**
 * Generate all requested memo sections.
 */
export async function generateAllSections(
  audience: MemoAudience,
  tone: MemoTone,
  includeSections: MemoSectionId[],
  dealName: string,
  options: OptionForMemo[],
  calculationResults: ComparisonResult,
  locationData?: LocationSummary[]
): Promise<Record<string, MemoSectionOutput>> {
  const systemPrompt = buildMemoSystemPrompt(audience, tone);

  // Build deal context using existing AI helpers (PII-safe)
  const sanitized = sanitizeOptions(options);
  let dealContext = buildDealContext(dealName, sanitized, calculationResults);

  // Append location summary if available
  if (locationData && locationData.length > 0) {
    const locationSection = locationData
      .map(
        (loc) =>
          `### ${loc.optionName}\n` +
          `- Walk Score: ${loc.walkScore ?? "N/A"}\n` +
          `- Drive Score: ${loc.driveScore ?? "N/A"}\n` +
          `- Nearby Amenities: ${loc.amenityCount ?? 0} found`
      )
      .join("\n");
    dealContext += `\n\n## LOCATION DATA\n\n${locationSection}`;
  }

  const sections: Record<string, MemoSectionOutput> = {};

  // Generate sections sequentially to stay within rate limits
  for (const sectionId of includeSections) {
    sections[sectionId] = await generateSection(sectionId, systemPrompt, dealContext);
  }

  return sections;
}

/**
 * Convert Zod-validated output to our internal type.
 */
function toMemoSectionOutput(output: SectionOutput): MemoSectionOutput {
  return {
    sectionTitle: output.sectionTitle,
    bullets: output.bullets,
    tables: output.tables.map((t) => ({
      title: t.title,
      columns: t.columns,
      rows: t.rows,
    })),
    callouts: output.callouts.map((c) => ({
      label: c.label,
      text: c.text,
    })),
    assumptions: output.assumptions,
  };
}
