import type { ComparisonResult } from "@/engine/types";

export const CRE_ADVISOR_SYSTEM_PROMPT = `You are a senior commercial real estate advisor with 20+ years of experience analyzing lease options for corporate tenants. You are reviewing a comparative lease analysis.

GUIDELINES:
- Reference specific numbers from the analysis (rent per SF, NPV, total cost, etc.)
- Use plain English that a C-suite executive can understand
- Highlight risks: high escalation rates, short free rent relative to buildout timeline, NNN exposure to OpEx increases, TI shortfalls, deferred rent obligations
- When recommending an option, always explain the trade-offs clearly
- If asked about market conditions, note that you're analyzing based on the provided data only — do not fabricate market comparables
- Format responses with clear sections and bullet points
- Keep responses concise — prefer bullet points over long paragraphs
- Proactively highlight risks, not just opportunities
- When comparing options, always ground your analysis in the specific calculated metrics
- IMPORTANT: Do not reference any street addresses, client names, or other personally identifying information`;

/**
 * Fields allowed in AI context. Everything else (addresses, client info,
 * internal IDs) is stripped to prevent PII leakage to the AI provider.
 */
const OPTION_ALLOW_LIST: ReadonlySet<string> = new Set([
  "optionName",
  "rentableSF",
  "usableSF",
  "loadFactor",
  "termMonths",
  "baseRentY1",
  "escalationType",
  "escalationPercent",
  "cpiAssumedPercent",
  "freeRentMonths",
  "freeRentType",
  "rentStructure",
  "opExPerSF",
  "opExEscalation",
  "propertyTax",
  "parkingCostMonthly",
  "otherMonthlyFees",
  "tiAllowance",
  "estimatedBuildoutCost",
  "existingCondition",
  "discountRate",
]);

interface OptionForContext {
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
  tiAllowance?: number | null;
  estimatedBuildoutCost?: number | null;
  discountRate: number;
  parkingCostMonthly?: number | null;
  [key: string]: unknown;
}

export function buildDealContext(
  dealName: string,
  options: OptionForContext[],
  calculationResults?: ComparisonResult
): string {
  const optionsSummary = options
    .map(
      (opt) => `
### ${opt.optionName}
- Size: ${opt.rentableSF.toLocaleString()} SF
- Term: ${opt.termMonths} months (${(opt.termMonths / 12).toFixed(1)} years)
- Base Rent Y1: $${opt.baseRentY1.toFixed(2)}/SF/year
- Escalation: ${opt.escalationType === "FIXED_PERCENT" ? `${opt.escalationPercent}% fixed` : `CPI (assumed ${opt.escalationPercent}%)`}
- Free Rent: ${opt.freeRentMonths} months (${opt.freeRentType.toLowerCase()})
- Rent Structure: ${opt.rentStructure}
${opt.opExPerSF ? `- OpEx: $${opt.opExPerSF.toFixed(2)}/SF/year` : ""}
${opt.tiAllowance != null ? `- TI Allowance: $${opt.tiAllowance.toLocaleString()}` : ""}
${opt.estimatedBuildoutCost != null ? `- Est. Buildout: $${opt.estimatedBuildoutCost.toLocaleString()}` : ""}
${opt.parkingCostMonthly ? `- Parking: $${opt.parkingCostMonthly.toLocaleString()}/month` : ""}
- Discount Rate: ${opt.discountRate}%`
    )
    .join("\n");

  let metricsText = "";
  if (calculationResults) {
    metricsText = `

## CALCULATED METRICS

${calculationResults.options
  .map(
    (m) => `### ${m.optionName}
- Total Occupancy Cost: $${m.totalOccupancyCost.toLocaleString()}
- Effective Rent: $${m.effectiveRentPerSF.toFixed(2)}/SF
- Effective Rent (with TI): $${m.effectiveRentPerSFWithTI.toFixed(2)}/SF
- NPV of Costs: $${m.npvOfCosts.toLocaleString()}
- TI Gap (Out-of-Pocket): $${m.tiGap.toLocaleString()}
${m.paybackPeriodMonths != null ? `- Payback Period: ${m.paybackPeriodMonths} months` : ""}
${m.costPerEmployeePerYear != null ? `- Cost/Employee/Year: $${m.costPerEmployeePerYear.toLocaleString()}` : ""}
${m.rentAsPercentOfRevenue != null ? `- Rent as % of Revenue: ${m.rentAsPercentOfRevenue.toFixed(1)}%` : ""}
- Free Rent Savings: $${m.totalFreeRentSavings.toLocaleString()}`
  )
  .join("\n")}

## RANKINGS
- By Effective Rent: ${calculationResults.rankedByEffectiveRent.join(" → ")}
- By NPV: ${calculationResults.rankedByNPV.join(" → ")}
- Best Value: ${calculationResults.bestValueOption}`;
  }

  // Use generic label for the deal — avoid leaking deal/client names
  return `## LEASE ANALYSIS: ${sanitizeLabel(dealName)}

## LEASE OPTIONS
${optionsSummary}
${metricsText}`;
}

/**
 * Strip PII from a freeform label: remove emails, phone numbers, and
 * street address patterns. Preserves generic descriptors like "Downtown Office".
 */
function sanitizeLabel(text: string): string {
  return text
    // emails
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[REDACTED]")
    // phone numbers (US patterns)
    .replace(/(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, "[REDACTED]")
    // Street addresses (123 Main St patterns)
    .replace(/\d{1,5}\s+[A-Z][a-zA-Z]+(\s+[A-Z][a-zA-Z]+)*\s+(St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Ln|Lane|Way|Ct|Court|Pl|Place|Pkwy|Parkway|Cir|Circle)\b\.?/gi, "[REDACTED]");
}

/**
 * Sanitize deal context for sending to AI provider.
 * Strips any residual PII patterns that might remain in the context string.
 */
export function sanitizeDealContext(context: string): string {
  return context
    // emails
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[REDACTED]")
    // phone numbers
    .replace(/(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, "[REDACTED]")
    // Street addresses
    .replace(/\d{1,5}\s+[A-Z][a-zA-Z]+(\s+[A-Z][a-zA-Z]+)*\s+(St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Ln|Lane|Way|Ct|Court|Pl|Place|Pkwy|Parkway|Cir|Circle|Suite|Ste|Unit|Floor|Fl)\b\.?(\s*(#|Suite|Ste|Unit|Floor|Fl)\s*\w+)?/gi, "[REDACTED]");
}

/**
 * Filter option fields to only those in the allow-list.
 * Use this before passing options to buildDealContext.
 */
export function sanitizeOptions<T extends Record<string, unknown>>(
  options: T[]
): OptionForContext[] {
  return options.map((opt) => {
    const filtered: Record<string, unknown> = {};
    for (const key of OPTION_ALLOW_LIST) {
      if (key in opt && opt[key] != null) {
        filtered[key] = opt[key];
      }
    }
    return filtered as unknown as OptionForContext;
  });
}
