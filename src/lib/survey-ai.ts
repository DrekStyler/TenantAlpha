import type { SurveyPhase, ExtractedSurveyData } from "@/types/survey";
import { INDUSTRY_BENCHMARKS } from "@/engine/roi/benchmarks";

/**
 * System prompt for the AI survey agent.
 * Claude Opus drives a dynamic, context-aware interview to gather industry-specific ROI data.
 */
export const SURVEY_AGENT_SYSTEM_PROMPT = `You are a friendly, professional commercial real estate advisor conducting a business needs assessment. Your goal is to understand the tenant's business, industry, and space requirements so their broker can find the optimal lease.

## YOUR ROLE
- Ask clear, conversational questions — one at a time
- NEVER add commentary, explanation, or validation around the user's answer
- Your ENTIRE response should be the next question in multiple choice format — nothing else
- Exception: If the user says "I don't know", provide ONE benchmark sentence then the question
- Exception: During REVIEW phase, you summarize all data
- Adapt vocabulary to the respondent's role (e.g., "exam rooms" for a physician, "billable hours" for a managing partner)
- NEVER mention specific addresses, broker names, or personal identifying information

## QUESTION FORMAT — STRICT
Your response must contain EXACTLY ONE question. No preamble, no commentary.

Format:
**Your question here?**

A) First option
B) Second option
C) Third option
D) Other (please specify)

Rules:
- ENTIRE response = one question + its options. Nothing before, nothing after.
- Always include "Other (please specify)" as the last option
- Use A), B), C), D) lettering with closing parenthesis
- Keep options concise (under 10 words each)
- For numeric questions, provide ranges: A) 1-10  B) 11-25  C) 26-50  D) 51-100  E) 100+  F) Other
- For yes/no: A) Yes  B) No  C) Not sure
- Only skip multiple choice for company name (free-text)
- NEVER combine two questions in one message

## CONVERSATION STRATEGY

### Phase 1: CLASSIFY (INDUSTRY_DETECTION phase)
Ask exactly THREE questions, one per message, in this order:
1. First message: Ask which industry they're in (multiple choice with 6 options + Other)
2. Second message: Based on their industry, ask about sub-sector (industry-specific multiple choice)
3. Third message: Ask about their role/title (role-specific multiple choice)

Each message = exactly one question with options. No combining.
Extract industry, subSector, and role via extract_data as each is answered.
Transition to INDUSTRY_QUESTIONS after all three are confirmed.

### Phase 2: DYNAMIC FORM COMPLETION (INDUSTRY_QUESTIONS + LEASE_PREFERENCES phases)
Once classified, generate each next question based on:
- What form fields are still unfilled (check the FIELDS REMAINING list in the context)
- What the respondent has already told you (explicitly or implicitly)
- What is most important to know given their specific sub-sector and role

Do NOT ask about optional fields — only ask [REQUIRED] and [INFERRABLE] fields.
Use industry benchmarks to fill optional fields automatically via extract_data.

### Phase 3: REVIEW
Summarize everything gathered — including any inferred values — and ask the user to confirm.
Present data clearly in sections. Mark any inferred values with "(estimated)" so the user can correct them.
Tell them: "Based on your answers, I'll generate a detailed ROI analysis showing how different lease options would impact your business financially. Ready to see your results?"

## FIELD PRIORITY FRAMEWORK
When deciding which field to ask about next, use this priority order:

1. **Classifier fields** — sub-sector, role (always first, during INDUSTRY_DETECTION)
2. **Unlock fields** — fields whose answer determines what other fields are relevant (e.g., headcount unlocks revenue-per-employee, specialty unlocks exam room needs)
3. **High-value required fields** — headcount, annual revenue, industry-specific core metrics
4. **Inference candidates** — fields likely answerable from prior context (try to infer, don't ask)
5. **Low-priority optional fields** — ask last or skip entirely if inferrable

## INFERENCE RULES
Silently populate fields when the respondent's answers strongly imply values. Do NOT ask redundant questions. Confirm all inferences at the end in the REVIEW summary.

Examples:
| Signal | Inferred fields |
|--------|----------------|
| "I run a solo practice" | headcount ≈ 3-5, subSector = "Solo Practice" |
| "We're a health system with 12 hospitals" | subSector = "Hospital System", headcount = enterprise-scale |
| "We use Epic" | tech maturity = high (for medical) |
| "We're a 15-attorney firm" | headcount ≈ 25-30 (attorneys + support staff) |
| "I'm the managing partner" | role = "Managing Partner", decision maker = yes |
| "We're pre-revenue" | annualRevenue ≈ 0, stage = early |
| Role = "CFO" or "Office Manager" | Financial focus = yes, not clinical/technical |
| "We have 8 providers" | For medical: headcount ≈ 20-25 (providers + support staff ratio ~1:2) |
| "40% of our team is remote" | hybridWorkPercent = 40 (for tech) |

When you infer a value, include it in your extract_data tool call. In the REVIEW phase, clearly label inferred values so the user can correct them.

## INDUSTRY TAXONOMY

### MEDICAL
Sub-sectors: Hospital Systems, Private Practice (Solo/Group), Urgent Care, Ambulatory Surgery Centers, Behavioral Health, Telehealth, Medical Devices, Pharma
Common roles: Physician, Surgeon, Practice Manager, Hospital Administrator, CTO/CMIO, CFO, Nurse Practitioner, Office Manager
Pain points: HIPAA compliance, billing & reimbursement, EHR integration, prior authorization, staff retention, care coordination, exam room utilization
Key terminology: EMR/EHR, CPT codes, ICD-10, prior auth, credentialing, value-based care, FQHC, ACO, payer mix
Regulatory context: HIPAA, CMS, MACRA/MIPS, Joint Commission, state licensing boards
Key form fields: providers, examRooms, specialtyType, visitsPerProviderDay, reimbursementPerVisit, payerMix, cycleTimeMinutes, currentExamRoomUtilization

### LEGAL
Sub-sectors: BigLaw, Mid-size Firm, Boutique/Specialty, Solo Practice, In-house Legal, Legal Tech, Government/Public Interest
Common roles: Managing Partner, Associate, Of Counsel, Practice Group Leader, COO/CFO, Office Manager, IT Director
Pain points: Billable hour pressure, talent retention, tech adoption, real estate costs per attorney, hybrid work policies
Key terminology: Billable hours, realization rate, RPL, PPP, Am Law rankings, practice areas, matter management
Regulatory context: State bar requirements, client confidentiality, trust accounting, conflict checks
Key form fields: partners, associates, paralegals, adminStaff, practiceAreas, billableHourTarget, realizationRate, blendedBillingRate, courtProximityRequired, depositionRoomsNeeded

### TECH
Sub-sectors: SaaS, Enterprise Software, AI/ML, Fintech, Healthtech, Cybersecurity, Hardware, Dev Tools, E-commerce, Gaming
Common roles: CEO/CTO, VP Engineering, Head of Product, HR/People Ops, Facilities Manager, Office Manager
Pain points: Hybrid/remote workforce, recruiting, rapid scaling, burn rate, culture/collaboration
Key terminology: ARR, MRR, burn rate, headcount plan, sprint teams, stand-ups, collaboration zones
Regulatory context: SOC 2, GDPR, data residency, CCPA
Key form fields: engineers, productTeams, deploymentFrequency, hybridWorkPercent, serverRoomRequired, collaborationZonesNeeded, avgEngineerSalary

### FINANCIAL
Sub-sectors: Wealth Management/RIA, Investment Banking, Insurance, Hedge Fund, Private Equity, Retail Banking, Accounting (CPA)
Common roles: Managing Director, Financial Advisor, Portfolio Manager, Compliance Officer, Branch Manager, CFO, COO
Pain points: Regulatory compliance, client confidentiality, prestige/image, meeting room demand, secure storage
Key terminology: AUM, fiduciary, SEC/FINRA, compliance audit, client-facing, book of business
Regulatory context: SEC, FINRA, OCC, state insurance regulations, SOX, anti-money laundering
Key form fields: advisors, aum, clientMeetingsPerWeek, complianceLevel, branchOffice, vaultRequired, avgAdvisorRevenue

### AEROSPACE_DEFENSE
Sub-sectors: Defense Contractor (Prime/Sub), Space, UAV/Drone, Satellite, Intelligence, Cybersecurity, R&D Lab
Common roles: Program Manager, Chief Engineer, FSO (Facility Security Officer), ISSM, VP Operations, Contracts Manager
Pain points: SCIF/SAPF requirements, clearance levels, CMMC compliance, proximity to primes/bases, power/HVAC
Key terminology: SCIF, SAPF, ITAR, CMMC, DD-254, FSO, T-SCIF, TEMPEST, collateral classified, SCI
Regulatory context: NISPOM, ITAR/EAR, CMMC 2.0, DoD facility clearance, DCSA
Key form fields: scifRequired, sapfRequired, facilityCleared, clearanceLevel, itarCompliant, cmmcLevel, powerRequirementKW, ceilingHeightFt, floorLoadPSF, prototypeCapability, secureStorageRequired

### GENERAL_OFFICE
Sub-sectors: Consulting, Real Estate, Media & Advertising, Architecture & Design, Nonprofit, Government, Professional Services, Marketing Agency, HR/Staffing
Common roles: CEO/President, COO, Office Manager, Facilities Director, HR Director, CFO
Pain points: Lease costs, employee satisfaction, hybrid work, growth uncertainty, location accessibility
Key terminology: Headcount, FTE, hybrid policy, hoteling, occupancy rate
Regulatory context: Varies by sub-sector (ADA, local zoning, fire code)
Key form fields: (uses only the common fields — headcount, revenue, sfPerEmployee, etc.)

## ANTI-PATTERNS — CRITICAL
- ❌ "Great! Based on your answer..." — NO commentary
- ❌ "That's helpful. Now let me ask about..." — NO transitions
- ❌ Asking two questions in one message
- ❌ Explaining WHY you're asking a question
- ❌ Referencing prior answers in the preamble (save for REVIEW)
- ❌ Paragraph-length responses for a single question
- ❌ Asking the same field twice in different words
- ❌ Using jargon the respondent hasn't used themselves
- ❌ Asking optional fields — use benchmarks instead
- ❌ Confirming inferences mid-conversation (batch at end in REVIEW)
- ❌ Re-asking about industry if the broker already set it

## SKIP HANDLING
If the user says "Skip" or "use the industry average":
- Do NOT ask follow-up questions about that field
- Use the industry benchmark value from the INDUSTRY BENCHMARKS section
- Extract the benchmark value via extract_data
- Move on to the next question immediately
- Keep acknowledgment to 5 words max, e.g. "Got it, using industry average."

## OPTIONAL FIELDS
Do NOT ask about optional fields. Use industry benchmarks to fill them automatically.
Extract benchmark values via extract_data. The user should never be asked about
optional fields unless they volunteer the information.

## TOOL USAGE
After each user message, use the extract_data tool to report any structured data you parsed from their response.
- Include fields that were explicitly stated OR clearly implied
- Include inferred values when confidence is high
- Set the phase field when transitioning between phases
- Set subSector and role as soon as you identify them
- Maximum 15 questions total to keep the survey efficient

## IMPORTANT RULES
- Ask about current lease situation (current rent, escalation) to enable cost avoidance analysis
- Be concise — your response should be ONLY the next question with options
- When all required fields are gathered, move to the next phase immediately
- Do NOT exhaustively ask optional fields — use benchmarks instead`;

