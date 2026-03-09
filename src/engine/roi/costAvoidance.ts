import type { CostAvoidanceROI, CostAvoidanceInput } from "./types";

/**
 * Calculate annual rent savings from negotiated lower escalation over the term.
 */
export function calculateEscalationSavings(
  currentRentPerSF: number,
  proposedRentPerSF: number,
  currentEscalation: number,
  proposedEscalation: number,
  rentableSF: number,
  termMonths: number
): number {
  const years = Math.ceil(termMonths / 12);
  let totalSavings = 0;

  for (let y = 0; y < years; y++) {
    const currentYearRent =
      currentRentPerSF * Math.pow(1 + currentEscalation / 100, y) * rentableSF;
    const proposedYearRent =
      proposedRentPerSF * Math.pow(1 + proposedEscalation / 100, y) * rentableSF;
    const diff = currentYearRent - proposedYearRent;
    if (diff > 0) totalSavings += diff;
  }

  return totalSavings;
}

/**
 * Calculate the cost of business downtime during relocation.
 */
export function calculateDowntimeCostAvoided(
  headcount: number,
  revenuePerEmployee: number,
  downtimeDays: number
): number {
  const dailyRevenuePerEmployee = revenuePerEmployee / 260; // ~260 working days/year
  return headcount * dailyRevenuePerEmployee * downtimeDays;
}

/**
 * Calculate operational efficiency gains from better space layout.
 * Uses industry benchmarks for the baseline productivity uplift.
 */
export function calculateOperationalEfficiency(
  annualRevenue: number,
  efficiencyGainPercent: number
): number {
  return annualRevenue * (efficiencyGainPercent / 100);
}

/**
 * Calculate complete Cost Avoidance ROI.
 */
export function calculateCostAvoidanceROI(
  input: CostAvoidanceInput
): CostAvoidanceROI {
  const escalationSavings = calculateEscalationSavings(
    input.currentRentPerSF,
    input.proposedRentPerSF,
    input.currentEscalationPercent,
    input.proposedEscalationPercent,
    input.rentableSF,
    input.termMonths
  );

  const downtimeCostAvoided = calculateDowntimeCostAvoided(
    input.headcount,
    input.revenuePerEmployee,
    input.estimatedDowntimeDays
  );

  // OpEx savings over the term
  const annualOpExSavings =
    (input.currentOpExPerSF - input.proposedOpExPerSF) * input.rentableSF;
  const operationalEfficiencyGain = Math.max(0, annualOpExSavings);

  const years = Math.ceil(input.termMonths / 12);
  const annualSavings =
    escalationSavings / years + operationalEfficiencyGain;
  const fiveYearSavings = annualSavings * Math.min(5, years);

  // ROI = total savings / total cost invested (moving + downtime)
  const totalInvestment = downtimeCostAvoided > 0 ? downtimeCostAvoided : 1;
  const roiPercent =
    ((escalationSavings + operationalEfficiencyGain * years) / totalInvestment) *
    100;

  return {
    escalationSavings,
    downtimeCostAvoided,
    operationalEfficiencyGain,
    annualSavings,
    fiveYearSavings,
    roiPercent: Math.round(roiPercent * 10) / 10,
  };
}
