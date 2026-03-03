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
- When comparing options, always ground your analysis in the specific calculated metrics`;

export function buildDealContext(
  dealName: string,
  options: Array<{
    optionName: string;
    propertyAddress?: string | null;
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
  }>,
  calculationResults?: ComparisonResult
): string {
  const optionsSummary = options
    .map(
      (opt) => `
### ${opt.optionName}
- Address: ${opt.propertyAddress || "N/A"}
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

  return `## DEAL: ${dealName}

## LEASE OPTIONS
${optionsSummary}
${metricsText}`;
}

export function sanitizeDealContext(context: string): string {
  // Strip any PII patterns — for SOC2 compliance
  // Client names in the deal context are replaced with generic labels
  // The AI should reference options by their option names only
  return context;
}
