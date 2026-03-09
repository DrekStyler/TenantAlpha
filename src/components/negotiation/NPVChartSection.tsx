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
import type { ComparisonResult, CalculationConfig } from "@/engine/types";
import { OPTION_COLORS } from "@/config/theme";
import { formatCurrency } from "@/lib/formatters";
import { DISCOUNTING_MODES } from "@/lib/constants";

interface NPVChartSectionProps {
  results: ComparisonResult;
  config: CalculationConfig;
  onConfigChange: (config: CalculationConfig) => void;
}

function shortName(name: string) {
  const dash = name.indexOf(" — ");
  return dash !== -1 ? name.slice(0, dash) : name;
}

export function NPVChartSection({
  results,
  config,
  onConfigChange,
}: NPVChartSectionProps) {
  const data = results.options.map((opt, i) => ({
    name: shortName(opt.optionName),
    npv: Math.round(opt.npvOfCosts),
    totalCost: Math.round(opt.totalOccupancyCost),
    fill: OPTION_COLORS[i % OPTION_COLORS.length],
  }));

  const bestNPV = Math.min(...data.map((d) => d.npv));

  return (
    <div className="space-y-4">
      {/* Config toggles */}
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
            Discounting:
          </span>
          {DISCOUNTING_MODES.map((m) => (
            <label key={m.value} className="flex cursor-pointer items-center gap-1.5">
              <input
                type="radio"
                name="discounting"
                value={m.value}
                checked={config.discountingMode.frequency === m.value}
                onChange={() =>
                  onConfigChange({
                    ...config,
                    discountingMode: { frequency: m.value as "monthly" | "annual" },
                  })
                }
                className="accent-navy-900"
              />
              <span className="text-sm text-navy-700">{m.label}</span>
            </label>
          ))}
        </div>
        <label className="flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={config.includeTIInEffectiveRent}
            onChange={(e) =>
              onConfigChange({
                ...config,
                includeTIInEffectiveRent: e.target.checked,
              })
            }
            className="accent-navy-900"
          />
          <span className="text-sm text-navy-700">Include TI in Effective Rent</span>
        </label>
      </div>

      {/* Charts side by side */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* NPV Chart */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-navy-500">
            NPV of Costs
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e8e8e4"
                horizontal={false}
              />
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
                formatter={(value: number | undefined) => [
                  formatCurrency(value ?? 0),
                  "NPV of Costs",
                ]}
                contentStyle={{
                  fontSize: 13,
                  borderRadius: "8px",
                  border: "1px solid #e8e8e4",
                }}
                cursor={{ fill: "#f7f7f5" }}
              />
              <Bar dataKey="npv" radius={[0, 4, 4, 0]} isAnimationActive={true}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Total Occupancy Cost Chart */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-navy-500">
            Total Occupancy Cost
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e8e8e4"
                horizontal={false}
              />
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
                formatter={(value: number | undefined) => [
                  formatCurrency(value ?? 0),
                  "Total Cost",
                ]}
                contentStyle={{
                  fontSize: 13,
                  borderRadius: "8px",
                  border: "1px solid #e8e8e4",
                }}
                cursor={{ fill: "#f7f7f5" }}
              />
              <Bar
                dataKey="totalCost"
                radius={[0, 4, 4, 0]}
                isAnimationActive={true}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Best value callout */}
      {results.bestValueOption && (
        <div className="rounded-lg border border-navy-100 bg-navy-50/50 px-4 py-2.5 text-sm">
          <span className="font-semibold text-navy-900">Best Value: </span>
          <span className="text-navy-700">
            {shortName(results.bestValueOption)} — NPV {formatCurrency(bestNPV)}
          </span>
        </div>
      )}
    </div>
  );
}
