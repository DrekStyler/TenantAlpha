export const DEFAULT_DISCOUNT_RATE = 8.0;
export const DEFAULT_ESCALATION_PERCENT = 3.0;
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 5;

export const PROPERTY_TYPES = [
  { value: "OFFICE", label: "Office" },
  { value: "RETAIL", label: "Retail" },
  { value: "INDUSTRIAL", label: "Industrial" },
  { value: "FLEX", label: "Flex" },
  { value: "OTHER", label: "Other" },
] as const;

export const RENT_STRUCTURES = [
  { value: "GROSS", label: "Full-Service Gross" },
  { value: "NNN", label: "Triple Net (NNN)" },
  { value: "MODIFIED_GROSS", label: "Modified Gross" },
] as const;

export const ESCALATION_TYPES = [
  { value: "FIXED_PERCENT", label: "Fixed %" },
  { value: "CPI", label: "CPI-Based" },
] as const;

export const FREE_RENT_TYPES = [
  { value: "ABATED", label: "Abated (True Free)" },
  { value: "DEFERRED", label: "Deferred (Repaid Later)" },
] as const;

export const EXISTING_CONDITIONS = [
  { value: "SHELL", label: "Shell" },
  { value: "SECOND_GEN", label: "Second Generation" },
  { value: "TURNKEY", label: "Turnkey / Plug-and-Play" },
  { value: "AS_IS", label: "As-Is" },
] as const;

export const DISCOUNTING_MODES = [
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual" },
] as const;

export const DEAL_STAGE_CONFIG = [
  { value: "PROSPECTING", label: "Prospecting", color: "bg-sky-100 text-sky-800" },
  { value: "REQUIREMENTS", label: "Requirements", color: "bg-indigo-100 text-indigo-800" },
  { value: "TOUR", label: "Tour / Site Visit", color: "bg-violet-100 text-violet-800" },
  { value: "LOI", label: "LOI / Proposal", color: "bg-amber-100 text-amber-800" },
  { value: "NEGOTIATION", label: "Negotiation", color: "bg-orange-100 text-orange-800" },
  { value: "UNDER_REVIEW", label: "Under Review", color: "bg-navy-100 text-navy-700" },
  { value: "EXECUTED", label: "Executed", color: "bg-green-100 text-green-800" },
  { value: "DEAD", label: "Dead", color: "bg-red-100 text-red-700" },
] as const;