// ─── Field definitions for tracking ─────────────────────────────

interface FieldDef {
  key: string;
  label: string;
  priority: "required" | "inferrable" | "optional";
  /** Dot-path into ExtractedSurveyData (e.g. "industryInputs.providers") */
  path: string;
}

const COMMON_FIELDS: FieldDef[] = [
  { key: "headcount", label: "Total headcount", priority: "required", path: "headcount" },
  { key: "annualRevenue", label: "Annual revenue", priority: "required", path: "annualRevenue" },
  { key: "primaryGoal", label: "Primary business goal", priority: "required", path: "primaryGoal" },
  { key: "expansionTimeline", label: "Move-in timeline", priority: "required", path: "expansionTimeline" },
  { key: "criticalAmenities", label: "Critical amenities", priority: "required", path: "criticalAmenities" },
  { key: "projectedHeadcount12mo", label: "Projected headcount (12 months)", priority: "inferrable", path: "projectedHeadcount12mo" },
  { key: "revenuePerEmployee", label: "Revenue per employee", priority: "inferrable", path: "revenuePerEmployee" },
  { key: "projectedRevenueGrowth", label: "Projected revenue growth %", priority: "optional", path: "projectedRevenueGrowth" },
  { key: "sfPerEmployee", label: "Space per employee (SF)", priority: "inferrable", path: "sfPerEmployee" },
  { key: "budgetConstraint", label: "Monthly budget constraint", priority: "optional", path: "budgetConstraint" },
  { key: "avgEmployeeSalary", label: "Average employee salary", priority: "inferrable", path: "avgEmployeeSalary" },
  { key: "currentEmployeeTurnover", label: "Current employee turnover %", priority: "optional", path: "currentEmployeeTurnover" },
];

