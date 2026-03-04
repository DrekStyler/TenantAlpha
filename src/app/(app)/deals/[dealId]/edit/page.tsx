"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { OptionTabs } from "@/components/options/OptionTabs";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { DISCOUNTING_MODES } from "@/lib/constants";

interface Deal {
  id: string;
  dealName: string;
  clientName?: string;
  propertyType?: string;
  options: Array<{ id: string; optionName: string; sortOrder: number; [key: string]: unknown }>;
}

export default function EditDealPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = use(params);
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [addingOption, setAddingOption] = useState(false);
  const [discountingMode, setDiscountingMode] = useState<"monthly" | "annual">("monthly");
  const [calcError, setCalcError] = useState("");

  const fetchDeal = async () => {
    const res = await fetch(`/api/deals/${dealId}`);
    if (res.ok) setDeal(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchDeal(); }, [dealId]);

  const handleAddOption = async () => {
    if (!deal || deal.options.length >= 5) return;
    setAddingOption(true);
    const idx = deal.options.length;

    // Copy first option's values as defaults (except address and name)
    const firstOpt = deal.options[0] as Record<string, unknown> | undefined;
    const defaults: Record<string, unknown> = {
      optionName: `Option ${String.fromCharCode(65 + idx)}`,
      rentableSF: 5000,
      termMonths: 60,
      baseRentY1: 40,
      escalationType: "FIXED_PERCENT",
      escalationPercent: 3,
      freeRentMonths: 0,
      freeRentType: "ABATED",
      rentStructure: "GROSS",
      discountRate: 8,
      propertyType: deal.propertyType,
      sortOrder: idx,
    };

    if (firstOpt && idx > 0) {
      const SKIP = new Set(["id", "dealId", "createdAt", "updatedAt", "optionName", "propertyAddress", "sortOrder"]);
      for (const [key, val] of Object.entries(firstOpt)) {
        if (!SKIP.has(key) && val != null) {
          defaults[key] = val;
        }
      }
      defaults.optionName = `Option ${String.fromCharCode(65 + idx)}`;
      defaults.sortOrder = idx;
    }

    const res = await fetch(`/api/deals/${dealId}/options`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(defaults),
    });
    if (res.ok) await fetchDeal();
    setAddingOption(false);
  };

  const handleCalculate = async () => {
    if (!deal || deal.options.length < 2) {
      setCalcError("Add at least 2 options before calculating.");
      return;
    }
    setCalculating(true);
    setCalcError("");
    try {
      const res = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId,
          discountingMode: { frequency: discountingMode },
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        setCalcError(errData.error ?? "Calculation failed");
        return;
      }
      const results = await res.json();
      // Store in sessionStorage for results page
      sessionStorage.setItem(`calc-${dealId}`, JSON.stringify(results));
      router.push(`/deals/${dealId}/negotiate`);
    } catch {
      setCalcError("Calculation failed. Please try again.");
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!deal) return <p className="text-navy-500">Deal not found.</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{deal.dealName}</h1>
          {deal.clientName && (
            <p className="text-sm text-navy-500">{deal.clientName}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {deal.options.length < 5 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddOption}
              loading={addingOption}
            >
              + Add Option
            </Button>
          )}
          <Button onClick={handleCalculate} loading={calculating}>
            Calculate ROI →
          </Button>
        </div>
      </div>

      {calcError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {calcError}
        </div>
      )}

      {/* Options hint */}
      {deal.options.length < 2 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Add at least 2 lease options to enable ROI calculation.
        </div>
      )}

      {/* Discounting Mode */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-navy-700">NPV Discounting:</span>
          {DISCOUNTING_MODES.map((m) => (
            <label key={m.value} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="discountingMode"
                value={m.value}
                checked={discountingMode === m.value}
                onChange={() => setDiscountingMode(m.value as "monthly" | "annual")}
                className="accent-navy-900"
              />
              <span className="text-sm text-navy-700">{m.label}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Option Forms */}
      {deal.options.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <p className="text-navy-500">No options yet.</p>
            <Button
              className="mt-4"
              onClick={handleAddOption}
              loading={addingOption}
            >
              + Add First Option
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <OptionTabs
            dealId={dealId}
            options={deal.options}
            onOptionsChange={fetchDeal}
            dealPropertyType={deal.propertyType}
          />
        </Card>
      )}

      {/* Bottom Calculate */}
      <div className="flex justify-end">
        <Button onClick={handleCalculate} loading={calculating} size="lg">
          Calculate ROI →
        </Button>
      </div>
    </div>
  );
}
