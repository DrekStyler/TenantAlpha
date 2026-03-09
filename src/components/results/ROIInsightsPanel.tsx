"use client";

import type { ROIOutputs } from "@/types/survey";

interface ROIInsightsPanelProps {
  roiOutputs: ROIOutputs;
  industryType?: string | null;
}

const INDUSTRY_LABELS: Record<string, string> = {
  MEDICAL: "Healthcare",
  LEGAL: "Legal",
  AEROSPACE_DEFENSE: "Aerospace & Defense",
  TECH: "Technology",
  FINANCIAL: "Financial Services",
  GENERAL_OFFICE: "General Office",
};

function formatCurrency(value?: number): string {
  if (value === undefined || value === null) return "N/A";
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatPercent(value?: number): string {
  if (value === undefined || value === null) return "N/A";
  return `${value.toFixed(1)}%`;
}

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = Math.min((score / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-navy-100">
        <div
          className="h-2 rounded-full bg-navy-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-navy-700">{score.toFixed(1)}</span>
    </div>
  );
}

export function ROIInsightsPanel({ roiOutputs, industryType }: ROIInsightsPanelProps) {
  const { costAvoidance, productivity, strategic, capital } = roiOutputs;
  const industryLabel = industryType ? INDUSTRY_LABELS[industryType] ?? industryType : "your industry";

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {/* Cost Avoidance */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wide text-navy-900">
          Cost Avoidance
        </h3>
        <p className="mt-1 text-xs text-navy-400">
          Savings from optimized lease terms vs. market conditions
        </p>
        <div className="mt-4 space-y-3">
          <Metric label="Annual Savings" value={formatCurrency(costAvoidance.annualSavings)} />
          <Metric label="5-Year Savings" value={formatCurrency(costAvoidance.fiveYearSavings)} />
          <Metric label="Escalation Savings" value={formatCurrency(costAvoidance.escalationSavings)} />
          <Metric label="Downtime Cost Avoided" value={formatCurrency(costAvoidance.downtimeCostAvoided)} />
          <Metric label="Operational Efficiency Gain" value={formatCurrency(costAvoidance.operationalEfficiencyGain)} />
          <Metric label="Cost Avoidance ROI" value={formatPercent(costAvoidance.roiPercent)} highlight />
        </div>
      </div>

      {/* Productivity */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wide text-navy-900">
          Productivity Impact
        </h3>
        <p className="mt-1 text-xs text-navy-400">
          Revenue uplift from better space design for {industryLabel}
        </p>
        <div className="mt-4 space-y-3">
          <Metric
            label="Current Rev / Employee"
            value={formatCurrency(productivity.currentRevenuePerEmployee)}
          />
          <Metric
            label="Projected Rev / Employee"
            value={formatCurrency(productivity.projectedRevenuePerEmployee)}
          />
          <Metric
            label="Productivity Gain"
            value={formatPercent(productivity.productivityGainPercent)}
          />
          <Metric
            label="Annual Revenue Impact"
            value={formatCurrency(productivity.annualProductivityDollarGain)}
            highlight
          />
          <Metric label="Collaboration Impact" value={formatCurrency(productivity.collaborationImpact)} />
          <Metric label="Churn Reduction Savings" value={formatCurrency(productivity.churnReductionSavings)} />
        </div>
      </div>

      {/* Strategic */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wide text-navy-900">
          Strategic Value
        </h3>
        <p className="mt-1 text-xs text-navy-400">
          Location and brand impact scores for {industryLabel}
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <p className="mb-1 text-xs font-medium text-navy-600">Talent Attraction</p>
            <ScoreBar score={strategic.talentAttractionScore} />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-navy-600">Client Experience</p>
            <ScoreBar score={strategic.clientExperienceScore} />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-navy-600">Market Presence</p>
            <ScoreBar score={strategic.marketPresenceScore} />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-navy-600">Regulatory Alignment</p>
            <ScoreBar score={strategic.regulatoryAlignmentScore} />
          </div>
          <Metric
            label="Estimated Revenue Impact"
            value={formatCurrency(strategic.estimatedRevenueImpact)}
            highlight
          />
        </div>
      </div>

      {/* Capital */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wide text-navy-900">
          Capital Efficiency
        </h3>
        <p className="mt-1 text-xs text-navy-400">
          Incentives and capital preserved through lease negotiation
        </p>
        <div className="mt-4 space-y-3">
          <Metric label="TI Dollars Received" value={formatCurrency(capital.tiDollarsReceived)} />
          <Metric label="Capital Preserved" value={formatCurrency(capital.tenantCapitalPreserved)} />
          <Metric label="Free Rent Value" value={formatCurrency(capital.freeRentWorkingCapitalSaved)} />
          <Metric label="Total Capital Benefit" value={formatCurrency(capital.totalCapitalBenefit)} highlight />
          <Metric label="Tenant Out-of-Pocket" value={formatCurrency(capital.tenantOutOfPocket)} />
          <Metric label="Capital ROI" value={formatPercent(capital.effectiveCapitalROI)} />
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-navy-500">{label}</span>
      <span
        className={`text-sm font-semibold ${
          highlight ? "text-navy-900" : "text-navy-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
