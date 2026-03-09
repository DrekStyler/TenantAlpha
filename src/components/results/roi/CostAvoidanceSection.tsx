"use client";

import { Card, CardHeader } from "@/components/ui/Card";
import type { CostAvoidanceROI } from "@/types/survey";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { OPTION_COLORS } from "@/config/theme";

interface CostAvoidanceSectionProps {
  data: CostAvoidanceROI;
}

export function CostAvoidanceSection({ data }: CostAvoidanceSectionProps) {
  const chartData = [
    { name: "Escalation\nSavings", value: data.escalationSavings },
    { name: "Downtime\nAvoided", value: data.downtimeCostAvoided },
    { name: "Operational\nEfficiency", value: data.operationalEfficiencyGain },
  ];

  return (
    <Card>
      <CardHeader title="Cost Avoidance ROI" />
      <div className="space-y-4 p-6 pt-0">
        {/* Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "#5c5c56" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#5c5c56" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number | undefined) => v ? `$${Math.round(v / 1000)}K` : "$0"}
              />
              <Tooltip
                formatter={(value: number | undefined) => [
                  value ? `$${value.toLocaleString()}` : "$0",
                  "Savings",
                ]}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={OPTION_COLORS[i % OPTION_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <MetricRow label="Annual Savings" value={`$${data.annualSavings.toLocaleString()}`} />
          <MetricRow label="5-Year Savings" value={`$${data.fiveYearSavings.toLocaleString()}`} />
          <MetricRow label="ROI" value={`${data.roiPercent.toFixed(1)}%`} highlight />
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
