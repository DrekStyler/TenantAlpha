"use client";

import { Card, CardHeader } from "@/components/ui/Card";
import type { ROIOutputs } from "@/types/survey";
import { CostAvoidanceSection } from "./CostAvoidanceSection";
import { ProductivitySection } from "./ProductivitySection";
import { StrategicSection } from "./StrategicSection";
import { CapitalSection } from "./CapitalSection";
import { IndustryMetrics } from "./IndustryMetrics";

interface ROIAnalysisTabProps {
  roiOutputs: ROIOutputs;
  industryType?: string | null;
}

const INDUSTRY_LABELS: Record<string, string> = {
  MEDICAL: "Healthcare / Medical",
  LEGAL: "Law Firm / Legal",
  AEROSPACE_DEFENSE: "Aerospace & Defense",
  TECH: "Technology",
  FINANCIAL: "Financial Services",
  GENERAL_OFFICE: "General Office",
};

export function ROIAnalysisTab({ roiOutputs, industryType }: ROIAnalysisTabProps) {
  const { costAvoidance, productivity, strategic, capital, compositeROI, industrySpecific } = roiOutputs;

  return (
    <div className="space-y-8">
      {/* Composite ROI Overview */}
      <Card>
        <CardHeader
          title="ROI Analysis Overview"
          subtitle={industryType ? INDUSTRY_LABELS[industryType] ?? industryType : undefined}
        />
        <div className="p-6 pt-0">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <OverviewMetric
              label="Composite ROI"
              value={`${compositeROI.toFixed(1)}%`}
              color="bg-navy-900"
            />
            <OverviewMetric
              label="Annual Savings"
              value={formatCurrency(costAvoidance.annualSavings)}
              color="bg-green-600"
            />
            <OverviewMetric
              label="Revenue Impact"
              value={formatCurrency(productivity.annualProductivityDollarGain)}
              color="bg-blue-600"
            />
            <OverviewMetric
              label="Capital Preserved"
              value={formatCurrency(capital.totalCapitalBenefit)}
              color="bg-gold-500"
            />
          </div>
        </div>
      </Card>

      {/* Four ROI Framework Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CostAvoidanceSection data={costAvoidance} />
        <ProductivitySection data={productivity} />
        <StrategicSection data={strategic} />
        <CapitalSection data={capital} />
      </div>

      {/* Industry-Specific Metrics */}
      {industryType && Object.keys(industrySpecific).length > 0 && (
        <IndustryMetrics
          industryType={industryType}
          metrics={industrySpecific}
        />
      )}
    </div>
  );
}

function OverviewMetric({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-lg bg-navy-50 p-4">
      <div className={`mb-2 inline-block rounded px-2 py-0.5 text-xs font-bold text-white ${color}`}>
        {label}
      </div>
      <p className="text-2xl font-bold text-navy-900">{value}</p>
    </div>
  );
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${Math.round(value / 1_000)}K`;
  }
  return `$${value.toFixed(0)}`;
}
