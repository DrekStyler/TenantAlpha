"use client";

import type { NegotiationAnalysis } from "@/schemas/api";
import type { TippingPoint } from "@/lib/tipping-points";
import type { LeaseOptionInput } from "@/engine/types";
import { OPTION_COLORS } from "@/config/theme";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface NegotiationInsightsProps {
  analysis: NegotiationAnalysis | null;
  tippingPoints: TippingPoint[];
  inputs: LeaseOptionInput[];
  loading: boolean;
  onRefresh: () => void;
}

function shortName(name: string) {
  const dash = name.indexOf(" — ");
  return dash !== -1 ? name.slice(0, dash) : name;
}

function formatTarget(field: string, value: number): string {
  if (field === "freeRentMonths") return `${value} months`;
  if (field.includes("Percent") || field === "discountRate" || field === "opExEscalation")
    return formatPercent(value);
  if (field === "baseRentY1" || field === "opExPerSF" || field === "propertyTax")
    return `$${value.toFixed(2)}/SF`;
  if (field === "parkingCostMonthly" || field === "otherMonthlyFees")
    return `${formatCurrency(value)}/mo`;
  if (field === "tiAllowance" || field === "estimatedBuildoutCost")
    return formatCurrency(value);
  return String(value);
}

export function NegotiationInsights({
  analysis,
  tippingPoints,
  inputs,
  loading,
  onRefresh,
}: NegotiationInsightsProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-navy-100 bg-white p-6">
        <div className="flex items-center gap-3">
          <Spinner size="sm" />
          <span className="text-sm text-navy-500">Analysing negotiation strategy...</span>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="rounded-xl border border-navy-100 bg-white p-6 text-center">
        <div className="mb-3 text-2xl">🎯</div>
        <h3 className="mb-1 text-sm font-semibold text-navy-900">
          Negotiation Analysis
        </h3>
        <p className="mb-4 text-xs text-navy-500">
          AI will identify which lease terms to negotiate and show the exact values needed to change the ranking.
        </p>
        <Button size="sm" onClick={onRefresh}>
          Analyse Negotiations
        </Button>
      </div>
    );
  }

  const recommendedOption = inputs[analysis.recommendedOptionIndex];
  const recommendedColor =
    OPTION_COLORS[analysis.recommendedOptionIndex % OPTION_COLORS.length];

  // Get tipping points for the recommended option
  const relevantTPs = tippingPoints.filter(
    (tp) => tp.optionIndex === analysis.recommendedOptionIndex
  );

  return (
    <div className="space-y-4">
      {/* Recommended Option */}
      <div className="rounded-xl border border-navy-100 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-navy-500">
            Negotiation Target
          </h3>
          <Button variant="secondary" size="sm" onClick={onRefresh}>
            Refresh
          </Button>
        </div>

        {recommendedOption && (
          <div className="mb-3 flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: recommendedColor }}
            />
            <span className="text-lg font-bold text-navy-900">
              {shortName(recommendedOption.optionName)}
            </span>
          </div>
        )}

        <p className="text-sm leading-relaxed text-navy-600">
          {analysis.summary}
        </p>
      </div>

      {/* Key Changes Needed */}
      {relevantTPs.length > 0 && (
        <div className="rounded-xl border border-navy-100 bg-white p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-navy-500">
            Changes to Win
          </h3>
          <div className="space-y-2.5">
            {relevantTPs.slice(0, 5).map((tp) => {
              const hlInfo = analysis.highlights.find(
                (h) =>
                  h.optionIndex === tp.optionIndex && h.field === tp.field
              );
              return (
                <div
                  key={`${tp.optionIndex}-${tp.field}`}
                  className="rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-medium text-navy-700">
                      {fieldLabel(tp.field)}
                    </span>
                    <span className="text-xs tabular-nums text-amber-700">
                      {tp.changePercent > 0 ? "+" : ""}
                      {tp.changePercent}%
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-navy-500">
                    <span>{formatTarget(tp.field, tp.currentValue)}</span>
                    <span className="text-navy-300">→</span>
                    <span className="font-semibold text-amber-700">
                      {formatTarget(tp.field, tp.targetValue)}
                    </span>
                  </div>
                  {hlInfo && (
                    <p className="mt-1 text-[10px] leading-tight text-navy-400">
                      {hlInfo.reason}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tips */}
      {analysis.negotiationTips.length > 0 && (
        <div className="rounded-xl border border-navy-100 bg-white p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-navy-500">
            Negotiation Tips
          </h3>
          <ul className="space-y-2">
            {analysis.negotiationTips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-xs text-navy-600">
                <span className="mt-0.5 shrink-0 text-amber-500">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Highlighted fields from other options */}
      {analysis.highlights.filter(
        (h) => h.optionIndex !== analysis.recommendedOptionIndex
      ).length > 0 && (
        <div className="rounded-xl border border-navy-100 bg-white p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-navy-500">
            Other Opportunities
          </h3>
          <div className="space-y-2">
            {analysis.highlights
              .filter(
                (h) => h.optionIndex !== analysis.recommendedOptionIndex
              )
              .map((h, i) => {
                const opt = inputs[h.optionIndex];
                const tp = tippingPoints.find(
                  (t) => t.optionIndex === h.optionIndex && t.field === h.field
                );
                return (
                  <div
                    key={i}
                    className="rounded-lg bg-navy-50/50 px-3 py-2"
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor:
                            OPTION_COLORS[h.optionIndex % OPTION_COLORS.length],
                        }}
                      />
                      <span className="text-xs font-medium text-navy-700">
                        {opt ? shortName(opt.optionName) : `Option ${h.optionIndex}`}
                      </span>
                      <span className="text-xs text-navy-400">
                        — {fieldLabel(h.field)}
                      </span>
                    </div>
                    {tp && (
                      <div className="ml-3.5 mt-0.5 text-[10px] text-navy-400">
                        {formatTarget(tp.field, tp.currentValue)} → {formatTarget(tp.field, tp.targetValue)}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function fieldLabel(field: string): string {
  const labels: Record<string, string> = {
    baseRentY1: "Base Rent",
    freeRentMonths: "Free Rent",
    escalationPercent: "Escalation",
    tiAllowance: "TI Allowance",
    opExPerSF: "OpEx",
    opExEscalation: "OpEx Escalation",
    parkingCostMonthly: "Parking",
    otherMonthlyFees: "Other Fees",
    discountRate: "Discount Rate",
    termMonths: "Term",
    rentableSF: "Size",
    propertyTax: "Property Tax",
  };
  return labels[field] ?? field;
}
