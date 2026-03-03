import type { ComparisonResult } from "@/engine/types";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/formatters";
import { OPTION_COLORS } from "@/config/theme";

interface MetricsSummaryTableProps {
  results: ComparisonResult;
}

function RankBadge({ rank }: { rank: number }) {
  return (
    <span title={rank === 1 ? "Lowest cost (best)" : `Ranked #${rank} by cost`}>
      <Badge variant={rank === 1 ? "success" : "default"} className="ml-1 text-xs">
        #{rank}
      </Badge>
    </span>
  );
}

export function MetricsSummaryTable({ results }: MetricsSummaryTableProps) {
  const { options, rankedByNPV, rankedByEffectiveRent, bestValueOption, bestValueReasons } =
    results;

  return (
    <div className="space-y-4">
      {/* Best Value Banner */}
      {bestValueOption ? (
        <div className="rounded-xl bg-navy-900 px-5 py-4 text-white">
          <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-navy-300">
            Best Value
          </div>
          <div className="mb-3 text-xl font-bold">{bestValueOption}</div>
          <ul className="space-y-1">
            {bestValueReasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-navy-100">
                <span className="mt-0.5 shrink-0 font-bold text-gold-400">✓</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-xl bg-navy-700 px-5 py-4 text-white">
          <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-navy-300">
            Result
          </div>
          <div className="text-xl font-bold">Options are tied — no clear winner on NPV</div>
        </div>
      )}

      {/* Metrics Table */}
      <div className="-mx-1 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b-2 border-navy-100">
              <th className="py-2.5 pl-2 pr-3 text-left font-semibold text-navy-600">
                Option
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy-600">
                Sq Ft
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy-600">
                Total Cost
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy-600">
                NPV of Costs
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy-600">
                Eff. Rent/SF
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy-600">
                Free Rent
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy-600">
                TI Gap
              </th>
            </tr>
          </thead>
          <tbody>
            {options.map((opt, i) => {
              const npvRank = rankedByNPV.indexOf(opt.optionName) + 1;
              const rentRank = rankedByEffectiveRent.indexOf(opt.optionName) + 1;
              const isBest = opt.optionName === bestValueOption;
              return (
                <tr
                  key={opt.optionName}
                  className={`border-b border-navy-50 transition-colors ${
                    isBest ? "bg-navy-50" : "hover:bg-navy-50/50"
                  }`}
                >
                  <td className="py-3 pl-2 pr-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: OPTION_COLORS[i % OPTION_COLORS.length] }}
                      />
                      <span
                        className={`font-medium ${
                          isBest ? "text-navy-900" : "text-navy-700"
                        }`}
                      >
                        {opt.optionName}
                      </span>
                      {isBest && <Badge variant="gold">Best</Badge>}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-navy-700">
                    {opt.rentableSF != null ? opt.rentableSF.toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-3 text-right text-navy-700">
                    {formatCurrency(opt.totalOccupancyCost)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-navy-700">{formatCurrency(opt.npvOfCosts)}</span>
                    <RankBadge rank={npvRank} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-navy-700">
                      ${opt.effectiveRentPerSF.toFixed(2)}
                    </span>
                    <RankBadge rank={rentRank} />
                  </td>
                  <td className="px-3 py-3 text-right text-navy-500">
                    {opt.totalFreeRentSavings > 0
                      ? formatCurrency(opt.totalFreeRentSavings)
                      : "—"}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {opt.tiGap > 0 ? (
                      <span className="font-medium text-amber-700">
                        {formatCurrency(opt.tiGap)}
                      </span>
                    ) : (
                      <span className="text-navy-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
