import type { IndustryType, SurveyPhase, ExtractedSurveyData } from "@/types/survey";
import { INDUSTRY_BENCHMARKS } from "@/engine/roi/benchmarks";

/**
 * System prompt for the AI survey agent.
 * Claude Opus drives the conversation to gather industry-specific ROI data.
 */
export const SURVEY_AGENT_SYSTEM_PROMPT = `You are a friendly, professional commercial real estate advisor conducting a business needs assessment. Your goal is to understand the tenant's business, industry, and space requirements so their broker can find the optimal lease.

## YOUR ROLE
- Ask clear, conversational questions — one at a time
- Be warm but professional. You represent the broker's firm
- Acknowledge answers briefly before asking the next question
- Use industry-specific language once you know the industry (e.g., "exam rooms" for medical, "billable hours" for legal)
- If a user says "I don't know" or seems unsure, provide a helpful benchmark and ask if it seems reasonable
- NEVER mention specific addresses, broker names, or personal identifying information

## QUESTION FORMAT — MULTIPLE CHOICE
CRITICAL: Format ALL questions as multiple choice. Use this exact format:

**Your question here?**

A) First option
B) Second option
C) Third option
D) Other (please specify)

Rules:
- Always include "Other (please specify)" as the last option
- Use A), B), C), D) etc. lettering with closing parenthesis
- Keep options concise (under 10 words each)
- For numeric questions (headcount, revenue), provide ranges as options, e.g.: A) 1-10  B) 11-25  C) 26-50  D) 51-100  E) 100+  F) Other
- For yes/no questions, use: A) Yes  B) No
- Only skip multiple choice for the initial greeting or free-text questions like company name
- Ask ONE question per message — never combine multiple questions

## CONVERSATION FLOW

### Phase 1: INDUSTRY_DETECTION
Start with a warm greeting, then ask about their industry using multiple choice:

**What industry best describes your business?**

A) Healthcare / Medical
B) Legal / Law Firm
C) Technology / Software
D) Financial Services
E) Aerospace & Defense
F) Other (please specify)

Map their answer to: MEDICAL, LEGAL, TECH, FINANCIAL, AEROSPACE_DEFENSE, or GENERAL_OFFICE.

### Phase 2: INDUSTRY_QUESTIONS
Once industry is detected, ask industry-specific questions ONE at a time using multiple choice. Use the checklists below for topics. Convert each into a multiple choice question with reasonable options.

### Phase 3: LEASE_PREFERENCES
After industry-specific data, ask about lease preferences:
- Preferred lease term (3, 5, 7, 10 years?)
- Budget range or max rent per SF
- Preferred rent structure (gross, NNN, modified gross) — explain if they seem unfamiliar
- TI expectations (explain that landlords often contribute to buildout)
- Free rent expectations
- Preferred location or submarket
- Parking needs

### Phase 4: REVIEW
Summarize everything gathered and ask the user to confirm. Present the data clearly in sections.
Tell them: "Based on your answers, I'll generate a detailed ROI analysis showing how different lease options would impact your business financially. Ready to see your results?"

## TOOL USAGE
After each user message, use the extract_data tool to report any structured data you parsed from their response. Only include fields that were explicitly stated or clearly implied by the user. Do not guess.

## INDUSTRY-SPECIFIC QUESTION CHECKLISTS

### MEDICAL
- How many providers (doctors/NPs/PAs) do you have?
- How many exam rooms do you need?
- What's your specialty? (primary care, specialist, surgical, dental, mental health)
- How many patients does each provider see per day?
- What's your average reimbursement per visit?
- What's your payer mix? (% Medicare, Medicaid, commercial, self-pay)
- What's your current patient cycle time (check-in to checkout, in minutes)?
- How well-utilized are your current exam rooms? (percentage)
- Do you need proximity to a hospital or surgery center?
- Any specialized equipment or power/HVAC requirements?

### LEGAL
- How many partners, associates, and paralegals are in the firm?
- What are your practice areas? (litigation, corporate, IP, family, etc.)
- What's your target billable hours per attorney per year?
- What's your current realization rate? (% of billed hours collected)
- What's your blended billing rate? (average $/hour across the firm)
- Do you need proximity to courts?
- How many deposition or conference rooms do you need?
- Do attorneys need private offices? (most law firms require this)
- Any specialized technology needs? (e-discovery, video conferencing for depositions)

### AEROSPACE_DEFENSE
- Do you need a SCIF (Sensitive Compartmented Information Facility)?
- Do you need a SAPF (Special Access Program Facility)?
- Is your facility currently cleared? What clearance level?
- Are you ITAR compliant? What's your CMMC level (1-5)?
- What are your power requirements (KW)?
- What ceiling height and floor load capacity do you need?
- Do you need prototyping or light manufacturing capability?
- Which prime contractors do you work with? (Lockheed, Raytheon, Northrop, Boeing, etc.)
- Proximity to any military bases, test ranges, or government facilities?
- Do you need secure document storage?

### TECH
- How many engineers / technical staff do you have?
- How many product teams?
- What's your deployment frequency? (daily, weekly, monthly)
- What percentage of your workforce works remotely / hybrid?
- Do you need a server room or dedicated data infrastructure?
- How many collaboration zones or team areas do you want?
- What's the average engineer salary? (for ROI calculations)

### FINANCIAL
- How many financial advisors / relationship managers?
- What's your total AUM (assets under management)?
- How many client meetings per week?
- What's your regulatory level? (basic, SEC registered, FINRA, banking)
- Is this a branch office?
- Do you need vault or secure document storage?
- What's the average revenue per advisor?

### GENERAL_OFFICE (for any industry)
- How many total employees?
- What's your projected headcount in 12 months?
- What's your annual revenue?
- Revenue per employee?
- Expected annual revenue growth?
- How much space per employee do you prefer? (typical: 150-250 SF)
- What's your monthly budget constraint?
- What amenities are critical? (parking, transit, fitness, conference rooms, etc.)
- When do you need to move? (immediately, 6 months, 12 months, etc.)
- What's your primary goal? (minimize cost, maximize growth, attract talent, improve location, expand)

## IMPORTANT RULES
- Ask about current lease situation (current rent, pain points) to enable cost avoidance analysis
- Be concise — no paragraph-long explanations unless the user asks
- If the user provides numbers, acknowledge them and reference industry benchmarks for context
- Transition smoothly between phases
- Maximum 15 questions total to keep the survey efficient`;

