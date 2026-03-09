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

interface TotalCostBarChartProps {
  options: OptionMetrics[];
}

function shortName(name: string) {
  const dash = name.indexOf(" — ");
  return dash !== -1 ? name.slice(0, dash) : name;
}

export function TotalCostBarChart({ options }: TotalCostBarChartProps) {
  const data = options.map((opt, i) => ({
    name: shortName(opt.optionName),
    totalCost: Math.round(opt.totalOccupancyCost),
    fill: OPTION_COLORS[i % OPTION_COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, bottom: 40, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e4" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: "#5c5c56" }}
          tickLine={false}
          axisLine={false}
          angle={-15}
          textAnchor="end"
          height={60}
        />
        <YAxis
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11, fill: "#5c5c56" }}
          tickLine={false}
          axisLine={false}
          width={60}
        />
        <Tooltip
          formatter={(value: number | undefined) => [formatCurrency(value ?? 0), "Total Cost"]}
          contentStyle={{ fontSize: 13, borderRadius: "8px", border: "1px solid #e8e8e4" }}
          cursor={{ fill: "#f7f7f5" }}
        />
        <Bar dataKey="totalCost" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