const LEASE_FIELDS: FieldDef[] = [
  { key: "preferredTerm", label: "Preferred lease term (in MONTHS, e.g. 3 years = 36, 5 years = 60, 7 years = 84)", priority: "required", path: "leasePreferences.preferredTerm" },
  { key: "preferredRentStructure", label: "Rent structure (Gross/NNN/Modified)", priority: "required", path: "leasePreferences.preferredRentStructure" },
  { key: "maxBaseRent", label: "Max base rent ($/SF/yr)", priority: "required", path: "leasePreferences.maxBaseRent" },
  { key: "tiExpectation", label: "TI allowance expectation", priority: "optional", path: "leasePreferences.tiExpectation" },
  { key: "freeRentExpectation", label: "Free rent expectation (months)", priority: "optional", path: "leasePreferences.freeRentExpectation" },
  { key: "preferredLocation", label: "Preferred location", priority: "optional", path: "leasePreferences.preferredLocation" },
  { key: "parkingNeeded", label: "Parking spaces needed", priority: "optional", path: "leasePreferences.parkingNeeded" },
];

const CURRENT_LEASE_FIELDS: FieldDef[] = [
  { key: "currentRent", label: "Current rent ($/SF/yr)", priority: "required", path: "currentLease.currentRent" },
  { key: "currentEscalation", label: "Current annual escalation %", priority: "inferrable", path: "currentLease.currentEscalation" },
  { key: "painPoints", label: "Current lease pain points", priority: "optional", path: "currentLease.painPoints" },
];

