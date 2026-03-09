"use client";

import { Card, CardHeader } from "@/components/ui/Card";
import type { CapitalROI } from "@/types/survey";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface CapitalSectionProps {
  data: CapitalROI;
}

export function CapitalSection({ data }: CapitalSectionProps) {
  const chartData = [
    { name: "TI Received", value: data.tiDollarsReceived, color: "#102a43" },
    { name: "Capital Preserved", value: data.tenantCapitalPreserved, color: "#486581" },
    { name: "Free Rent Savings", value: data.freeRentWorkingCapitalSaved, color: "#d4a017" },
    { name: "Out of Pocket", value: -data.tenantOutOfPocket, color: "#829ab1" },
  ];

  return (
    <Card>
      <CardHeader title="Capital ROI" />
      <div className="space-y-4 p-6 pt-0">
        {/* Waterfall-style Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "#627d98" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#627d98" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number | undefined) => v ? `$${Math.round(v / 1000)}K` : "$0"}
              />
              <Tooltip
                formatter={(value: number | undefined) => [
                  value ? `$${Math.abs(value).toLocaleString()}` : "$0",
                  "Amount",
                ]}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <MetricRow label="Total Benefit" value={`$${data.totalCapitalBenefit.toLocaleString()}`} highlight />
          <MetricRow label="Tenant Out-of-Pocket" value={`$${data.tenantOutOfPocket.toLocaleString()}`} />
          <MetricRow label="Capital ROI" value={`${data.effectiveCapitalROI.toFixed(1)}%`} highlight />
        </div>
      </div>
    </Card>
  );
}

function MetricRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-md bg-navy-50 px-3 py-2">
      <span className="text-xs text-navy-500">{label}</span>
      <span
        className={`text-sm font-semibold ${highlight ? "text-green-700" : "text-navy-900"}`}
      >
        {value}
      </span>
    </div>
  );
}
