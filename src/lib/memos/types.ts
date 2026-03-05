// ─── Memo Type Enums ────────────────────────────────────────────

export type MemoType = "IC_DECISION_MEMO" | "MARKET_BRIEF" | "WORKPLACE_PRODUCTIVITY";

export type MemoAudience = "CEO" | "CFO" | "COO" | "IC";

export type MemoTone = "BANK_STYLE" | "CONCISE" | "NARRATIVE";

export type MemoSectionId =
  | "EXECUTIVE_SUMMARY"
  | "FINANCIAL_COMPARISON"
  | "COMMUTE_TALENT"
  | "RISK_ASSUMPTIONS"
  | "RECOMMENDATION";

// ─── UI-Facing Constants ────────────────────────────────────────

export const MEMO_TYPES: ReadonlyArray<{ id: MemoType; label: string; description: string }> = [
  { id: "IC_DECISION_MEMO", label: "IC Decision Memo", description: "Investment committee-style briefing with full financial analysis" },
  { id: "MARKET_BRIEF", label: "Market Brief", description: "High-level market positioning and option comparison" },
  { id: "WORKPLACE_PRODUCTIVITY", label: "Workplace & Productivity", description: "Focus on talent, commute, and workplace factors" },
] as const;

export const MEMO_AUDIENCES: ReadonlyArray<{ id: MemoAudience; label: string; description: string }> = [
  { id: "CEO", label: "CEO", description: "Strategic focus — high-level trade-offs and business impact" },
  { id: "CFO", label: "CFO", description: "Financial focus — NPV, cost metrics, capital preservation" },
  { id: "COO", label: "COO", description: "Operational focus — timeline, logistics, workplace factors" },
  { id: "IC", label: "Investment Committee", description: "Comprehensive — full financial and strategic analysis" },
] as const;

export const MEMO_TONES: ReadonlyArray<{ id: MemoTone; label: string; description: string }> = [
  { id: "BANK_STYLE", label: "Bank Style", description: "Formal, structured, institutional tone" },
  { id: "CONCISE", label: "Concise", description: "Bullet-heavy, minimal prose, data-forward" },
  { id: "NARRATIVE", label: "Narrative", description: "Flowing prose with detailed commentary" },
] as const;

export const MEMO_SECTIONS: ReadonlyArray<{ id: MemoSectionId; label: string; description: string }> = [
  { id: "EXECUTIVE_SUMMARY", label: "Executive Summary", description: "Overview with recommendation and key findings" },
  { id: "FINANCIAL_COMPARISON", label: "Financial Comparison", description: "Side-by-side metrics table and cost analysis" },
  { id: "RISK_ASSUMPTIONS", label: "Risk & Assumptions", description: "Key risks, sensitivities, and stated assumptions" },
  { id: "RECOMMENDATION", label: "Recommendation", description: "Final recommendation with rationale and next steps" },
  { id: "COMMUTE_TALENT", label: "Location & Talent", description: "Walkability, accessibility, and amenity comparison" },
] as const;

// ─── Request / Response Interfaces ──────────────────────────────

export interface MemoRequest {
  dealId: string;
  memoType: MemoType;
  audience: MemoAudience;
  tone: MemoTone;
  includeSections: MemoSectionId[];
}

export interface MemoTableData {
  title: string;
  columns: string[];
  rows: string[][];
}

export interface MemoCallout {
  label: string;
  text: string;
}

export interface MemoSectionOutput {
  sectionTitle: string;
  bullets: string[];
  tables: MemoTableData[];
  callouts: MemoCallout[];
  assumptions: string[];
}

export interface MemoGenerationResult {
  sections: Record<string, MemoSectionOutput>;
  docxBuffer: Buffer;
}
