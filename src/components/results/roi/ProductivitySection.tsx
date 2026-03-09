"use client";

import { Card, CardHeader } from "@/components/ui/Card";
import type { ProductivityROI } from "@/types/survey";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ProductivitySectionProps {
  data: ProductivityROI;
}

export function ProductivitySection({ data }: ProductivitySectionProps) {
  const chartData = [
    { name: "Current Rev/Emp", value: data.currentRevenuePerEmployee },
    { name: "Projected Rev/Emp", value: data.projectedRevenuePerEmployee },
  ];

  const impactData = [
    { name: "Productivity\nGain", value: data.annualProductivityDollarGain },
    { name: "Collaboration\nImpact", value: data.collaborationImpact },
    { name: "Churn\nReduction", value: data.churnReductionSavings },
  ];

  return (
    <Card>
      <CardHeader title="Productivity ROI" />
      <div className="space-y-4 p-6 pt-0">
        {/* Revenue per Employee Comparison */}
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "#627d98" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number | undefined) => v ? `$${Math.round(v / 1000)}K` : "$0"}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: "#627d98" }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip
                formatter={(value: number | undefined) => [
                  value ? `$${value.toLocaleString()}` : "$0",
                  "Revenue/Employee",
                ]}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                <Cell fill="#829ab1" />
                <Cell fill="#102a43" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <MetricRow label="Productivity Gain" value={`+${data.productivityGainPercent.toFixed(1)}%`} highlight />
          <MetricRow label="Annual Impact" value={`$${data.annualProductivityDollarGain.toLocaleString()}`} />
          <MetricRow label="Collaboration" value={`$${data.collaborationImpact.toLocaleString()}`} />
          <MetricRow label="Churn Savings" value={`$${data.churnReductionSavings.toLocaleString()}`} />
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
