"use client";

import { useState, useMemo } from "react";
import { calculateOptionMetrics, calculateFullROI } from "@/engine";
import type { CalculationConfig, OptionMetrics } from "@/engine/types";
import type { FullROIInput, ROIOutputs, CostAvoidanceInput, ProductivityInput, StrategicInput, CapitalInput } from "@/engine/roi/types";
import { AnnualCashFlowLineChart } from "@/components/results/AnnualCashFlowLineChart";

export interface PlaygroundDefaults {
  baseRentPerSF: number;
  rentableSF: number;
  termMonths: number;
  escalationPercent: number;
  freeRentMonths: number;
  tiAllowance: number;
  estimatedBuildoutCost: number;
  headcount: number;
  annualRevenue: number;
}

export interface PlaygroundROIInputs {
  costAvoidance: CostAvoidanceInput;
  productivity: ProductivityInput;
  strategic: StrategicInput;
  capital: CapitalInput;
  industryType: string;
  industryInputs: Record<string, unknown>;
}

interface LeasePlaygroundProps {
  defaults: PlaygroundDefaults;
  roiCalcInputs?: PlaygroundROIInputs | null;
  originalROI?: ROIOutputs | null;
}

function fmt(value: number | undefined | null): string {
  if (value === undefined || value === null) return "N/A";
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function fmtPct(value: number | undefined | null): string {
  if (value === undefined || value === null) return "N/A";
  return `${value.toFixed(1)}%`;
}

function DeltaArrow({ current, original, lowerIsBetter }: { current: number; original: number; lowerIsBetter?: boolean }) {
  if (original === 0) return null;
  const diff = ((current - original) / Math.abs(original)) * 100;
  if (Math.abs(diff) < 0.5) return null;
  const isGood = lowerIsBetter ? diff < 0 : diff > 0;
  return (
    <span className={`ml-1.5 text-[11px] font-semibold ${isGood ? "text-green-600" : "text-red-500"}`}>
      {diff > 0 ? "+" : ""}{diff.toFixed(1)}%
    </span>
  );
}

export function LeasePlayground({ defaults, roiCalcInputs, originalROI }: LeasePlaygroundProps) {
  const [baseRent, setBaseRent] = useState(defaults.baseRentPerSF);
  const [rentableSF, setRentableSF] = useState(defaults.rentableSF);
  const [termMonths, setTermMonths] = useState(defaults.termMonths);
  const [escalation, setEscalation] = useState(defaults.escalationPercent);
  const [freeRent, setFreeRent] = useState(defaults.freeRentMonths);
  const [tiAllowance, setTiAllowance] = useState(defaults.tiAllowance);
  const [buildoutCost, setBuildoutCost] = useState(defaults.estimatedBuildoutCost);

  const config: CalculationConfig = useMemo(() => ({
    discountingMode: { frequency: "monthly" },
    includeTIInEffectiveRent: false,
  }), []);

  // Calculate lease metrics from playground values
  const playgroundMetrics: OptionMetrics | null = useMemo(() => {
    try {
      return calculateOptionMetrics({
        optionName: "Playground",
        rentableSF,
        termMonths,
        baseRentY1: baseRent,
        escalationType: "FIXED_PERCENT",
        escalationPercent: escalation,
        freeRentMonths: freeRent,
        freeRentType: "ABATED",
        rentStructure: "GROSS",
        tiAllowance,
        estimatedBuildoutCost: buildoutCost,
        discountRate: 8.0,
        annualRevenue: defaults.annualRevenue || undefined,
        employees: defaults.headcount || undefined,
      }, config);
    } catch {
      return null;
    }
  }, [baseRent, rentableSF, termMonths, escalation, freeRent, tiAllowance, buildoutCost, defaults.annualRevenue, defaults.headcount, config]);

  // Calculate original metrics for comparison
  const originalMetrics: OptionMetrics | null = useMemo(() => {
    try {
      return calculateOptionMetrics({
        optionName: "Original",
        rentableSF: defaults.rentableSF,
        termMonths: defaults.termMonths,
        baseRentY1: defaults.baseRentPerSF,
        escalationType: "FIXED_PERCENT",
        escalationPercent: defaults.escalationPercent,
        freeRentMonths: defaults.freeRentMonths,
        freeRentType: "ABATED",
        rentStructure: "GROSS",
        tiAllowance: defaults.tiAllowance,
        estimatedBuildoutCost: defaults.estimatedBuildoutCost,
        discountRate: 8.0,
        annualRevenue: defaults.annualRevenue || undefined,
        employees: defaults.headcount || undefined,
      }, config);
    } catch {
      return null;
    }
  }, [defaults, config]);

  // Calculate updated ROI
  const playgroundROI: ROIOutputs | null = useMemo(() => {
    if (!roiCalcInputs) return null;
    try {
      const monthlyBaseRent = (baseRent * rentableSF) / 12;
      const updatedInput: FullROIInput = {
        costAvoidance: {
          ...roiCalcInputs.costAvoidance,
          proposedRentPerSF: baseRent,
          rentableSF,
          termMonths,
          proposedEscalationPercent: escalation,
        },
        productivity: { ...roiCalcInputs.productivity },
        strategic: { ...roiCalcInputs.strategic },
        capital: {
          ...roiCalcInputs.capital,
          tiAllowance,
          estimatedBuildoutCost: buildoutCost,
          freeRentMonths: freeRent,
          monthlyBaseRent,
        },
        industryType: roiCalcInputs.industryType as FullROIInput["industryType"],
        industryInputs: roiCalcInputs.industryInputs,
      };
      return calculateFullROI(updatedInput);
    } catch {
      return null;
    }
  }, [baseRent, rentableSF, termMonths, escalation, freeRent, tiAllowance, buildoutCost, roiCalcInputs]);

  // Chart data: show both original and playground lines
  const chartOptions = useMemo(() => {
    const opts: OptionMetrics[] = [];
    if (originalMetrics) opts.push({ ...originalMetrics, optionName: "Original Terms" });
    if (playgroundMetrics) opts.push({ ...playgroundMetrics, optionName: "Your Terms" });
    return opts;
  }, [originalMetrics, playgroundMetrics]);

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wide text-navy-900">
        Lease Playground
      </h3>
      <p className="mt-1 text-xs text-navy-400">
        Adjust lease terms to see how they impact your costs and ROI
      </p>

      {/* Input Form */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NumberInput label="Base Rent ($/SF/yr)" value={baseRent} onChange={setBaseRent} prefix="$" step={0.5} />
        <NumberInput label="Rentable SF" value={rentableSF} onChange={setRentableSF} step={100} />
        <NumberInput label="Term (months)" value={termMonths} onChange={setTermMonths} step={12} />
        <NumberInput label="Escalation %" value={escalation} onChange={setEscalation} suffix="%" step={0.5} />
        <NumberInput label="Free Rent (months)" value={freeRent} onChange={setFreeRent} step={1} />
        <NumberInput label="TI Allowance ($)" value={tiAllowance} onChange={setTiAllowance} prefix="$" step={5000} />
        <NumberInput label="Buildout Cost ($)" value={buildoutCost} onChange={setBuildoutCost} prefix="$" step={5000} />
      </div>

      {/* Key Metrics */}
      {playgroundMetrics && originalMetrics && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Effective Rent/SF"
            value={`$${playgroundMetrics.effectiveRentPerSF.toFixed(2)}`}
            original={originalMetrics.effectiveRentPerSF}
            current={playgroundMetrics.effectiveRentPerSF}
            lowerIsBetter
          />
          <MetricCard
            label="NPV of Costs"
            value={fmt(playgroundMetrics.npvOfCosts)}
            original={originalMetrics.npvOfCosts}
            current={playgroundMetrics.npvOfCosts}
            lowerIsBetter
          />
          <MetricCard
            label="Total Occupancy Cost"
            value={fmt(playgroundMetrics.totalOccupancyCost)}
            original={originalMetrics.totalOccupancyCost}
            current={playgroundMetrics.totalOccupancyCost}
            lowerIsBetter
          />
          <MetricCard
            label="Cost / Employee / Year"
            value={playgroundMetrics.costPerEmployeePerYear != null ? fmt(playgroundMetrics.costPerEmployeePerYear) : "N/A"}
            original={originalMetrics.costPerEmployeePerYear ?? 0}
            current={playgroundMetrics.costPerEmployeePerYear ?? 0}
            lowerIsBetter
          />
        </div>
      )}

      {/* ROI Impact */}
      {playgroundROI && originalROI && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <MetricCard
            label="Cost Avoidance ROI"
            value={fmtPct(playgroundROI.costAvoidance.roiPercent)}
            original={originalROI.costAvoidance.roiPercent}
            current={playgroundROI.costAvoidance.roiPercent}
          />
          <MetricCard
            label="Capital ROI"
            value={fmtPct(playgroundROI.capital.effectiveCapitalROI === Infinity ? 100 : playgroundROI.capital.effectiveCapitalROI)}
            original={originalROI.capital.effectiveCapitalROI === Infinity ? 100 : originalROI.capital.effectiveCapitalROI}
            current={playgroundROI.capital.effectiveCapitalROI === Infinity ? 100 : playgroundROI.capital.effectiveCapitalROI}
          />
          <MetricCard
            label="Composite ROI"
            value={fmtPct(playgroundROI.compositeROI)}
            original={originalROI.compositeROI}
            current={playgroundROI.compositeROI}
          />
        </div>
      )}

      {/* Cash Flow Chart */}
      {chartOptions.length > 0 && (
        <div className="mt-5">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-500">
            Annual Cash Flow Projection
          </h4>
          <AnnualCashFlowLineChart options={chartOptions} />
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function NumberInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-navy-600">{label}</label>
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-2.5 text-xs text-navy-400">{prefix}</span>}
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v) && v >= 0) onChange(v);
          }}
          className={`w-full rounded-lg border border-navy-200 bg-white py-2 text-xs text-navy-800 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500 ${
            prefix ? "pl-6 pr-3" : suffix ? "pl-3 pr-7" : "px-3"
          }`}
        />
        {suffix && <span className="absolute right-2.5 text-xs text-navy-400">{suffix}</span>}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  original,
  current,
  lowerIsBetter,
}: {
  label: string;
  value: string;
  original: number;
  current: number;
  lowerIsBetter?: boolean;
}) {
  return (
    <div className="rounded-lg border border-navy-100 bg-navy-50/50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-navy-400">{label}</p>
      <div className="mt-0.5 flex items-baseline">
        <span className="text-sm font-bold text-navy-900">{value}</span>
        <DeltaArrow current={current} original={original} lowerIsBetter={lowerIsBetter} />
      </div>
    </div>
  );
}
