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
    <div className="space-y-6">
      {/* Best Value Banner */}
      {bestValueOption ? (
        <div className="rounded-xl bg-navy-900 px-6 py-5 text-white">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-navy-300">
            Best Value
          </div>
          <div className="mb-4 text-xl font-bold tracking-tight">{bestValueOption}</div>
          <ul className="space-y-2">
            {bestValueReasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-navy-100">
                <span className="mt-0.5 shrink-0 font-bold text-gold-400">&mdash;</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-xl bg-navy-700 px-6 py-5 text-white">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-navy-300">
            Result
          </div>
          <div className="text-xl font-bold tracking-tight">Options are tied — no clear winner on NPV</div>
        </div>
      )}

      {/* Metrics Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-navy-200">
              <th className="py-3 pl-1 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-navy-500">
                Option
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-navy-500">
                Sq Ft
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-navy-500">
                Total Cost
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-navy-500">
                NPV of Costs
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-navy-500">
                Eff. Rent/SF
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-navy-500">
                Free Rent
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-navy-500">
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
                    isBest ? "bg-navy-50/80" : "hover:bg-navy-50/40"
                  }`}
                >
                  <td className="py-3.5 pl-1 pr-4">
                    <div className="flex items-center gap-2.5">
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
                  <td className="px-4 py-3.5 text-right tabular-nums text-navy-700">
                    {opt.rentableSF != null ? opt.rentableSF.toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-navy-700">
                    {formatCurrency(opt.totalOccupancyCost)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="tabular-nums text-navy-700">{formatCurrency(opt.npvOfCosts)}</span>
                    <RankBadge rank={npvRank} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="tabular-nums text-navy-700">
                      ${opt.effectiveRentPerSF.toFixed(2)}
                    </span>
                    <RankBadge rank={rentRank} />
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-navy-500">
                    {opt.totalFreeRentSavings > 0
                      ? formatCurrency(opt.totalFreeRentSavings)
                      : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {opt.tiGap > 0 ? (
                      <span className="tabular-nums font-medium text-red-600">
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
