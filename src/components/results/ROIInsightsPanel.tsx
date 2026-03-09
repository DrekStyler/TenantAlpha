"use client";

import { useState } from "react";
import type { ROIOutputs } from "@/types/survey";
import type { CostAvoidanceInput, ProductivityInput, StrategicInput, CapitalInput } from "@/engine/roi/types";

export interface ROICalcInputs {
  costAvoidance: CostAvoidanceInput;
  productivity: ProductivityInput;
  strategic: StrategicInput;
  capital: CapitalInput;
}

interface ROIInsightsPanelProps {
  roiOutputs: ROIOutputs;
  roiCalcInputs?: ROICalcInputs | null;
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

function fmt(value?: number): string {
  if (value === undefined || value === null) return "N/A";
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function fmtExact(value?: number): string {
  if (value === undefined || value === null) return "N/A";
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtNum(value?: number, decimals = 1): string {
  if (value === undefined || value === null) return "N/A";
  return value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtPct(value?: number): string {
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

// ── Info Button + Popover ────────────────────────────────────────

function InfoButton({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-navy-200 text-[10px] font-semibold leading-none text-navy-400 transition-colors hover:border-navy-400 hover:text-navy-600"
        aria-label="How this is calculated"
      >
        ?
      </button>
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Popover */}
          <div className="absolute right-0 top-6 z-50 w-72 rounded-lg border border-navy-100 bg-white p-3 shadow-lg sm:w-80">
            <div className="space-y-1.5 text-[11px] leading-relaxed text-navy-600">
              {children}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CalcLine({ label, formula }: { label: string; formula: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-navy-400">{label}</span>
      <span className="font-mono text-navy-700">{formula}</span>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────

export function ROIInsightsPanel({ roiOutputs, roiCalcInputs, industryType }: ROIInsightsPanelProps) {
  const { costAvoidance, productivity, strategic, capital } = roiOutputs;
  const industryLabel = industryType ? INDUSTRY_LABELS[industryType] ?? industryType : "your industry";
  const ci = roiCalcInputs;

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {/* Cost Avoidance */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-navy-900">
              Cost Avoidance
            </h3>
            <p className="mt-1 text-xs text-navy-400">
              Savings from optimized lease terms vs. market conditions
            </p>
          </div>
          {ci && (
            <InfoButton>
              <p className="mb-1.5 font-semibold text-navy-700">How Cost Avoidance is calculated</p>
              <CalcLine label="Current Rent" formula={`${fmtNum(ci.costAvoidance.currentRentPerSF, 2)}/SF/yr`} />
              <CalcLine label="Proposed Rent" formula={`${fmtNum(ci.costAvoidance.proposedRentPerSF, 2)}/SF/yr`} />
              <CalcLine label="Rentable SF" formula={fmtNum(ci.costAvoidance.rentableSF, 0)} />
              <CalcLine label="Term" formula={`${ci.costAvoidance.termMonths} months`} />
              <CalcLine label="Current Escalation" formula={`${fmtNum(ci.costAvoidance.currentEscalationPercent)}%/yr`} />
              <CalcLine label="Proposed Escalation" formula={`${fmtNum(ci.costAvoidance.proposedEscalationPercent)}%/yr`} />
              <div className="mt-1 border-t border-navy-100 pt-1">
                <CalcLine label="Current OpEx" formula={`${fmtNum(ci.costAvoidance.currentOpExPerSF, 2)}/SF`} />
                <CalcLine label="Proposed OpEx" formula={`${fmtNum(ci.costAvoidance.proposedOpExPerSF, 2)}/SF`} />
                <CalcLine label="OpEx Savings" formula={`${fmtNum(ci.costAvoidance.currentOpExPerSF - ci.costAvoidance.proposedOpExPerSF, 2)}/SF × ${fmtNum(ci.costAvoidance.rentableSF, 0)} SF`} />
              </div>
              <div className="mt-1 border-t border-navy-100 pt-1">
                <CalcLine label="Headcount" formula={fmtNum(ci.costAvoidance.headcount, 0)} />
                <CalcLine label="Rev/Employee" formula={fmtExact(ci.costAvoidance.revenuePerEmployee)} />
                <CalcLine label="Downtime Days" formula={`${ci.costAvoidance.estimatedDowntimeDays}`} />
                <CalcLine label="Downtime Cost" formula={`${ci.costAvoidance.headcount} × ${fmtExact(ci.costAvoidance.revenuePerEmployee / 260)}/day × ${ci.costAvoidance.estimatedDowntimeDays}d`} />
              </div>
            </InfoButton>
          )}
        </div>
        <div className="mt-4 space-y-3">
          <Metric label="Annual Savings" value={fmt(costAvoidance.annualSavings)} />
          <Metric label="5-Year Savings" value={fmt(costAvoidance.fiveYearSavings)} />
          <Metric label="Escalation Savings" value={fmt(costAvoidance.escalationSavings)} />
          <Metric label="Downtime Cost Avoided" value={fmt(costAvoidance.downtimeCostAvoided)} />
          <Metric label="Operational Efficiency Gain" value={fmt(costAvoidance.operationalEfficiencyGain)} />
          <Metric label="Cost Avoidance ROI" value={fmtPct(costAvoidance.roiPercent)} highlight />
        </div>
      </div>

      {/* Productivity */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-navy-900">
              Productivity Impact
            </h3>
            <p className="mt-1 text-xs text-navy-400">
              Revenue uplift from better space design for {industryLabel}
            </p>
          </div>
          {ci && (
            <InfoButton>
              <p className="mb-1.5 font-semibold text-navy-700">How Productivity is calculated</p>
              <CalcLine label="Headcount" formula={fmtNum(ci.productivity.headcount, 0)} />
              <CalcLine label="Annual Revenue" formula={fmtExact(ci.productivity.annualRevenue)} />
              <CalcLine label="Rev/Employee" formula={fmtExact(ci.productivity.revenuePerEmployee)} />
              <CalcLine label="Avg Salary" formula={fmtExact(ci.productivity.avgEmployeeSalary)} />
              <CalcLine label="Current Turnover" formula={`${fmtNum(ci.productivity.currentEmployeeTurnover)}%`} />
              <div className="mt-1 border-t border-navy-100 pt-1">
                <CalcLine label="Current SF/Employee" formula={fmtNum(ci.productivity.currentSFPerEmployee, 0)} />
                <CalcLine label="Proposed SF/Employee" formula={fmtNum(ci.productivity.proposedSFPerEmployee, 0)} />
                <CalcLine label="Private Offices" formula={ci.productivity.hasPrivateOffices ? "Yes" : "No"} />
                <CalcLine label="Collab Zones" formula={ci.productivity.hasCollaborationZones ? "Yes" : "No"} />
                <CalcLine label="Amenities" formula={ci.productivity.hasAmenities ? "Yes (3+)" : "No"} />
                <CalcLine label="Transit Access" formula={ci.productivity.transitAccessible ? "Yes" : "No"} />
              </div>
              <div className="mt-1 border-t border-navy-100 pt-1">
                <CalcLine label="Productivity Gain" formula={`${fmtNum(productivity.productivityGainPercent)}%`} />
                <CalcLine label="Churn Reduction" formula={`${fmtNum((ci.productivity.currentEmployeeTurnover / 100) * ci.productivity.headcount, 1)} departures × ${fmtExact(ci.productivity.avgEmployeeSalary * 1.5)} replacement cost`} />
              </div>
            </InfoButton>
          )}
        </div>
        <div className="mt-4 space-y-3">
          <Metric
            label="Current Rev / Employee"
            value={fmt(productivity.currentRevenuePerEmployee)}
          />
          <Metric
            label="Projected Rev / Employee"
            value={fmt(productivity.projectedRevenuePerEmployee)}
          />
          <Metric
            label="Productivity Gain"
            value={fmtPct(productivity.productivityGainPercent)}
          />
          <Metric
            label="Annual Revenue Impact"
            value={fmt(productivity.annualProductivityDollarGain)}
            highlight
          />
          <Metric label="Collaboration Impact" value={fmt(productivity.collaborationImpact)} />
          <Metric label="Churn Reduction Savings" value={fmt(productivity.churnReductionSavings)} />
        </div>
      </div>

      {/* Strategic */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-navy-900">
              Strategic Value
            </h3>
            <p className="mt-1 text-xs text-navy-400">
              Location and brand impact scores for {industryLabel}
            </p>
          </div>
          {ci && (
            <InfoButton>
              <p className="mb-1.5 font-semibold text-navy-700">How Strategic Scores are calculated</p>
              <CalcLine label="Walk Score" formula={`${ci.strategic.walkScore}/100`} />
              <CalcLine label="Transit Access" formula={ci.strategic.transitAccess ? "Yes" : "No"} />
              <CalcLine label="Amenity Count" formula={`${ci.strategic.amenityCount}`} />
              <CalcLine label="Building Class" formula={ci.strategic.buildingClass} />
              <CalcLine label="Submarket" formula={ci.strategic.submarketPrestige} />
              <CalcLine label="Signage" formula={ci.strategic.signageAvailable ? "Yes" : "No"} />
              <div className="mt-1 border-t border-navy-100 pt-1">
                <p className="text-navy-400">Composite = Talent(35%) + Client(25%) + Market(20%) + Regulatory(20%)</p>
              </div>
              <div className="mt-1 border-t border-navy-100 pt-1">
                <CalcLine label="Annual Revenue" formula={fmtExact(ci.strategic.annualRevenue)} />
                <CalcLine label="Impact Factor" formula={`(${fmtNum(strategic.compositeStrategicScore)} − 5) / 100 = ${fmtNum((strategic.compositeStrategicScore - 5) / 100, 3)}`} />
                <CalcLine label="Revenue Impact" formula={fmt(strategic.estimatedRevenueImpact)} />
              </div>
            </InfoButton>
          )}
        </div>
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
            value={fmt(strategic.estimatedRevenueImpact)}
            highlight
          />
        </div>
      </div>

      {/* Capital */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-navy-900">
              Capital Efficiency
            </h3>
            <p className="mt-1 text-xs text-navy-400">
              Incentives and capital preserved through lease negotiation
            </p>
          </div>
          {ci && (
            <InfoButton>
              <p className="mb-1.5 font-semibold text-navy-700">How Capital Efficiency is calculated</p>
              <CalcLine label="TI Allowance" formula={fmtExact(ci.capital.tiAllowance)} />
              <CalcLine label="Buildout Cost" formula={fmtExact(ci.capital.estimatedBuildoutCost)} />
              <CalcLine label="Free Rent Months" formula={`${ci.capital.freeRentMonths}`} />
              <CalcLine label="Monthly Base Rent" formula={fmtExact(ci.capital.monthlyBaseRent)} />
              <CalcLine label="Moving Costs" formula={fmtExact(ci.capital.movingCosts)} />
              <CalcLine label="Furniture & IT" formula={fmtExact(ci.capital.furnitureIT)} />
              <div className="mt-1 border-t border-navy-100 pt-1">
                <CalcLine label="Capital Preserved" formula={`min(${fmtExact(ci.capital.tiAllowance)}, ${fmtExact(ci.capital.estimatedBuildoutCost)})`} />
                <CalcLine label="Free Rent Value" formula={`${ci.capital.freeRentMonths} × ${fmtExact(ci.capital.monthlyBaseRent)}`} />
                <CalcLine label="TI Gap" formula={`max(0, ${fmtExact(ci.capital.estimatedBuildoutCost)} − ${fmtExact(ci.capital.tiAllowance)})`} />
                <CalcLine label="Out-of-Pocket" formula={`TI gap + ${fmtExact(ci.capital.movingCosts)} + ${fmtExact(ci.capital.furnitureIT)}`} />
              </div>
            </InfoButton>
          )}
        </div>
        <div className="mt-4 space-y-3">
          <Metric label="TI Dollars Received" value={fmt(capital.tiDollarsReceived)} />
          <Metric label="Capital Preserved" value={fmt(capital.tenantCapitalPreserved)} />
          <Metric label="Free Rent Value" value={fmt(capital.freeRentWorkingCapitalSaved)} />
          <Metric label="Total Capital Benefit" value={fmt(capital.totalCapitalBenefit)} highlight />
          <Metric label="Tenant Out-of-Pocket" value={fmt(capital.tenantOutOfPocket)} />
          <Metric label="Capital ROI" value={fmtPct(capital.effectiveCapitalROI)} />
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
