"use client";

import { useState } from "react";
import type { ComparisonResult } from "@/engine/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { MetricsSummaryTable } from "./MetricsSummaryTable";
import { ComparisonTable } from "./ComparisonTable";
import { AnnualCashFlowTable } from "./AnnualCashFlowTable";
import { TotalCostBarChart } from "./TotalCostBarChart";
import { AnnualCashFlowLineChart } from "./AnnualCashFlowLineChart";
import { NPVComparisonChart } from "./NPVComparisonChart";
import { AISummary } from "@/components/ai/AISummary";
import { AIChatWindow } from "@/components/ai/AIChatWindow";
import { LocationTab } from "./LocationTab";

interface ResultsDashboardProps {
  dealId: string;
  dealName: string;
  results: ComparisonResult;
}

const TABS = ["Summary", "Cash Flows", "Comparison", "AI Assistant", "Location"] as const;
type Tab = (typeof TABS)[number];

export function ResultsDashboard({ dealId, dealName, results }: ResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Summary");

  return (
    <div className="space-y-8">
      {/* Tab Bar */}
      <div className="-mb-px flex overflow-x-auto border-b border-navy-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-navy-900 text-navy-900"
                : "border-transparent text-navy-400 hover:text-navy-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Summary Tab */}
      {activeTab === "Summary" && (
        <div className="space-y-8">
          <Card>
            <CardHeader title="Rankings & Key Metrics" subtitle={dealName} />
            <MetricsSummaryTable results={results} />
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card padding="sm">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-navy-500">
                Total Occupancy Cost
              </h3>
              <TotalCostBarChart options={results.options} />
            </Card>
            <Card padding="sm">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-navy-500">
                NPV of Costs
              </h3>
              <NPVComparisonChart options={results.options} />
            </Card>
          </div>

          <Card>
            <CardHeader title="Executive Summary" />
            <AISummary dealId={dealId} calculationResults={results} />
          </Card>
        </div>
      )}

      {/* Cash Flows Tab */}
      {activeTab === "Cash Flows" && (
        <div className="space-y-8">
          <Card padding="sm">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-navy-500">
              Annual Cost Trend
            </h3>
            <AnnualCashFlowLineChart options={results.options} />
          </Card>

          <Card>
            <CardHeader
              title="Year-by-Year Cash Flow"
              subtitle="Select an option to view its annual breakdown"
            />
            <AnnualCashFlowTable results={results} />
          </Card>
        </div>
      )}

      {/* Comparison Tab */}
      {activeTab === "Comparison" && (
        <Card>
          <CardHeader
            title="Side-by-Side Comparison"
            subtitle="All metrics across options — best value highlighted"
          />
          <ComparisonTable results={results} />
        </Card>
      )}

      {/* AI Assistant Tab */}
      {activeTab === "AI Assistant" && (
        <Card>
          <CardHeader
            title="AI Lease Advisor"
            subtitle="Ask questions about this analysis"
          />
          <AIChatWindow dealId={dealId} calculationResults={results} />
        </Card>
      )}

      {/* Location Tab */}
      {activeTab === "Location" && (
        <Card>
          <CardHeader
            title="Location Intelligence"
            subtitle="Walk scores, drive scores, and nearby amenities for each option"
          />
          <LocationTab dealId={dealId} />
        </Card>
      )}
    </div>
  );
}
