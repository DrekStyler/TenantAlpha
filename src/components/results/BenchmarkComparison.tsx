"use client";

import { INDUSTRY_BENCHMARKS } from "@/engine/roi/benchmarks";

interface BenchmarkComparisonProps {
  industryType: string;
  userData: {
    headcount?: number | null;
    revenuePerEmployee?: number | null;
    sfPerEmployee?: number | null;
    annualRevenue?: number | null;
  };
  industryInputs?: Record<string, unknown> | null;
}

const INDUSTRY_LABELS: Record<string, string> = {
  MEDICAL: "Healthcare",
  LEGAL: "Legal",
  AEROSPACE_DEFENSE: "Aerospace & Defense",
  TECH: "Technology",
  FINANCIAL: "Financial Services",
  GENERAL_OFFICE: "General Office",
};

interface BenchmarkRow {
  label: string;
  userValue: string;
  benchmarkValue: string;
  deltaPercent: number | null; // positive = better, negative = worse
  lowerIsBetter?: boolean;
}

function fmt(value: number | null | undefined): string {
  if (value === undefined || value === null) return "N/A";
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function fmtNum(value: number | null | undefined, decimals = 0): string {
  if (value === undefined || value === null) return "N/A";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function pctDelta(user: number | null | undefined, benchmark: number): number | null {
  if (user === undefined || user === null || benchmark === 0) return null;
  return ((user - benchmark) / benchmark) * 100;
}

function DeltaBadge({ delta, lowerIsBetter }: { delta: number | null; lowerIsBetter?: boolean }) {
  if (delta === null) return <span className="text-xs text-navy-300">--</span>;
  const isGood = lowerIsBetter ? delta < -5 : delta > 5;
  const isBad = lowerIsBetter ? delta > 5 : delta < -5;
  const color = isGood
    ? "bg-green-50 text-green-700"
    : isBad
      ? "bg-red-50 text-red-600"
      : "bg-navy-50 text-navy-500";
  const sign = delta > 0 ? "+" : "";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${color}`}>
      {sign}{delta.toFixed(0)}%
    </span>
  );
}

export function BenchmarkComparison({ industryType, userData, industryInputs }: BenchmarkComparisonProps) {
  const benchmarks = INDUSTRY_BENCHMARKS[industryType as keyof typeof INDUSTRY_BENCHMARKS]
    ?? INDUSTRY_BENCHMARKS.GENERAL_OFFICE;
  const label = INDUSTRY_LABELS[industryType] ?? industryType;

  // Build universal rows
  const rows: BenchmarkRow[] = [];

  // Revenue per Employee
  const benchRevPerEmp = "avgRevenuePerEmployee" in benchmarks
    ? (benchmarks as Record<string, unknown>).avgRevenuePerEmployee as number
    : "avgRevenuePerEngineer" in benchmarks
      ? (benchmarks as Record<string, unknown>).avgRevenuePerEngineer as number
      : "avgRevenuePerPartner" in benchmarks
        ? (benchmarks as Record<string, unknown>).avgRevenuePerPartner as number
        : "avgRevenuePerAdvisor" in benchmarks
          ? (benchmarks as Record<string, unknown>).avgRevenuePerAdvisor as number
          : 250_000;

  rows.push({
    label: "Revenue / Employee",
    userValue: fmt(userData.revenuePerEmployee),
    benchmarkValue: fmt(benchRevPerEmp),
    deltaPercent: pctDelta(userData.revenuePerEmployee, benchRevPerEmp),
  });

  // SF per Employee
  const benchSFPerEmp = "avgSFPerEmployee" in benchmarks
    ? (benchmarks as Record<string, unknown>).avgSFPerEmployee as number
    : "sfPerEngineer" in benchmarks
      ? (benchmarks as Record<string, unknown>).sfPerEngineer as number
      : "sfPerAttorney" in benchmarks
        ? (benchmarks as Record<string, unknown>).sfPerAttorney as number
        : "sfPerAdvisor" in benchmarks
          ? (benchmarks as Record<string, unknown>).sfPerAdvisor as number
          : 180;

  rows.push({
    label: "SF / Employee",
    userValue: userData.sfPerEmployee != null ? `${fmtNum(userData.sfPerEmployee)} SF` : "N/A",
    benchmarkValue: `${fmtNum(benchSFPerEmp)} SF`,
    deltaPercent: pctDelta(userData.sfPerEmployee, benchSFPerEmp),
    lowerIsBetter: true,
  });

  // Turnover Rate
  const benchTurnover = "avgTurnoverRate" in benchmarks
    ? (benchmarks as Record<string, unknown>).avgTurnoverRate as number
    : 0.15;
  rows.push({
    label: "Employee Turnover",
    userValue: "N/A", // turnover not stored on Client directly — show benchmark context
    benchmarkValue: `${(benchTurnover * 100).toFixed(0)}%`,
    deltaPercent: null,
    lowerIsBetter: true,
  });

  // Avg Salary
  const benchSalary = "avgEmployeeSalary" in benchmarks
    ? (benchmarks as Record<string, unknown>).avgEmployeeSalary as number
    : "avgEngineerSalary" in benchmarks
      ? (benchmarks as Record<string, unknown>).avgEngineerSalary as number
      : "avgAssociateSalary" in benchmarks
        ? (benchmarks as Record<string, unknown>).avgAssociateSalary as number
        : "avgAdvisorSalary" in benchmarks
          ? (benchmarks as Record<string, unknown>).avgAdvisorSalary as number
          : 75_000;
  rows.push({
    label: "Avg Salary (Benchmark)",
    userValue: "--",
    benchmarkValue: fmt(benchSalary),
    deltaPercent: null,
  });

  // Industry-specific rows
  const industryRows: BenchmarkRow[] = [];
  if (industryInputs && typeof industryInputs === "object") {
    const inp = industryInputs as Record<string, unknown>;

    if (industryType === "MEDICAL") {
      const b = benchmarks as typeof INDUSTRY_BENCHMARKS.MEDICAL;
      if (inp.visitsPerProviderDay != null) {
        industryRows.push({
          label: "Visits / Provider / Day",
          userValue: fmtNum(inp.visitsPerProviderDay as number),
          benchmarkValue: fmtNum(b.avgVisitsPerProviderDay),
          deltaPercent: pctDelta(inp.visitsPerProviderDay as number, b.avgVisitsPerProviderDay),
        });
      }
      if (inp.reimbursementPerVisit != null) {
        industryRows.push({
          label: "Reimbursement / Visit",
          userValue: fmt(inp.reimbursementPerVisit as number),
          benchmarkValue: fmt(b.avgReimbursementPerVisit),
          deltaPercent: pctDelta(inp.reimbursementPerVisit as number, b.avgReimbursementPerVisit),
        });
      }
      if (inp.currentExamRoomUtilization != null) {
        industryRows.push({
          label: "Exam Room Utilization",
          userValue: `${fmtNum(inp.currentExamRoomUtilization as number)}%`,
          benchmarkValue: `${(b.avgExamRoomUtilization * 100).toFixed(0)}%`,
          deltaPercent: pctDelta(inp.currentExamRoomUtilization as number, b.avgExamRoomUtilization * 100),
        });
      }
    }

    if (industryType === "LEGAL") {
      const b = benchmarks as typeof INDUSTRY_BENCHMARKS.LEGAL;
      if (inp.billableHourTarget != null) {
        industryRows.push({
          label: "Billable Hours / Year",
          userValue: fmtNum(inp.billableHourTarget as number),
          benchmarkValue: fmtNum(b.avgBillableHoursPerYear),
          deltaPercent: pctDelta(inp.billableHourTarget as number, b.avgBillableHoursPerYear),
        });
      }
      if (inp.realizationRate != null) {
        industryRows.push({
          label: "Realization Rate",
          userValue: `${fmtNum(inp.realizationRate as number)}%`,
          benchmarkValue: `${(b.avgRealizationRate * 100).toFixed(0)}%`,
          deltaPercent: pctDelta(inp.realizationRate as number, b.avgRealizationRate * 100),
        });
      }
      if (inp.blendedBillingRate != null) {
        industryRows.push({
          label: "Blended Billing Rate",
          userValue: fmt(inp.blendedBillingRate as number),
          benchmarkValue: fmt(b.avgBlendedRate),
          deltaPercent: pctDelta(inp.blendedBillingRate as number, b.avgBlendedRate),
        });
      }
    }

    if (industryType === "TECH") {
      const b = benchmarks as typeof INDUSTRY_BENCHMARKS.TECH;
      if (inp.avgEngineerSalary != null) {
        industryRows.push({
          label: "Avg Engineer Salary",
          userValue: fmt(inp.avgEngineerSalary as number),
          benchmarkValue: fmt(b.avgEngineerSalary),
          deltaPercent: pctDelta(inp.avgEngineerSalary as number, b.avgEngineerSalary),
        });
      }
    }

    if (industryType === "FINANCIAL") {
      const b = benchmarks as typeof INDUSTRY_BENCHMARKS.FINANCIAL;
      if (inp.avgAdvisorRevenue != null) {
        industryRows.push({
          label: "Revenue / Advisor",
          userValue: fmt(inp.avgAdvisorRevenue as number),
          benchmarkValue: fmt(b.avgRevenuePerAdvisor),
          deltaPercent: pctDelta(inp.avgAdvisorRevenue as number, b.avgRevenuePerAdvisor),
        });
      }
      if (inp.aum != null) {
        industryRows.push({
          label: "AUM / Advisor",
          userValue: fmt((inp.aum as number) / ((inp.advisors as number) || 1)),
          benchmarkValue: fmt(b.avgAUMPerAdvisor),
          deltaPercent: pctDelta((inp.aum as number) / ((inp.advisors as number) || 1), b.avgAUMPerAdvisor),
        });
      }
    }

    if (industryType === "AEROSPACE_DEFENSE") {
      const b = benchmarks as typeof INDUSTRY_BENCHMARKS.AEROSPACE_DEFENSE;
      industryRows.push({
        label: "Avg Engineer Salary",
        userValue: "--",
        benchmarkValue: fmt(b.avgEngineerSalary),
        deltaPercent: null,
      });
    }
  }

  const allRows = [...rows, ...industryRows];

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wide text-navy-900">
        Your Business vs {label} Benchmarks
      </h3>
      <p className="mt-1 text-xs text-navy-400">
        How your survey answers compare to industry averages
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-navy-100">
              <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wide text-navy-400">Metric</th>
              <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wide text-navy-400">Your Value</th>
              <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wide text-navy-400">Industry Avg</th>
              <th className="pb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">vs Benchmark</th>
            </tr>
          </thead>
          <tbody>
            {allRows.map((row) => (
              <tr key={row.label} className="border-b border-navy-50">
                <td className="py-2.5 pr-4 text-xs font-medium text-navy-700">{row.label}</td>
                <td className="py-2.5 pr-4 text-xs font-semibold text-navy-900">{row.userValue}</td>
                <td className="py-2.5 pr-4 text-xs text-navy-500">{row.benchmarkValue}</td>
                <td className="py-2.5">
                  <DeltaBadge delta={row.deltaPercent} lowerIsBetter={row.lowerIsBetter} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
