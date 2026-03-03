"use client";

import { useState } from "react";
import type { ComparisonResult } from "@/engine/types";
import { formatCurrency } from "@/lib/formatters";
import { OPTION_COLORS } from "@/config/theme";

interface AnnualCashFlowTableProps {
  results: ComparisonResult;
}

export function AnnualCashFlowTable({ results }: AnnualCashFlowTableProps) {
  const { options } = results;
  const [activeIdx, setActiveIdx] = useState(0);
  const activeOption = options[activeIdx];

  if (!activeOption) return null;

  return (
    <div>
      {/* Option Tabs */}
      {options.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {options.map((opt, i) => (
            <button
              key={opt.optionName}
              onClick={() => setActiveIdx(i)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeIdx === i
                  ? "bg-navy-900 text-white"
                  : "bg-navy-50 text-navy-600 hover:bg-navy-100"
              }`}
            >
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: activeIdx === i ? "white" : OPTION_COLORS[i % OPTION_COLORS.length] }}
              />
              {opt.optionName.split(" — ")[0] || opt.optionName}
            </button>
          ))}
        </div>
      )}

      {/* Cash Flow Table */}
      <div className="-mx-1 overflow-x-auto">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="border-b-2 border-navy-100">
              <th className="py-2.5 pl-2 pr-3 text-left font-semibold text-navy-600">
                Year
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy-600">
                Base Rent
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy-600">
                OpEx
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy-600">
                Parking
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy-600">
                Other
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy-600">
                Total
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy-600">
                Cumulative
              </th>
            </tr>
          </thead>
          <tbody>
            {activeOption.annualCashFlows.map((cf) => (
              <tr
                key={cf.year}
                className="border-b border-navy-50 hover:bg-navy-50/50"
              >
                <td className="py-2.5 pl-2 pr-3 font-medium text-navy-700">
                  Year {cf.year}
                </td>
                <td className="px-3 py-2.5 text-right text-navy-500">
                  {formatCurrency(cf.baseRent)}
                </td>
                <td className="px-3 py-2.5 text-right text-navy-500">
                  {cf.opEx > 0 ? formatCurrency(cf.opEx) : "—"}
                </td>
                <td className="px-3 py-2.5 text-right text-navy-500">
                  {cf.parking > 0 ? formatCurrency(cf.parking) : "—"}
                </td>
                <td className="px-3 py-2.5 text-right text-navy-500">
                  {cf.otherFees > 0 ? formatCurrency(cf.otherFees) : "—"}
                </td>
                <td className="px-3 py-2.5 text-right font-semibold text-navy-700">
                  {formatCurrency(cf.totalCost)}
                </td>
                <td className="px-3 py-2.5 text-right text-navy-400">
                  {formatCurrency(cf.cumulativeCost)}
                </td>
              </tr>
            ))}
            {/* Total row */}
            <tr className="border-t-2 border-navy-200 bg-navy-50">
              <td className="py-2.5 pl-2 pr-3 font-bold text-navy-800">Total</td>
              <td className="px-3 py-2.5 text-right font-semibold text-navy-700">
                {formatCurrency(
                  activeOption.annualCashFlows.reduce((s, c) => s + c.baseRent, 0)
                )}
              </td>
              <td className="px-3 py-2.5 text-right font-semibold text-navy-700">
                {activeOption.annualCashFlows.some((c) => c.opEx > 0)
                  ? formatCurrency(
                      activeOption.annualCashFlows.reduce((s, c) => s + c.opEx, 0)
                    )
                  : "—"}
              </td>
              <td className="px-3 py-2.5 text-right font-semibold text-navy-700">
                {activeOption.annualCashFlows.some((c) => c.parking > 0)
                  ? formatCurrency(
                      activeOption.annualCashFlows.reduce((s, c) => s + c.parking, 0)
                    )
                  : "—"}
              </td>
              <td className="px-3 py-2.5 text-right font-semibold text-navy-700">
                {activeOption.annualCashFlows.some((c) => c.otherFees > 0)
                  ? formatCurrency(
                      activeOption.annualCashFlows.reduce((s, c) => s + c.otherFees, 0)
                    )
                  : "—"}
              </td>
              <td className="px-3 py-2.5 text-right font-bold text-navy-900">
                {formatCurrency(activeOption.totalOccupancyCost)}
              </td>
              <td className="px-3 py-2.5 text-right text-navy-400">—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
