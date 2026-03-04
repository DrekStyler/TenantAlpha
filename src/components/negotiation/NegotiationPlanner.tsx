"use client";

import { useState, useCallback } from "react";
import type { LeaseOptionInput } from "@/engine/types";
import type { NegotiationAnalysis } from "@/schemas/api";
import type { TippingPoint } from "@/lib/tipping-points";
import { useNegotiationState } from "@/hooks/useNegotiationState";
import { NPVChartSection } from "./NPVChartSection";
import { EditableAssumptionsTable, type HighlightMap, type CellHighlight } from "./EditableAssumptionsTable";
import { DerivedMetricsTable } from "./DerivedMetricsTable";
import { NegotiationInsights } from "./NegotiationInsights";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatCurrency, formatPercent } from "@/lib/formatters";

interface NegotiationPlannerProps {
  dealId: string;
  dealName: string;
  initialInputs: LeaseOptionInput[];
  optionIds: string[];
}

/** Format a tipping point target value for cell display */
function formatTargetForField(field: string, value: number): string {
  if (field === "freeRentMonths") return `${value} mo`;
  if (field.includes("Percent") || field === "discountRate" || field === "opExEscalation")
    return formatPercent(value);
  if (field === "baseRentY1" || field === "opExPerSF" || field === "propertyTax")
    return `$${value.toFixed(2)}`;
  if (field === "parkingCostMonthly" || field === "otherMonthlyFees")
    return formatCurrency(value);
  if (field === "tiAllowance" || field === "estimatedBuildoutCost")
    return formatCurrency(value);
  return String(value);
}

export function NegotiationPlanner({
  dealId,
  dealName,
  initialInputs,
  optionIds,
}: NegotiationPlannerProps) {
  const { inputs, results, config, saving, updateField, setConfig, flushSaves } =
    useNegotiationState({
      dealId,
      initialInputs,
      optionIds,
    });

  const [analysis, setAnalysis] = useState<NegotiationAnalysis | null>(null);
  const [tippingPoints, setTippingPoints] = useState<TippingPoint[]>([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  // Build highlight map from AI analysis + tipping points
  const highlights: HighlightMap = new Map();
  if (analysis) {
    for (const hl of analysis.highlights) {
      const tp = tippingPoints.find(
        (t) => t.optionIndex === hl.optionIndex && t.field === hl.field
      );
      const key = `${hl.optionIndex}:${hl.field}`;
      const cellHL: CellHighlight = {
        targetValue: tp?.targetValue ?? 0,
        targetDisplay: tp ? formatTargetForField(tp.field, tp.targetValue) : "",
        reason: hl.reason,
      };
      highlights.set(key, cellHL);
    }
  }

  const requestAnalysis = useCallback(async () => {
    setAnalysisLoading(true);
    setAnalysisError("");
    try {
      // Flush any pending saves first
      await flushSaves();

      const res = await fetch("/api/ai/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setAnalysisError(
          (errData as { error?: string }).error ?? "Analysis failed"
        );
        return;
      }
      const data = await res.json();
      setAnalysis(data.analysis as NegotiationAnalysis);
      setTippingPoints(data.tippingPoints as TippingPoint[]);
    } catch {
      setAnalysisError("Failed to analyse negotiations. Please try again.");
    } finally {
      setAnalysisLoading(false);
    }
  }, [dealId, flushSaves]);

  return (
    <div className="space-y-6">
      {/* Saving indicator */}
      {saving && (
        <div className="fixed right-4 top-4 z-50 rounded-lg bg-navy-900 px-3 py-1.5 text-xs text-white shadow-lg">
          Saving...
        </div>
      )}

      {/* NPV Charts + Config */}
      {results && (
        <Card>
          <CardHeader
            title="Live NPV Comparison"
            subtitle="Edit assumptions below — charts update instantly"
          />
          <NPVChartSection
            results={results}
            config={config}
            onConfigChange={setConfig}
          />
        </Card>
      )}

      {/* Analysis error */}
      {analysisError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {analysisError}
        </div>
      )}

      {/* Main content: Table + Insights sidebar */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: Tables */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Lease Assumptions"
              subtitle={
                highlights.size > 0
                  ? "Highlighted cells show negotiable terms — target values shown below"
                  : "Click any value to edit — changes recalculate automatically"
              }
            />
            <EditableAssumptionsTable
              inputs={inputs}
              updateField={updateField}
              highlights={highlights}
            />
          </Card>

          {results && (
            <Card>
              <CardHeader
                title="Computed Metrics"
                subtitle={`${dealName} — all metrics derived from assumptions above`}
              />
              <DerivedMetricsTable results={results} />
            </Card>
          )}
        </div>

        {/* Right: Insights sidebar */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <NegotiationInsights
            analysis={analysis}
            tippingPoints={tippingPoints}
            inputs={inputs}
            loading={analysisLoading}
            onRefresh={requestAnalysis}
          />
        </div>
      </div>
    </div>
  );
}