const INDUSTRY_FIELDS: Record<string, FieldDef[]> = {
  MEDICAL: [
    { key: "providers", label: "Number of providers", priority: "required", path: "industryInputs.providers" },
    { key: "examRooms", label: "Exam rooms needed", priority: "required", path: "industryInputs.examRooms" },
    { key: "specialtyType", label: "Practice specialty", priority: "required", path: "industryInputs.specialtyType" },
    { key: "visitsPerProviderDay", label: "Patient visits per provider/day", priority: "inferrable", path: "industryInputs.visitsPerProviderDay" },
    { key: "reimbursementPerVisit", label: "Avg reimbursement per visit", priority: "inferrable", path: "industryInputs.reimbursementPerVisit" },
    { key: "payerMix", label: "Payer mix breakdown", priority: "optional", path: "industryInputs.payerMix" },
    { key: "cycleTimeMinutes", label: "Patient cycle time (minutes)", priority: "optional", path: "industryInputs.cycleTimeMinutes" },
    { key: "currentExamRoomUtilization", label: "Exam room utilization %", priority: "optional", path: "industryInputs.currentExamRoomUtilization" },
  ],
  LEGAL: [
    { key: "partners", label: "Number of partners", priority: "required", path: "industryInputs.partners" },
    { key: "associates", label: "Number of associates", priority: "required", path: "industryInputs.associates" },
    { key: "paralegals", label: "Number of paralegals", priority: "inferrable", path: "industryInputs.paralegals" },
    { key: "practiceAreas", label: "Practice areas", priority: "required", path: "industryInputs.practiceAreas" },
    { key: "billableHourTarget", label: "Billable hour target/attorney/year", priority: "inferrable", path: "industryInputs.billableHourTarget" },
    { key: "realizationRate", label: "Realization rate %", priority: "inferrable", path: "industryInputs.realizationRate" },
    { key: "blendedBillingRate", label: "Blended billing rate ($/hr)", priority: "inferrable", path: "industryInputs.blendedBillingRate" },
    { key: "courtProximityRequired", label: "Court proximity needed", priority: "optional", path: "industryInputs.courtProximityRequired" },
    { key: "depositionRoomsNeeded", label: "Deposition rooms needed", priority: "optional", path: "industryInputs.depositionRoomsNeeded" },
  ],
  TECH: [
    { key: "engineers", label: "Number of engineers", priority: "required", path: "industryInputs.engineers" },
    { key: "productTeams", label: "Number of product teams", priority: "inferrable", path: "industryInputs.productTeams" },
    { key: "hybridWorkPercent", label: "Hybrid/remote workforce %", priority: "required", path: "industryInputs.hybridWorkPercent" },
    { key: "deploymentFrequency", label: "Deployment frequency", priority: "optional", path: "industryInputs.deploymentFrequency" },
    { key: "serverRoomRequired", label: "Server room needed", priority: "optional", path: "industryInputs.serverRoomRequired" },
    { key: "collaborationZonesNeeded", label: "Collaboration zones needed", priority: "optional", path: "industryInputs.collaborationZonesNeeded" },
    { key: "avgEngineerSalary", label: "Avg engineer salary", priority: "inferrable", path: "industryInputs.avgEngineerSalary" },
  ],
  FINANCIAL: [
    { key: "advisors", label: "Number of advisors", priority: "required", path: "industryInputs.advisors" },
    { key: "aum", label: "Assets under management", priority: "required", path: "industryInputs.aum" },
    { key: "clientMeetingsPerWeek", label: "Client meetings per week", priority: "inferrable", path: "industryInputs.clientMeetingsPerWeek" },
    { key: "complianceLevel", label: "Regulatory/compliance level", priority: "required", path: "industryInputs.complianceLevel" },
    { key: "branchOffice", label: "Is this a branch office", priority: "optional", path: "industryInputs.branchOffice" },
    { key: "vaultRequired", label: "Vault/secure storage needed", priority: "optional", path: "industryInputs.vaultRequired" },
    { key: "avgAdvisorRevenue", label: "Avg revenue per advisor", priority: "inferrable", path: "industryInputs.avgAdvisorRevenue" },
  ],
  AEROSPACE_DEFENSE: [
    { key: "scifRequired", label: "SCIF required", priority: "required", path: "industryInputs.scifRequired" },
    { key: "facilityCleared", label: "Facility currently cleared", priority: "required", path: "industryInputs.facilityCleared" },
    { key: "clearanceLevel", label: "Clearance level", priority: "required", path: "industryInputs.clearanceLevel" },
    { key: "itarCompliant", label: "ITAR compliant", priority: "required", path: "industryInputs.itarCompliant" },
    { key: "cmmcLevel", label: "CMMC level (1-5)", priority: "required", path: "industryInputs.cmmcLevel" },
    { key: "powerRequirementKW", label: "Power requirements (KW)", priority: "inferrable", path: "industryInputs.powerRequirementKW" },
    { key: "ceilingHeightFt", label: "Ceiling height (ft)", priority: "inferrable", path: "industryInputs.ceilingHeightFt" },
    { key: "sapfRequired", label: "SAPF required", priority: "optional", path: "industryInputs.sapfRequired" },
    { key: "prototypeCapability", label: "Prototyping capability needed", priority: "optional", path: "industryInputs.prototypeCapability" },
    { key: "secureStorageRequired", label: "Secure storage needed", priority: "optional", path: "industryInputs.secureStorageRequired" },
  ],
  GENERAL_OFFICE: [],
};

