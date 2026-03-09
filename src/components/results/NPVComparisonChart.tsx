"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { OptionMetrics } from "@/engine/types";
import { OPTION_COLORS } from "@/config/theme";
import { formatCurrency } from "@/lib/formatters";

interface NPVComparisonChartProps {
  options: OptionMetrics[];
}

function shortName(name: string) {
  const dash = name.indexOf(" — ");
  return dash !== -1 ? name.slice(0, dash) : name;
}

export function NPVComparisonChart({ options }: NPVComparisonChartProps) {
  const data = options.map((opt, i) => ({
    name: shortName(opt.optionName),
    npv: Math.round(opt.npvOfCosts),
    fill: OPTION_COLORS[i % OPTION_COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 20, bottom: 10, left: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e4" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11, fill: "#5c5c56" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12, fill: "#5c5c56" }}
          tickLine={false}
          axisLine={false}
          width={80}
        />
        <Tooltip
          formatter={(value: number | undefined) => [formatCurrency(value ?? 0), "NPV of Costs"]}
          contentStyle={{ fontSize: 13, borderRadius: "8px", border: "1px solid #e8e8e4" }}
          cursor={{ fill: "#f7f7f5" }}
        />
        <Bar dataKey="npv" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
