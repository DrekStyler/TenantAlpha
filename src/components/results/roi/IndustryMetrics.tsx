"use client";

import { Card, CardHeader } from "@/components/ui/Card";

const INDUSTRY_LABELS: Record<string, string> = {
  MEDICAL: "Healthcare / Medical",
  LEGAL: "Law Firm / Legal",
  AEROSPACE_DEFENSE: "Aerospace & Defense",
  TECH: "Technology",
  FINANCIAL: "Financial Services",
  GENERAL_OFFICE: "General Office",
};

const METRIC_LABELS: Record<string, string> = {
  // Medical
  revenuePerExamRoom: "Revenue per Exam Room",
  clinicalROI: "Clinical ROI",
  providerProductivity: "Provider Productivity Gain",
  cycleTimeImprovement: "Cycle Time Improvement",
  annualRevenueUplift: "Annual Revenue Uplift",
  // Legal
  revenuePerAttorney: "Revenue per Attorney",
  costPerBillableHour: "Cost per Billable Hour",
  leverageRatio: "Leverage Ratio",
  realizationRateImpact: "Realization Rate Impact",
  // Aerospace
  missionReadinessScore: "Mission Readiness Score",
  securityInfrastructureCost: "Security Infrastructure Cost",
  regulatoryComplianceSavings: "Regulatory Compliance Savings",
  contractWinProbabilityBoost: "Contract Win Probability Boost",
  estimatedPipelineUplift: "Estimated Pipeline Uplift",
  throughputGainPercent: "Throughput Gain",
  costPerMissionCriticalSF: "Cost per Mission-Critical SF",
  // Tech
  engineerProductivityGain: "Engineer Productivity Gain",
  hybridWorkSavings: "Hybrid Work Savings",
  collaborationZoneROI: "Collaboration Zone ROI",
  talentAttractionIndex: "Talent Attraction Index",
  // Financial
  revenuePerAdvisor: "Revenue per Advisor",
  complianceCostImpact: "Compliance Cost Impact",
  clientAccessibilityScore: "Client Accessibility Score",
};

interface IndustryMetricsProps {
  industryType: string;
  metrics: Record<string, number | string>;
}

export function IndustryMetrics({ industryType, metrics }: IndustryMetricsProps) {
  const entries = Object.entries(metrics);
  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader
        title="Industry-Specific Metrics"
        subtitle={INDUSTRY_LABELS[industryType] ?? industryType}
      />
      <div className="p-6 pt-0">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-lg border border-navy-100 px-4 py-3"
            >
              <span className="text-xs font-medium text-navy-500">
                {METRIC_LABELS[key] ?? formatLabel(key)}
              </span>
              <span className="text-sm font-bold text-navy-900">
                {formatValue(value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function formatValue(value: number | string): string {
  if (typeof value === "string") return value;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
  if (value % 1 !== 0) return value.toFixed(1);
  return value.toLocaleString();
}
