"use client";

import type { ComparisonResult, OptionMetrics } from "@/engine/types";
import { formatCurrency, formatMonths } from "@/lib/formatters";
import { OPTION_COLORS } from "@/config/theme";

interface DerivedMetricsTableProps {
  results: ComparisonResult;
}

interface MetricRow {
  label: string;
  key: string;
  format: (opt: OptionMetrics) => string;
  highlight: "low" | "high";
}

const METRIC_ROWS: MetricRow[] = [
  {
    label: "Total Occupancy Cost",
    key: "totalOccupancyCost",
    format: (o) => formatCurrency(o.totalOccupancyCost),
    highlight: "low",
  },
  {
    label: "NPV of Costs",
    key: "npvOfCosts",
    format: (o) => formatCurrency(o.npvOfCosts),
    highlight: "low",
  },
  {
    label: "Effective Rent ($/SF/yr)",
    key: "effectiveRentPerSF",
    format: (o) => `$${(o.effectiveRentPerSF ?? 0).toFixed(2)}`,
    highlight: "low",
  },
  {
    label: "Effective Rent w/ TI ($/SF/yr)",
    key: "effectiveRentPerSFWithTI",
    format: (o) => `$${(o.effectiveRentPerSFWithTI ?? 0).toFixed(2)}`,
    highlight: "low",
  },
  {
    label: "Free Rent Savings",
    key: "totalFreeRentSavings",
    format: (o) =>
      o.totalFreeRentSavings > 0 ? formatCurrency(o.totalFreeRentSavings) : "—",
    highlight: "high",
  },
  {
    label: "TI Gap (Out-of-Pocket)",
    key: "tiGap",
    format: (o) => (o.tiGap > 0 ? formatCurrency(o.tiGap) : "—"),
    highlight: "low",
  },
  {
    label: "TI Payback Period",
    key: "paybackPeriodMonths",
    format: (o) =>
      o.paybackPeriodMonths != null ? formatMonths(o.paybackPeriodMonths) : "N/A",
    highlight: "low",
  },
  {
    label: "Cost per Employee / Year",
    key: "costPerEmployeePerYear",
    format: (o) =>
      o.costPerEmployeePerYear != null
        ? formatCurrency(o.costPerEmployeePerYear)
        : "N/A",
    highlight: "low",
  },
  {
    label: "Rent as % of Revenue",
    key: "rentAsPercentOfRevenue",
    format: (o) =>
      o.rentAsPercentOfRevenue != null
        ? `${(o.rentAsPercentOfRevenue ?? 0).toFixed(1)}%`
        : "N/A",
    highlight: "low",
  },
];

function shortName(name: string) {
  const dash = name.indexOf(" — ");
  return dash !== -1 ? name.slice(0, dash) : name;
}

export function DerivedMetricsTable({ results }: DerivedMetricsTableProps) {
  const { options } = results;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[500px] text-sm">
        <thead>
          <tr className="border-b border-navy-200">
            <th className="sticky left-0 z-10 bg-white py-3 pl-4 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-navy-500">
              Metric
            </th>
            {options.map((opt, i) => (
              <th
                key={opt.optionName}
                className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-navy-500"
              >
                <div className="flex items-center justify-end gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        OPTION_COLORS[i % OPTION_COLORS.length],
                    }}
                  />
                  <span>{shortName(opt.optionName)}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {METRIC_ROWS.map((row) => {
            // Determine best index
            let bestIdx: number | null = null;
            const vals = options.map((o) => {
              const v = o[row.key as keyof OptionMetrics];
              return typeof v === "number" ? v : null;
            });
            const validVals = vals.filter(
              (v): v is number => v !== null && v > 0
            );
            if (validVals.length > 0) {
              const target =
                row.highlight === "low"
                  ? Math.min(...validVals)
                  : Math.max(...validVals);
              bestIdx = vals.findIndex((v) => v === target);
            }

            return (
              <tr
                key={row.key}
                className="border-b border-navy-50 hover:bg-navy-50/30"
              >
                <td className="sticky left-0 z-10 bg-white py-2.5 pl-4 pr-4 font-medium text-navy-700">
                  {row.label}
                </td>
                {options.map((opt, i) => {
                  const isBest = bestIdx === i;
                  return (
                    <td
                      key={opt.optionName}
                      className={`px-3 py-2.5 text-right tabular-nums ${
                        isBest
                          ? "font-semibold text-navy-900"
                          : "text-navy-500"
                      }`}
                    >
                      {row.format(opt)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
