import { z } from "zod";

// ─── Request Schema ─────────────────────────────────────────────

export const memoRequestSchema = z.object({
  memoType: z.enum(["IC_DECISION_MEMO", "MARKET_BRIEF", "WORKPLACE_PRODUCTIVITY"]),
  audience: z.enum(["CEO", "CFO", "COO", "IC"]),
  tone: z.enum(["BANK_STYLE", "CONCISE", "NARRATIVE"]),
  includeSections: z
    .array(
      z.enum([
        "EXECUTIVE_SUMMARY",
        "FINANCIAL_COMPARISON",
        "COMMUTE_TALENT",
        "RISK_ASSUMPTIONS",
        "RECOMMENDATION",
      ])
    )
    .min(1, "Select at least one section"),
});

export type MemoRequestInput = z.infer<typeof memoRequestSchema>;

// ─── Section Output Schema (for AI generateObject) ─────────────

export const sectionTableSchema = z.object({
  title: z.string().describe("Table title or caption"),
  columns: z.array(z.string()).describe("Column headers"),
  rows: z.array(z.array(z.string())).describe("Row data — each row is an array of cell strings"),
});

export const sectionCalloutSchema = z.object({
  label: z.string().describe("Short callout label, e.g. 'Key Takeaway' or 'Risk'"),
  text: z.string().describe("Callout body text"),
});

export const sectionOutputSchema = z.object({
  sectionTitle: z.string().describe("Section heading for the memo"),
  bullets: z
    .array(z.string())
    .describe("Key points as bullet items — each bullet is a complete sentence"),
  tables: z
    .array(sectionTableSchema)
    .describe("Data tables to include in this section — use for comparisons and metrics"),
  callouts: z
    .array(sectionCalloutSchema)
    .describe("Highlighted callout boxes for key takeaways, warnings, or recommendations"),
  assumptions: z
    .array(z.string())
    .describe("Assumptions or caveats that apply to this section — printed as footnotes"),
});

export type SectionOutput = z.infer<typeof sectionOutputSchema>;
