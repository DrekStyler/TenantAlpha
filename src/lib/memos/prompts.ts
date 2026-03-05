import type { MemoAudience, MemoTone, MemoSectionId } from "./types";

// ─── Audience-Specific Guidelines ───────────────────────────────

const AUDIENCE_GUIDELINES: Record<MemoAudience, string> = {
  CEO: `The reader is a CEO focused on strategic impact. Emphasize:
- Business alignment and strategic fit
- High-level trade-offs between options
- Risk to operations and brand
- Total cost of occupancy relative to business goals
- Keep financial detail accessible — lead with conclusions, support with numbers`,

  CFO: `The reader is a CFO focused on financial precision. Emphasize:
- NPV comparison and discount rate sensitivity
- Capital preservation (TI gap, buildout exposure)
- Effective rent per SF (with and without TI)
- Cost per employee and rent as % of revenue where available
- Escalation exposure over the term
- Cash flow timing and cumulative cost trajectory`,

  COO: `The reader is a COO focused on operational considerations. Emphasize:
- Timeline and lease commencement logistics
- Buildout complexity and existing condition
- Parking and accessibility for employees
- Location factors — walkability, transit, amenity density
- Operational risk (NNN exposure to OpEx variability)`,

  IC: `The reader is an Investment Committee requiring comprehensive analysis. Provide:
- Full financial comparison with all available metrics
- Risk matrix with probability/impact framing
- Clear recommendation with dissenting considerations
- All assumptions explicitly stated
- Sensitivity to key variables (discount rate, escalation)`,
};

// ─── Tone-Specific Guidelines ───────────────────────────────────

const TONE_GUIDELINES: Record<MemoTone, string> = {
  BANK_STYLE: `Write in a formal, institutional tone:
- Use structured paragraphs with topic sentences
- Professional and measured language — no colloquialisms
- Present analysis objectively before stating recommendations
- Use "the analysis indicates" rather than "we think"
- Suitable for external distribution to lenders or institutional investors`,

  CONCISE: `Write in a concise, data-forward style:
- Lead with bullet points, not paragraphs
- Every sentence should convey a distinct data point or insight
- Minimize transitional language and filler
- Use short, declarative sentences
- Tables and callouts are preferred over narrative`,

  NARRATIVE: `Write in a flowing narrative style:
- Use complete paragraphs with logical flow between ideas
- Provide context and reasoning behind each observation
- Connect financial metrics to business implications
- Use clear, accessible language suitable for non-specialists
- Balance data with qualitative commentary`,
};

// ─── System Prompt Builder ──────────────────────────────────────

export function buildMemoSystemPrompt(
  audience: MemoAudience,
  tone: MemoTone
): string {
  return `You are a senior commercial real estate advisor with 20+ years of experience preparing institutional-quality lease analysis memos. You are writing a section of a formal CRE briefing memo.

CRITICAL RULES:
- Use ONLY the metrics and data provided in the deal context. Do NOT invent, estimate, or hallucinate any numbers.
- Every numeric claim must trace to the provided calculated metrics or user-input lease terms.
- If a metric is not provided, do not reference it. Say "data not available" if the section requires it.
- Do NOT reference street addresses, client names, or other personally identifying information.
- Format currency as $X,XXX or $XX.XX/SF as appropriate.
- Format percentages with one decimal place (e.g., 3.0%).

AUDIENCE:
${AUDIENCE_GUIDELINES[audience]}

TONE:
${TONE_GUIDELINES[tone]}

OUTPUT FORMAT:
You must return a structured JSON object with these fields:
- sectionTitle: The heading for this memo section
- bullets: Array of key points (complete sentences)
- tables: Array of data tables (each with title, columns[], rows[][])
- callouts: Array of highlighted boxes (each with label and text)
- assumptions: Array of assumptions/caveats as footnote strings

For tables: include right-aligned currency/numeric values as formatted strings. Use the comparison data provided.
For callouts: use sparingly (1-2 per section) for genuinely important takeaways.
For assumptions: list any assumptions embedded in your analysis.`;
}

// ─── Section-Specific Prompts ───────────────────────────────────

export const SECTION_PROMPTS: Record<MemoSectionId, string> = {
  EXECUTIVE_SUMMARY: `Write the Executive Summary section of this CRE lease analysis memo.

This section should:
1. Open with a clear, 1-sentence recommendation identifying the best-value option
2. Provide 2-3 paragraphs (as bullets) covering:
   - The scope of analysis (number of options, term range, property type)
   - Key differentiators between options (NPV, effective rent, TI coverage)
   - Primary risks or considerations
3. Include a callout box with the recommendation and the NPV savings vs. the next-best option
4. If rankings by NPV and effective rent differ, note this as a consideration

DEAL CONTEXT:
{dealContext}`,

  FINANCIAL_COMPARISON: `Write the Financial Comparison section of this CRE lease analysis memo.

This section should:
1. Create a comparison table with ALL options side by side, including:
   - Total Occupancy Cost
   - NPV of Costs
   - Effective Rent/SF
   - Effective Rent/SF (with TI)
   - Free Rent Savings
   - TI Gap (out-of-pocket)
   - Cost/Employee/Year (if available)
   - Rent as % of Revenue (if available)
2. Highlight the best-value option in your analysis
3. Add bullets explaining key cost drivers and differentials
4. Include a callout with the most impactful financial insight
5. Note the discount rate used for NPV calculations in assumptions

DEAL CONTEXT:
{dealContext}`,

  COMMUTE_TALENT: `Write the Location & Talent section of this CRE lease analysis memo.

This section should:
1. Compare walkability and drive scores across options (if available)
2. Summarize amenity density differences (restaurants, transit, gyms, etc.)
3. Assess impact on employee experience and talent retention
4. If location data is not available, note this and focus on qualitative assessment of rent structures and their implications for location quality
5. Keep analysis grounded in provided data — do not invent location details

DEAL CONTEXT:
{dealContext}`,

  RISK_ASSUMPTIONS: `Write the Risk & Assumptions section of this CRE lease analysis memo.

This section should:
1. Identify the top 3-5 risks across all options, each as a callout with:
   - A short label (e.g., "Escalation Exposure", "TI Shortfall", "NNN Variability")
   - A 1-2 sentence explanation with specific numbers from the analysis
2. Include bullets covering:
   - Sensitivity to discount rate changes
   - Escalation type differences (fixed vs. CPI) and their implications
   - Capital at risk (TI gap, buildout exposure)
   - Free rent structure (abated vs. deferred) implications
3. List ALL calculation assumptions in the assumptions array:
   - Discount rate used
   - Escalation assumptions
   - Any default values applied

DEAL CONTEXT:
{dealContext}`,

  RECOMMENDATION: `Write the Recommendation section of this CRE lease analysis memo.

This section should:
1. State the recommended option clearly in the first bullet
2. Provide 3-4 supporting rationale bullets grounded in calculated metrics
3. Acknowledge trade-offs — what the recommended option gives up vs. alternatives
4. Include a "Next Steps" callout with 2-3 actionable items (e.g., "Negotiate TI increase", "Request escalation cap", "Confirm operating expense base year")
5. If the best-value determination is close between options, note the margin and what could change it

DEAL CONTEXT:
{dealContext}`,
};

/**
 * Build the full user prompt for a specific section.
 */
export function buildSectionUserPrompt(
  sectionId: MemoSectionId,
  dealContext: string
): string {
  return SECTION_PROMPTS[sectionId].replace("{dealContext}", dealContext);
}