// ─── Helpers ────────────────────────────────────────────────────

/** Resolve a dot-path (e.g. "industryInputs.providers") against ExtractedSurveyData */
function getNestedValue(data: ExtractedSurveyData, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = data;
  for (const p of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[p];
  }
  return current;
}

/** Check if a field has been filled */
function isFieldFilled(data: ExtractedSurveyData, path: string): boolean {
  const val = getNestedValue(data, path);
  if (val === undefined || val === null) return false;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === "string") return val.length > 0;
  return true;
}

/** Get fields for the current phase and industry */
function getFieldsForPhase(
  phase: SurveyPhase,
  industry: string | undefined
): FieldDef[] {
  switch (phase) {
    case "INDUSTRY_DETECTION":
      return []; // Classification phase, no form fields
    case "INDUSTRY_QUESTIONS": {
      const industrySpecific = INDUSTRY_FIELDS[industry ?? "GENERAL_OFFICE"] ?? [];
      return [...COMMON_FIELDS, ...industrySpecific, ...CURRENT_LEASE_FIELDS];
    }
    case "LEASE_PREFERENCES":
      return LEASE_FIELDS;
    case "REVIEW":
    case "COMPLETED":
      return [];
    default:
      return [];
  }
}

// ─── Context Builder ────────────────────────────────────────────

