"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { OptionMetrics } from "@/engine/types";
import { OPTION_COLORS } from "@/config/theme";
import { formatCurrency } from "@/lib/formatters";

interface AnnualCashFlowLineChartProps {
  options: OptionMetrics[];
}

function shortName(name: string) {
  const dash = name.indexOf(" — ");
  return dash !== -1 ? name.slice(0, dash) : name;
}

export function AnnualCashFlowLineChart({ options }: AnnualCashFlowLineChartProps) {
  const maxYears = Math.max(...options.map((o) => o.annualCashFlows.length));

  // Pivot: [{year: "Yr 1", "Option A": 120000, "Option B": 95000, ...}]
  const data = Array.from({ length: maxYears }, (_, i) => {
    const row: Record<string, number | string> = { year: `Yr ${i + 1}` };
    options.forEach((opt) => {
      const cf = opt.annualCashFlows[i];
      if (cf != null) row[opt.optionName] = Math.round(cf.totalCost);
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e4" vertical={false} />
        <XAxis
          dataKey="year"
          tick={{ fontSize: 12, fill: "#5c5c56" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11, fill: "#5c5c56" }}
          tickLine={false}
          axisLine={false}
          width={60}
        />
        <Tooltip
          formatter={(value: number | undefined, name: string | undefined) => [
            formatCurrency(value ?? 0),
            shortName(name ?? ""),
          ]}
          contentStyle={{ fontSize: 13, borderRadius: "8px", border: "1px solid #e8e8e4" }}
        />
        <Legend
          formatter={shortName}
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        {options.map((opt, i) => (
          <Line
            key={opt.optionName}
            type="monotone"
            dataKey={opt.optionName}
            stroke={OPTION_COLORS[i % OPTION_COLORS.length]}
            strokeWidth={2.5}
            dot={{ r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
