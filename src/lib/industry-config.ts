/**
 * Industry-specific configuration for the static questionnaire.
 * Maps broker-set industry strings to customized labels, hints, amenities, and goals.
 */

/** Map ClientModal industry values → engine IndustryType */
export function mapToEngineIndustry(clientIndustry: string | null | undefined): string | null {
  if (!clientIndustry) return null;
  const map: Record<string, string> = {
    "Legal": "LEGAL",
    "Financial Services": "FINANCIAL",
    "Technology": "TECH",
    "Healthcare": "MEDICAL",
    "Accounting": "FINANCIAL",
    "Insurance": "FINANCIAL",
    "Consulting": "GENERAL_OFFICE",
    "Real Estate": "GENERAL_OFFICE",
    "Media & Advertising": "GENERAL_OFFICE",
    "Architecture & Design": "GENERAL_OFFICE",
    "Nonprofit": "GENERAL_OFFICE",
    "Government": "GENERAL_OFFICE",
    "Other": "GENERAL_OFFICE",
  };
  return map[clientIndustry] ?? "GENERAL_OFFICE";
}

export interface IndustryConfig {
  /** Section 1 legend */
  teamSectionTitle: string;
  headcountLabel: string;
  headcountHint: string;
  projectedLabel: string;
  projectedHint: string;
  /** Section 2 */
  revenueSectionTitle: string;
  revenueLabel: string;
  revenueHint: string;
  revenuePerPersonLabel: string;
  revenuePerPersonHint: string;
  growthHint: string;
  /** Section 3 */
  spaceSectionTitle: string;
  sfHint: string;
  /** Section 4 */
  amenities: string[];
  /** Section 5 goals */
  goals: { value: string; label: string }[];
}

const DEFAULT_GOALS = [
  { value: "", label: "Select primary goal..." },
  { value: "MINIMIZE_COST", label: "Minimize occupancy costs" },
  { value: "MAXIMIZE_GROWTH", label: "Maximize revenue growth potential" },
  { value: "ATTRACT_TALENT", label: "Attract and retain talent" },
  { value: "IMPROVE_LOCATION", label: "Improve location / accessibility" },
  { value: "EXPAND_CAPACITY", label: "Expand operational capacity" },
];

const DEFAULT_CONFIG: IndustryConfig = {
  teamSectionTitle: "1. Team Size",
  headcountLabel: "Current headcount",
  headcountHint: "How many employees work in your office today?",
  projectedLabel: "Projected headcount (12 months)",
  projectedHint: "How many employees do you plan to have in a year?",
  revenueSectionTitle: "2. Revenue Impact",
  revenueLabel: "Current annual revenue",
  revenueHint: "Approximate total annual revenue",
  revenuePerPersonLabel: "Revenue per employee",
  revenuePerPersonHint: "Average revenue generated per employee",
  growthHint: "What % do you expect revenue to grow year-over-year?",
  spaceSectionTitle: "3. Space Requirements",
  sfHint: "Typical: 150-250 SF per person",
  amenities: [
    "Parking",
    "Conference rooms",
    "Private offices",
    "Open floor plan",
    "Kitchen / break room",
    "Building security",
    "Fitness center",
    "Outdoor space",
    "Public transit access",
    "Signage / visibility",
  ],
  goals: DEFAULT_GOALS,
};

const LEGAL_CONFIG: IndustryConfig = {
  teamSectionTitle: "1. Firm Size",
  headcountLabel: "Total attorneys and staff",
  headcountHint: "Partners, associates, paralegals, and support staff",
  projectedLabel: "Projected headcount (12 months)",
  projectedHint: "How many attorneys and staff do you expect in a year?",
  revenueSectionTitle: "2. Firm Revenue",
  revenueLabel: "Annual firm revenue",
  revenueHint: "Total gross revenue for the firm",
  revenuePerPersonLabel: "Revenue per attorney",
  revenuePerPersonHint: "Average revenue generated per attorney (billable hours x rate)",
  growthHint: "Expected revenue growth from new clients or rate increases?",
  spaceSectionTitle: "3. Office Requirements",
  sfHint: "Law firms typically need 250-400 SF per attorney (private offices)",
  amenities: [
    "Private attorney offices",
    "Deposition / conference rooms",
    "Law library or research area",
    "Client reception area",
    "Secure document storage",
    "Parking",
    "Court proximity",
    "Video conferencing rooms",
    "Kitchen / break room",
    "Building security",
  ],
  goals: [
    { value: "", label: "Select primary goal..." },
    { value: "MINIMIZE_COST", label: "Minimize occupancy costs" },
    { value: "ATTRACT_TALENT", label: "Attract and retain top attorneys" },
    { value: "IMPROVE_LOCATION", label: "Improve prestige / court proximity" },
    { value: "MAXIMIZE_GROWTH", label: "Support firm growth and new practice areas" },
    { value: "EXPAND_CAPACITY", label: "Add capacity for more attorneys" },
  ],
};