/**
 * Build the dynamic context sent with each survey message.
 * Includes conversation state tracking, field completion status, and benchmarks.
 */
export function buildSurveyContext(
  phase: SurveyPhase,
  extractedData: ExtractedSurveyData,
  clientName: string,
  brokerSetIndustry?: string | null
): string {
  const parts: string[] = [];

  // ── Current State ──
  parts.push(`## CURRENT STATE`);
  parts.push(`- Client name: ${clientName}`);
  parts.push(`- Current phase: ${phase}`);
  parts.push(`- Sub-sector identified: ${extractedData.subSector ?? "not yet"}`);
  parts.push(`- Role identified: ${extractedData.role ?? "not yet"}`);

  if (brokerSetIndustry) {
    parts.push(`- Broker-confirmed industry: ${brokerSetIndustry} (mapped to ${extractedData.industry})`);
    parts.push(`- NOTE: The broker has already identified this client's industry. Do NOT re-ask about their industry. Still ask about sub-sector and role to classify properly, then jump into industry-specific questions.`);
  } else if (extractedData.industry) {
    parts.push(`- Detected industry: ${extractedData.industry}`);
  }

  // ── Fields Completed ──
  const allFields = [
    ...COMMON_FIELDS,
    ...LEASE_FIELDS,
    ...CURRENT_LEASE_FIELDS,
    ...(INDUSTRY_FIELDS[extractedData.industry ?? "GENERAL_OFFICE"] ?? []),
  ];

  const completed = allFields.filter((f) => isFieldFilled(extractedData, f.path));
  const remaining = allFields.filter((f) => !isFieldFilled(extractedData, f.path));

  if (completed.length > 0) {
    parts.push(`\n## FIELDS COMPLETED (${completed.length})`);
    for (const f of completed) {
      const val = getNestedValue(extractedData, f.path);
      const display = Array.isArray(val) ? val.join(", ") : String(val);
      parts.push(`- ${f.label}: ${display}`);
    }
  }

  // ── Fields Remaining (prioritized for current phase) ──
  const phaseFields = getFieldsForPhase(phase, extractedData.industry);
  const phaseRemaining = phaseFields.filter((f) => !isFieldFilled(extractedData, f.path));

  if (phaseRemaining.length > 0) {
    // Filter: only show required + inferrable fields.
    // Optional fields should be inferred from benchmarks, not asked.
    const priorityOrder = { required: 0, inferrable: 1, optional: 2 };
    const sorted = [...phaseRemaining]
      .filter((f) => f.priority !== "optional")
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    if (sorted.length > 0) {
      parts.push(`\n## FIELDS REMAINING — ${phase} (${sorted.length})`);
      parts.push(`Generate the single best next question targeting the highest-priority incomplete field.`);
      for (const f of sorted) {
        const tag = f.priority === "required" ? "[REQUIRED]" : "[INFERRABLE]";
        parts.push(`${tag} ${f.label} (${f.path})`);
      }
    }
  }

  // ── Phase Instructions ──
  parts.push(`\n## PHASE INSTRUCTIONS`);
  switch (phase) {
    case "INDUSTRY_DETECTION":
      if (!extractedData.industry) {
        parts.push("Determine the user's industry. Once identified, also ask about their sub-sector and role before transitioning.");
      }
      if (extractedData.industry && !extractedData.subSector) {
        parts.push("Industry is known. Ask about their specific sub-sector within that industry.");
      }
      if (extractedData.industry && extractedData.subSector && !extractedData.role) {
        parts.push("Industry and sub-sector are known. Ask about their role/title.");
      }
      if (extractedData.industry && extractedData.subSector && extractedData.role) {
        parts.push("Classification complete! Use extract_data to set phase to INDUSTRY_QUESTIONS and proceed.");
      }
      break;
    case "INDUSTRY_QUESTIONS":
      parts.push("Ask about business details and current lease. Target the highest-priority remaining field.");
      parts.push("Use prior answers to infer fields when possible — don't ask what you can derive.");
      parts.push("When all [REQUIRED] fields are gathered (or enough for a solid analysis), transition to LEASE_PREFERENCES.");
      break;
    case "LEASE_PREFERENCES":
      parts.push("Ask about lease term (in years — convert to months for extraction), rent structure, and max budget. These are the only required lease fields. Do NOT ask about TI, free rent expectations, parking, or location — use defaults.");
      parts.push("IMPORTANT: Users typically state lease terms in YEARS (e.g. '5 years', '7 years'). You MUST convert to MONTHS before extracting — extract 60 for 5 years, 84 for 7 years, etc. The preferredTerm field is always in months.");
      parts.push("When core lease preferences are gathered, transition to REVIEW.");
      break;
    case "REVIEW":
      parts.push("Summarize ALL gathered data clearly in sections. Mark any inferred values with '(estimated)'. Ask the user to confirm or correct anything. When they confirm, transition to COMPLETED.");
      break;
    case "COMPLETED":
      parts.push("Survey is complete. Thank the user and let them know their ROI analysis is being generated.");
      break;
  }

  // ── Industry Benchmarks ──
  if (extractedData.industry) {
    const benchmarks = INDUSTRY_BENCHMARKS[extractedData.industry as keyof typeof INDUSTRY_BENCHMARKS];
    if (benchmarks) {
      parts.push(`\n## INDUSTRY BENCHMARKS (use to validate answers, provide context, and infer values)`);
      for (const [key, value] of Object.entries(benchmarks)) {
        if (typeof value === "number") {
          parts.push(`- ${key}: ${value.toLocaleString()}`);
        }
      }
    }
  }

  return parts.join("\n");
}
