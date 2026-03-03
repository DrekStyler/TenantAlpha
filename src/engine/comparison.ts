import type { OptionMetrics, ComparisonResult } from "./types";

/**
 * Compare multiple lease options and produce rankings.
 */
export function compareOptions(
  options: OptionMetrics[]
): ComparisonResult {
  if (options.length === 0) {
    return {
      options: [],
      rankedByEffectiveRent: [],
      rankedByNPV: [],
      bestValueOption: "",
      bestValueReasons: [],
    };
  }

  // Rank by effective rent (lowest first)
  const byEffectiveRent = [...options].sort(
    (a, b) => a.effectiveRentPerSF - b.effectiveRentPerSF
  );
  const rankedByEffectiveRent = byEffectiveRent.map((o) => o.optionName);

  // Rank by NPV (lowest first = best value)
  const byNPV = [...options].sort((a, b) => a.npvOfCosts - b.npvOfCosts);
  const rankedByNPV = byNPV.map((o) => o.optionName);

  // Best value = lowest NPV
  const bestOption = byNPV[0];
  const bestValueOption = bestOption.optionName;

  // Generate reasons for the recommendation
  const bestValueReasons = generateReasons(bestOption, options);

  return {
    options,
    rankedByEffectiveRent,
    rankedByNPV,
    bestValueOption,
    bestValueReasons,
  };
}

function generateReasons(
  best: OptionMetrics,
  allOptions: OptionMetrics[]
): string[] {
  const reasons: string[] = [];
  const others = allOptions.filter((o) => o.optionName !== best.optionName);

  if (others.length === 0) return ["Only option analyzed."];

  // Reason 1: NPV advantage
  const avgOthersNPV =
    others.reduce((sum, o) => sum + o.npvOfCosts, 0) / others.length;
  const npvSavings = avgOthersNPV - best.npvOfCosts;
  if (npvSavings > 0) {
    reasons.push(
      `Lowest NPV of costs, saving $${Math.round(npvSavings).toLocaleString()} compared to the average of other options.`
    );
  }

  // Reason 2: Effective rent ranking
  const rentRank =
    [...allOptions]
      .sort((a, b) => a.effectiveRentPerSF - b.effectiveRentPerSF)
      .findIndex((o) => o.optionName === best.optionName) + 1;
  if (rentRank === 1) {
    reasons.push(
      `Lowest effective rent at $${best.effectiveRentPerSF.toFixed(2)}/SF/year.`
    );
  } else {
    reasons.push(
      `Effective rent of $${best.effectiveRentPerSF.toFixed(2)}/SF/year (ranked #${rentRank}).`
    );
  }

  // Reason 3: TI gap or free rent advantage
  if (best.tiGap === 0 && others.some((o) => o.tiGap > 0)) {
    reasons.push("No out-of-pocket tenant improvement costs required.");
  } else if (best.totalFreeRentSavings > 0) {
    reasons.push(
      `$${Math.round(best.totalFreeRentSavings).toLocaleString()} in free rent savings.`
    );
  }

  // Reason 4: Total occupancy cost
  if (reasons.length < 3) {
    reasons.push(
      `Total occupancy cost of $${Math.round(best.totalOccupancyCost).toLocaleString()} over the lease term.`
    );
  }

  return reasons.slice(0, 3);
}