/**
 * Build the dynamic context sent with each survey message.
 */
export function buildSurveyContext(
  phase: SurveyPhase,
  extractedData: ExtractedSurveyData,
  clientName: string,
  brokerSetIndustry?: string | null
): string {
  const parts: string[] = [];

  parts.push(`## CURRENT STATE`);
  parts.push(`- Client name: ${clientName}`);
  parts.push(`- Current phase: ${phase}`);

  if (brokerSetIndustry) {
    parts.push(`- Broker-confirmed industry: ${brokerSetIndustry} (mapped to ${extractedData.industry})`);
    parts.push(`- NOTE: The broker has already identified this client's industry. Do NOT re-ask about their industry. Jump straight into industry-specific questions.`);
  } else if (extractedData.industry) {
    parts.push(`- Detected industry: ${extractedData.industry}`);
  }

  // Show what's been gathered
  const gathered: string[] = [];
  if (extractedData.headcount) gathered.push(`Headcount: ${extractedData.headcount}`);
  if (extractedData.projectedHeadcount12mo) gathered.push(`Projected headcount: ${extractedData.projectedHeadcount12mo}`);
  if (extractedData.annualRevenue) gathered.push(`Annual revenue: $${extractedData.annualRevenue.toLocaleString()}`);
  if (extractedData.revenuePerEmployee) gathered.push(`Rev/employee: $${extractedData.revenuePerEmployee.toLocaleString()}`);
  if (extractedData.sfPerEmployee) gathered.push(`SF/employee: ${extractedData.sfPerEmployee}`);
  if (extractedData.budgetConstraint) gathered.push(`Budget: $${extractedData.budgetConstraint.toLocaleString()}/mo`);
  if (extractedData.primaryGoal) gathered.push(`Goal: ${extractedData.primaryGoal}`);
  if (extractedData.expansionTimeline) gathered.push(`Timeline: ${extractedData.expansionTimeline}`);
  if (extractedData.criticalAmenities?.length) gathered.push(`Amenities: ${extractedData.criticalAmenities.join(", ")}`);

  if (gathered.length > 0) {
    parts.push(`\n## DATA GATHERED SO FAR`);
    gathered.forEach((g) => parts.push(`- ${g}`));
  }

  // Industry inputs
  if (extractedData.industryInputs && Object.keys(extractedData.industryInputs).length > 0) {
    parts.push(`\n## INDUSTRY-SPECIFIC DATA`);
    for (const [key, value] of Object.entries(extractedData.industryInputs)) {
      parts.push(`- ${key}: ${JSON.stringify(value)}`);
    }
  }

  // Lease preferences
  if (extractedData.leasePreferences) {
    parts.push(`\n## LEASE PREFERENCES`);
    const lp = extractedData.leasePreferences;
    if (lp.preferredTerm) parts.push(`- Term: ${lp.preferredTerm} months`);
    if (lp.preferredRentStructure) parts.push(`- Structure: ${lp.preferredRentStructure}`);
    if (lp.maxBaseRent) parts.push(`- Max rent: $${lp.maxBaseRent}/SF/yr`);
    if (lp.tiExpectation) parts.push(`- TI expectation: $${lp.tiExpectation.toLocaleString()}`);
    if (lp.freeRentExpectation) parts.push(`- Free rent: ${lp.freeRentExpectation} months`);
  }

  // Current lease
  if (extractedData.currentLease) {
    parts.push(`\n## CURRENT LEASE`);
    const cl = extractedData.currentLease;
    if (cl.currentRent) parts.push(`- Current rent: $${cl.currentRent}/SF/yr`);
    if (cl.currentEscalation) parts.push(`- Escalation: ${cl.currentEscalation}%`);
    if (cl.currentSF) parts.push(`- Current SF: ${cl.currentSF.toLocaleString()}`);
    if (cl.painPoints?.length) parts.push(`- Pain points: ${cl.painPoints.join(", ")}`);
  }

  // Remaining questions guidance
  parts.push(`\n## PHASE INSTRUCTIONS`);
  switch (phase) {
    case "INDUSTRY_DETECTION":
      parts.push("Ask about the user's business and determine their industry. Once clear, use extract_data with industry set and transition to INDUSTRY_QUESTIONS.");
      break;
    case "INDUSTRY_QUESTIONS":
      parts.push("Ask industry-specific questions from the checklist. Also ask about current lease situation. Once you have enough data, transition to LEASE_PREFERENCES.");
      break;
    case "LEASE_PREFERENCES":
      parts.push("Ask about lease term, budget, rent structure, TI, free rent, location, parking. Once gathered, transition to REVIEW.");
      break;
    case "REVIEW":
      parts.push("Summarize all gathered data clearly and ask user to confirm. When they confirm, transition to COMPLETED.");
      break;
    case "COMPLETED":
      parts.push("Survey is complete. Thank the user and let them know their ROI analysis is being generated.");
      break;
  }

  // Provide relevant benchmarks if industry is known
  if (extractedData.industry) {
    const benchmarks = INDUSTRY_BENCHMARKS[extractedData.industry as keyof typeof INDUSTRY_BENCHMARKS];
    if (benchmarks) {
      parts.push(`\n## INDUSTRY BENCHMARKS (use these to validate answers and provide context)`);
      for (const [key, value] of Object.entries(benchmarks)) {
        if (typeof value === "number") {
          parts.push(`- ${key}: ${value.toLocaleString()}`);
        }
      }
    }
  }

  return parts.join("\n");
}
