"use client";

import { useEffect, useState } from "react";
import type { ComparisonResult } from "@/engine/types";
import type { ROIOutputs } from "@/types/survey";
import { ROIInsightsPanel, type ROICalcInputs } from "@/components/results/ROIInsightsPanel";
import { BenchmarkComparison } from "@/components/results/BenchmarkComparison";
import { LeasePlayground, type PlaygroundDefaults, type PlaygroundROIInputs } from "@/components/playground/LeasePlayground";
import { Spinner } from "@/components/ui/Spinner";

interface MyROIData {
  dealId: string;
  dealName: string;
  clientName: string;
  industry: string | null;
  comparisonResults: ComparisonResult | null;
  roiOutputs: ROIOutputs | null;
  roiCalcInputs: ROICalcInputs | null;
  industryType: string | null;
  industryInputs: Record<string, unknown> | null;
  surveyData: {
    headcount: number | null;
    annualRevenue: number | null;
    revenuePerEmployee: number | null;
    sfPerEmployee: number | null;
    budgetConstraint: number | null;
    primaryGoal: string | null;
  } | null;
}

function formatCurrency(value?: number | null): string {
  if (value === undefined || value === null) return "N/A";
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export default function ROIPage() {
  const [data, setData] = useState<MyROIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/my-roi");
        if (res.status === 404) {
          setError("no-data");
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError((body as { error?: string }).error ?? "Failed to load data.");
          return;
        }
        setData(await res.json());
      } catch {
        setError("Failed to connect. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Empty state for brokers or clients without survey data
  if (error === "no-data" || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-navy-100">
            <svg className="h-7 w-7 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-navy-900">ROI Analysis</h1>
          <p className="mt-2 text-sm text-navy-500">
            Complete a business needs assessment to see your personalized ROI analysis with industry benchmarks and a lease playground.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-navy-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-navy-500">{error}</p>
        </div>
      </div>
    );
  }

  // Build playground defaults from deal/ROI data
  const ci = data.roiCalcInputs;
  const playgroundDefaults: PlaygroundDefaults = {
    baseRentPerSF: ci?.costAvoidance?.proposedRentPerSF ?? 35,
    rentableSF: ci?.costAvoidance?.rentableSF ?? 5000,
    termMonths: ci?.costAvoidance?.termMonths ?? 60,
    escalationPercent: ci?.costAvoidance?.proposedEscalationPercent ?? 3.0,
    freeRentMonths: ci?.capital?.freeRentMonths ?? 3,
    tiAllowance: ci?.capital?.tiAllowance ?? 200_000,
    estimatedBuildoutCost: ci?.capital?.estimatedBuildoutCost ?? 300_000,
    headcount: data.surveyData?.headcount ?? ci?.costAvoidance?.headcount ?? 25,
    annualRevenue: data.surveyData?.annualRevenue ?? ci?.productivity?.annualRevenue ?? 5_000_000,
  };

  const playgroundROIInputs: PlaygroundROIInputs | null = ci ? {
    costAvoidance: ci.costAvoidance,
    productivity: ci.productivity,
    strategic: ci.strategic,
    capital: ci.capital,
    industryType: data.industryType ?? "GENERAL_OFFICE",
    industryInputs: data.industryInputs ?? {},
  } : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-navy-900">
          Your ROI Analysis
        </h1>
        <p className="mt-0.5 text-sm text-navy-500">{data.clientName}</p>
      </div>

      {/* ROI Highlight Cards */}
      {data.roiOutputs && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ROIHighlightCard
            label="Cost Avoidance"
            value={formatCurrency(data.roiOutputs.costAvoidance?.fiveYearSavings)}
            description="5-year savings from lease optimization"
          />
          <ROIHighlightCard
            label="Productivity Impact"
            value={formatCurrency(data.roiOutputs.productivity?.annualProductivityDollarGain)}
            description="Annual revenue impact"
          />
          <ROIHighlightCard
            label="Strategic Score"
            value={`${data.roiOutputs.strategic?.compositeStrategicScore?.toFixed(1) ?? "N/A"}/10`}
            description="Location & brand value"
          />
          <ROIHighlightCard
            label="Capital Efficiency"
            value={formatCurrency(data.roiOutputs.capital?.totalCapitalBenefit)}
            description="Capital preserved via incentives"
          />
        </div>
      )}

      {/* Benchmark Comparison */}
      {data.industryType && data.surveyData && (
        <BenchmarkComparison
          industryType={data.industryType}
          userData={data.surveyData}
          industryInputs={data.industryInputs}
        />
      )}

      {/* ROI Deep Dive */}
      {data.roiOutputs && (
        <ROIInsightsPanel
          roiOutputs={data.roiOutputs}
          roiCalcInputs={data.roiCalcInputs}
          industryType={data.industryType}
        />
      )}

      {/* Lease Playground */}
      <LeasePlayground
        defaults={playgroundDefaults}
        roiCalcInputs={playgroundROIInputs}
        originalROI={data.roiOutputs}
      />

      <p className="text-center text-xs text-navy-400">
        This analysis was generated by AI based on your survey responses.
        Results are estimates and should be validated by your broker.
      </p>
    </div>
  );
}

function ROIHighlightCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-navy-900">{value}</p>
      <p className="mt-0.5 text-xs text-navy-400">{description}</p>
    </div>
  );
}
