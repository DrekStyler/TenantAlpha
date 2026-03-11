"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ROIHighlightCard } from "@/components/results/ROIHighlightCard";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import type { ROIOutputs } from "@/types/survey";

interface MeData {
  role: "client";
  clientId: string;
  clientName: string;
  company: string | null;
  broker: {
    name: string | null;
    brokerage: string | null;
    email: string;
  };
}

interface ClientDeal {
  id: string;
  dealName: string;
  status: string;
  propertyType: string;
  stage: string;
  createdAt: string;
  updatedAt: string;
  options: { optionName: string; rentableSF: number }[];
}

interface ROIData {
  roiOutputs: ROIOutputs | null;
}

const PROPERTY_LABELS: Record<string, string> = {
  OFFICE: "Office",
  RETAIL: "Retail",
  INDUSTRIAL: "Industrial",
  FLEX: "Flex",
  OTHER: "Other",
};

const STATUS_VARIANTS: Record<string, "default" | "success" | "warning" | "gold"> = {
  DRAFT: "default",
  CALCULATED: "success",
  EXPORTED: "gold",
  ARCHIVED: "warning",
};

function formatCurrency(value?: number | null): string {
  if (value === undefined || value === null) return "N/A";
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function ClientDashboard() {
  const [me, setMe] = useState<MeData | null>(null);
  const [deals, setDeals] = useState<ClientDeal[]>([]);
  const [roi, setRoi] = useState<ROIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [meRes, dealsRes, roiRes] = await Promise.all([
        fetch("/api/me"),
        fetch("/api/my-deals"),
        fetch("/api/my-roi"),
      ]);

      if (meRes.ok) setMe(await meRes.json());
      if (dealsRes.ok) setDeals(await dealsRes.json());
      if (roiRes.ok) setRoi(await roiRes.json());
      setLoading(false);
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

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-navy-900">
          Welcome back{me?.clientName ? `, ${me.clientName}` : ""}
        </h1>
        {me?.company && (
          <p className="mt-0.5 text-sm text-navy-500">{me.company}</p>
        )}
      </div>

      {/* ROI Summary Cards */}
      {roi?.roiOutputs && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-500">
              ROI Highlights
            </h2>
            <Link
              href="/roi"
              className="text-xs font-medium text-navy-600 hover:text-navy-900"
            >
              View full analysis &rarr;
            </Link>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ROIHighlightCard
              label="Cost Avoidance"
              value={formatCurrency(roi.roiOutputs.costAvoidance?.fiveYearSavings)}
              description="5-year savings from lease optimization"
            />
            <ROIHighlightCard
              label="Productivity Impact"
              value={formatCurrency(roi.roiOutputs.productivity?.annualProductivityDollarGain)}
              description="Annual revenue impact"
            />
            <ROIHighlightCard
              label="Strategic Score"
              value={`${roi.roiOutputs.strategic?.compositeStrategicScore?.toFixed(1) ?? "N/A"}/10`}
              description="Location & brand value"
            />
            <ROIHighlightCard
              label="Capital Efficiency"
              value={formatCurrency(roi.roiOutputs.capital?.totalCapitalBenefit)}
              description="Capital preserved via incentives"
            />
          </div>
        </section>
      )}

      {/* Your Deals */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-500">
          Your Deals
        </h2>
        <div className="mt-3">
          {deals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-navy-200 bg-white py-10 text-center shadow-sm">
              <p className="text-sm font-medium text-navy-900">No deals yet</p>
              <p className="mt-1 text-xs text-navy-500">
                Your broker will create deal analyses for you.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {deals.map((deal) => (
                <div
                  key={deal.id}
                  className="rounded-xl border border-navy-200 bg-white p-4 shadow-sm transition-colors hover:bg-navy-50/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-navy-900">
                          {deal.dealName}
                        </h3>
                        <Badge variant={STATUS_VARIANTS[deal.status] ?? "default"}>
                          {deal.status.charAt(0) + deal.status.slice(1).toLowerCase()}
                        </Badge>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-navy-500">
                        <span>{PROPERTY_LABELS[deal.propertyType] ?? deal.propertyType}</span>
                        <span>{deal.options.length} option{deal.options.length !== 1 ? "s" : ""}</span>
                        {deal.options[0] && (
                          <span>{deal.options[0].rentableSF.toLocaleString()} SF</span>
                        )}
                      </div>
                    </div>
                    {(deal.status === "CALCULATED" || deal.status === "EXPORTED") && (
                      <Link
                        href={`/deals/${deal.id}/results`}
                        className="shrink-0 rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-700 transition-colors hover:bg-navy-100"
                      >
                        View Results
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Broker Info Card */}
      {me?.broker && (me.broker.name || me.broker.brokerage) && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-500">
            Your Broker
          </h2>
          <div className="mt-3 rounded-xl border border-navy-200 bg-white p-5 shadow-sm">
            {me.broker.name && (
              <p className="font-medium text-navy-900">{me.broker.name}</p>
            )}
            {me.broker.brokerage && (
              <p className="mt-0.5 text-sm text-navy-500">{me.broker.brokerage}</p>
            )}
            {me.broker.email && (
              <a
                href={`mailto:${me.broker.email}`}
                className="mt-2 inline-block text-sm font-medium text-navy-600 underline decoration-navy-300 hover:text-navy-900"
              >
                {me.broker.email}
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
