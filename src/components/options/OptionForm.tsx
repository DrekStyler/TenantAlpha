"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leaseOptionSchema, type LeaseOptionFormData } from "@/schemas/option";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { LocationPreview } from "@/components/location/LocationPreview";
import {
  RENT_STRUCTURES,
  ESCALATION_TYPES,
  FREE_RENT_TYPES,
  EXISTING_CONDITIONS,
  PROPERTY_TYPES,
  DEFAULT_DISCOUNT_RATE,
  DEFAULT_ESCALATION_PERCENT,
} from "@/lib/constants";

interface OptionFormProps {
  dealId: string;
  optionId?: string;
  initialData?: Partial<LeaseOptionFormData>;
  onSaved?: () => void;
  index: number;
  dealPropertyType?: string;
}

export function OptionForm({
  dealId,
  optionId,
  initialData,
  onSaved,
  index,
  dealPropertyType,
}: OptionFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<LeaseOptionFormData>({
    resolver: zodResolver(leaseOptionSchema),
    defaultValues: {
      optionName: `Option ${String.fromCharCode(65 + index)}`,
      escalationType: "FIXED_PERCENT",
      escalationPercent: DEFAULT_ESCALATION_PERCENT,
      freeRentMonths: 0,
      freeRentType: "ABATED",
      rentStructure: "GROSS",
      discountRate: DEFAULT_DISCOUNT_RATE,
      termMonths: 60,
      ...(dealPropertyType ? { propertyType: dealPropertyType as LeaseOptionFormData["propertyType"] } : {}),
      ...initialData,
    },
  });

  const escalationType = watch("escalationType");
  const rentStructure = watch("rentStructure");

  // Auto-save on change (debounced effect approach)
  const onSubmit = async (data: LeaseOptionFormData) => {
    setSaving(true);
    setSaveMsg("");
    try {
      const url = optionId
        ? `/api/deals/${dealId}/options/${optionId}`
        : `/api/deals/${dealId}/options`;
      const method = optionId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, sortOrder: index }),
      });

      if (!res.ok) throw new Error("Save failed");
      setSaveMsg("Saved");
      onSaved?.();
      setTimeout(() => setSaveMsg(""), 2000);
    } catch {
      setSaveMsg("Error saving");
    } finally {
      setSaving(false);
    }
  };

  // Track form as "initialized" after initial data loads.
  // Convert null (from Prisma) to undefined so optional Zod fields pass.
  useEffect(() => {
    if (initialData) {
      const cleaned = Object.fromEntries(
        Object.entries(initialData as Record<string, unknown>).map(([k, v]) => [
          k,
          v === null ? undefined : v,
        ])
      ) as LeaseOptionFormData;
      reset(cleaned);
    }
  }, [initialData, reset]);

  const isNNN =
    rentStructure === "NNN" || rentStructure === "MODIFIED_GROSS";

  return (
    <form
      onSubmit={handleSubmit(onSubmit, () =>
        setSaveMsg("Please fix the errors highlighted below.")
      )}
      className="space-y-8"
    >
      {/* Basic Fields */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-navy-400">
          Property Details
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Option Name"
            required
            error={errors.optionName?.message}
            {...register("optionName")}
          />
          <Input
            label="Property Address"
            placeholder="123 Main St, Suite 400"
            {...register("propertyAddress")}
          />
        </div>

        {/* Location preview (only if option is saved and address exists) */}
        {optionId && watch("propertyAddress") && (
          <LocationPreview
            dealId={dealId}
            optionId={optionId}
            address={watch("propertyAddress")}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Property Type"
            options={PROPERTY_TYPES.map((t) => ({
              value: t.value,
              label: t.label,
            }))}
            {...register("propertyType")}
          />
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-1 text-sm font-medium text-navy-700">
              Rentable SF <span className="text-red-500">*</span>
              <Tooltip term="rentableSF"><span /></Tooltip>
            </label>
            <input
              type="number"
              placeholder="5000"
              className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-navy-900 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500 ${errors.rentableSF ? "border-red-400" : "border-navy-200"}`}
              {...register("rentableSF", { valueAsNumber: true })}
            />
            {errors.rentableSF && (
              <p className="text-xs text-red-500">{errors.rentableSF.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-navy-700">
              Lease Term (months) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder="60"
              className={`w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 ${errors.termMonths ? "border-red-400" : "border-navy-200"}`}
              {...register("termMonths", { valueAsNumber: true })}
            />
            {errors.termMonths && (
              <p className="text-xs text-red-500">{errors.termMonths.message}</p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-navy-400">
          Rent & Escalation
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-1 text-sm font-medium text-navy-700">
              Base Rent Y1 ($/SF/yr) <span className="text-red-500">*</span>
              <Tooltip term="baseRentY1"><span /></Tooltip>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-sm text-navy-400">$</span>
              <input
                type="number"
                step="0.01"
                placeholder="45.00"
                className={`w-full rounded-lg border bg-white pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 ${errors.baseRentY1 ? "border-red-400" : "border-navy-200"}`}
                {...register("baseRentY1", { valueAsNumber: true })}
              />
            </div>
            {errors.baseRentY1 && (
              <p className="text-xs text-red-500">{errors.baseRentY1.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-1 text-sm font-medium text-navy-700">
              Escalation Type
              <Tooltip term="escalationType"><span /></Tooltip>
            </label>
            <select
              className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
              {...register("escalationType")}
            >
              {ESCALATION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-1 text-sm font-medium text-navy-700">
              {escalationType === "CPI" ? "Assumed CPI %" : "Escalation %"}
              <Tooltip term={escalationType === "CPI" ? "cpiAssumedPercent" : "escalationPercent"}><span /></Tooltip>
            </label>
            <div className="relative flex items-center">
              <input
                type="number"
                step="0.1"
                placeholder="3.0"
                className="w-full rounded-lg border border-navy-200 bg-white px-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                {...register("escalationPercent", { valueAsNumber: true })}
              />
              <span className="absolute right-3 text-sm text-navy-400">%</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-1 text-sm font-medium text-navy-700">
              Rent Structure <span className="text-red-500">*</span>
              <Tooltip term="rentStructure"><span /></Tooltip>
            </label>
            <select
              className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
              {...register("rentStructure")}
            >
              {RENT_STRUCTURES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-1 text-sm font-medium text-navy-700">
              Free Rent (months)
              <Tooltip term="freeRent"><span /></Tooltip>
            </label>
            <input
              type="number"
              placeholder="0"
              min={0}
              className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
              {...register("freeRentMonths", { valueAsNumber: true })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-navy-700">
              Free Rent Type
            </label>
            <select
              className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
              {...register("freeRentType")}
            >
              {FREE_RENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Advanced Fields Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced((s) => !s)}
          className="flex items-center gap-2 text-sm font-medium text-navy-600 hover:text-navy-900"
        >
          <svg
            className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          Advanced Options (OpEx, TI, Parking)
        </button>
      </div>

      {showAdvanced && (
        <>
          {/* Operating Expenses */}
          {isNNN && (
            <section className="space-y-4 rounded-xl bg-navy-50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-navy-400">
                Operating Expenses
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="flex items-center gap-1 text-sm font-medium text-navy-700">
                    OpEx ($/SF/yr)
                    <Tooltip term="opExPerSF"><span /></Tooltip>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-sm text-navy-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="12.00"
                      className="w-full rounded-lg border border-navy-200 bg-white pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                      {...register("opExPerSF", { valueAsNumber: true })}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="flex items-center gap-1 text-sm font-medium text-navy-700">
                    OpEx Escalation %
                    <Tooltip term="opExEscalation"><span /></Tooltip>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="3.0"
                      className="w-full rounded-lg border border-navy-200 bg-white px-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                      {...register("opExEscalation", { valueAsNumber: true })}
                    />
                    <span className="absolute right-3 text-sm text-navy-400">%</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Additional Costs */}
          <section className="space-y-4 rounded-xl bg-navy-50 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-navy-400">
              Additional Costs
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-1 text-sm font-medium text-navy-700">
                  Parking ($/mo)
                  <Tooltip term="parkingCost"><span /></Tooltip>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm text-navy-400">$</span>
                  <input
                    type="number"
                    placeholder="2000"
                    className="w-full rounded-lg border border-navy-200 bg-white pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                    {...register("parkingCostMonthly", { valueAsNumber: true })}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-1 text-sm font-medium text-navy-700">
                  Other Monthly Fees
                  <Tooltip term="otherMonthlyFees"><span /></Tooltip>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm text-navy-400">$</span>
                  <input
                    type="number"
                    placeholder="500"
                    className="w-full rounded-lg border border-navy-200 bg-white pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                    {...register("otherMonthlyFees", { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* TI */}
          <section className="space-y-4 rounded-xl bg-navy-50 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-navy-400">
              Tenant Improvements
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-1 text-sm font-medium text-navy-700">
                  TI Allowance ($)
                  <Tooltip term="tiAllowance"><span /></Tooltip>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm text-navy-400">$</span>
                  <input
                    type="number"
                    placeholder="250000"
                    className="w-full rounded-lg border border-navy-200 bg-white pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                    {...register("tiAllowance", { valueAsNumber: true })}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-1 text-sm font-medium text-navy-700">
                  Est. Buildout Cost ($)
                  <Tooltip term="estimatedBuildoutCost"><span /></Tooltip>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm text-navy-400">$</span>
                  <input
                    type="number"
                    placeholder="350000"
                    className="w-full rounded-lg border border-navy-200 bg-white pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                    {...register("estimatedBuildoutCost", { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>
            <Select
              label="Existing Condition"
              options={[
                { value: "", label: "Select condition..." },
                ...EXISTING_CONDITIONS.map((c) => ({
                  value: c.value,
                  label: c.label,
                })),
              ]}
              {...register("existingCondition")}
            />
          </section>

        </>
      )}

      <div className="flex items-center justify-between border-t border-navy-100 pt-6">
        <div className="text-sm">
          {saveMsg && (
            <span className={saveMsg === "Saved" ? "font-medium text-green-600" : "text-red-500"}>
              {saveMsg}
            </span>
          )}
        </div>
        <Button type="submit" loading={saving} variant="secondary">
          Save Option
        </Button>
      </div>
    </form>
  );
}