const MEDICAL_CONFIG: IndustryConfig = {
  teamSectionTitle: "1. Practice Size",
  headcountLabel: "Total providers and staff",
  headcountHint: "Physicians, NPs, PAs, nurses, and support staff",
  projectedLabel: "Projected headcount (12 months)",
  projectedHint: "How many providers and staff do you expect in a year?",
  revenueSectionTitle: "2. Practice Revenue",
  revenueLabel: "Annual practice revenue",
  revenueHint: "Total collections / gross revenue",
  revenuePerPersonLabel: "Revenue per provider",
  revenuePerPersonHint: "Average collections per physician or provider",
  growthHint: "Expected revenue growth from new patients or services?",
  spaceSectionTitle: "3. Clinical Space Requirements",
  sfHint: "Medical practices typically need 200-350 SF per provider (includes exam rooms)",
  amenities: [
    "Exam rooms",
    "Procedure rooms",
    "Patient waiting area",
    "Medical waste disposal",
    "Parking",
    "ADA accessibility",
    "Hospital proximity",
    "Lab / imaging space",
    "HVAC / ventilation",
    "Building security",
  ],
  goals: [
    { value: "", label: "Select primary goal..." },
    { value: "MINIMIZE_COST", label: "Minimize occupancy costs" },
    { value: "MAXIMIZE_GROWTH", label: "Grow patient volume and revenue" },
    { value: "ATTRACT_TALENT", label: "Attract and retain providers" },
    { value: "IMPROVE_LOCATION", label: "Improve patient accessibility" },
    { value: "EXPAND_CAPACITY", label: "Add exam rooms or services" },
  ],
};

const TECH_CONFIG: IndustryConfig = {
  teamSectionTitle: "1. Team Size",
  headcountLabel: "Total employees",
  headcountHint: "Engineers, product, design, and support staff",
  projectedLabel: "Projected headcount (12 months)",
  projectedHint: "How many team members do you plan to have in a year?",
  revenueSectionTitle: "2. Revenue Impact",
  revenueLabel: "Annual recurring revenue",
  revenueHint: "ARR or total annual revenue",
  revenuePerPersonLabel: "Revenue per employee",
  revenuePerPersonHint: "Average revenue generated per team member",
  growthHint: "Expected revenue growth year-over-year?",
  spaceSectionTitle: "3. Workspace Requirements",
  sfHint: "Tech companies typically need 125-200 SF per person (open plan / hybrid)",
  amenities: [
    "Open collaboration areas",
    "Phone booths / focus pods",
    "Server / data room",
    "Kitchen / break room",
    "Fitness center",
    "Bike storage",
    "Public transit access",
    "Rooftop / outdoor space",
    "Parking",
    "EV charging",
  ],
  goals: [
    { value: "", label: "Select primary goal..." },
    { value: "ATTRACT_TALENT", label: "Attract and retain engineering talent" },
    { value: "MAXIMIZE_GROWTH", label: "Support rapid scaling" },
    { value: "MINIMIZE_COST", label: "Minimize burn rate / occupancy costs" },
    { value: "IMPROVE_LOCATION", label: "Improve location for recruiting" },
    { value: "EXPAND_CAPACITY", label: "Expand team capacity" },
  ],
};

const FINANCIAL_CONFIG: IndustryConfig = {
  teamSectionTitle: "1. Team Size",
  headcountLabel: "Total advisors and staff",
  headcountHint: "Financial advisors, analysts, and support staff",
  projectedLabel: "Projected headcount (12 months)",
  projectedHint: "How many team members do you expect in a year?",
  revenueSectionTitle: "2. Firm Revenue",
  revenueLabel: "Annual firm revenue",
  revenueHint: "Total management fees, commissions, and advisory revenue",
  revenuePerPersonLabel: "Revenue per advisor",
  revenuePerPersonHint: "Average revenue generated per advisor or relationship manager",
  growthHint: "Expected AUM or revenue growth year-over-year?",
  spaceSectionTitle: "3. Office Requirements",
  sfHint: "Financial firms typically need 200-300 SF per person (private offices + meeting rooms)",
  amenities: [
    "Private offices",
    "Client meeting rooms",
    "Secure document storage",
    "Building security",
    "Parking",
    "Prestigious lobby / reception",
    "Conference rooms",
    "Kitchen / break room",
    "Public transit access",
    "AV / video conferencing",
  ],
  goals: [
    { value: "", label: "Select primary goal..." },
    { value: "MINIMIZE_COST", label: "Minimize occupancy costs" },
    { value: "ATTRACT_TALENT", label: "Attract top advisors and analysts" },
    { value: "IMPROVE_LOCATION", label: "Improve client-facing prestige" },
    { value: "MAXIMIZE_GROWTH", label: "Support AUM growth and expansion" },
    { value: "EXPAND_CAPACITY", label: "Add capacity for new advisors" },
  ],
};

export function getIndustryConfig(industry: string | null | undefined): IndustryConfig {
  if (!industry) return DEFAULT_CONFIG;

  const engineType = mapToEngineIndustry(industry);
  switch (engineType) {
    case "LEGAL":
      return LEGAL_CONFIG;
    case "MEDICAL":
      return MEDICAL_CONFIG;
    case "TECH":
      return TECH_CONFIG;
    case "FINANCIAL":
      return FINANCIAL_CONFIG;
    default:
      return DEFAULT_CONFIG;
  }
}
