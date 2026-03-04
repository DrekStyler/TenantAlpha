"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { calculateDealComparison } from "@/engine";
import type {
  LeaseOptionInput,
  ComparisonResult,
  CalculationConfig,
} from "@/engine/types";

const SAVE_DEBOUNCE_MS = 1500;

interface NegotiationStateOptions {
  dealId: string;
  initialInputs: LeaseOptionInput[];
  /** Prisma option IDs in the same order as initialInputs */
  optionIds: string[];
  initialConfig?: CalculationConfig;
}

export interface NegotiationState {
  inputs: LeaseOptionInput[];
  results: ComparisonResult | null;
  config: CalculationConfig;
  saving: boolean;
  dirty: boolean;
  updateField: (
    optionIndex: number,
    field: keyof LeaseOptionInput,
    value: string | number
  ) => void;
  setConfig: (config: CalculationConfig) => void;
  /** Immediately save any pending changes (cancel debounce timer). */
  flushSaves: () => Promise<void>;
}

export function useNegotiationState({
  dealId,
  initialInputs,
  optionIds,
  initialConfig,
}: NegotiationStateOptions): NegotiationState {
  const [inputs, setInputs] = useState<LeaseOptionInput[]>(initialInputs);
  const [config, setConfigState] = useState<CalculationConfig>(
    initialConfig ?? {
      discountingMode: { frequency: "monthly" },
      includeTIInEffectiveRent: false,
    }
  );
  const [results, setResults] = useState<ComparisonResult | null>(() => {
    if (initialInputs.length >= 2) {
      return calculateDealComparison(
        initialInputs,
        initialConfig ?? {
          discountingMode: { frequency: "monthly" },
          includeTIInEffectiveRent: false,
        }
      );
    }
    return null;
  });
  const [saving, setSaving] = useState(false);

  // Track dirty option indices for debounced save
  const dirtyIndices = useRef<Set<number>>(new Set());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep optionIds in a ref so we don't re-create callbacks
  const optionIdsRef = useRef(optionIds);
  optionIdsRef.current = optionIds;

  const dealIdRef = useRef(dealId);
  dealIdRef.current = dealId;

  const inputsRef = useRef(inputs);
  inputsRef.current = inputs;

  // Recalculate helper
  const recalculate = useCallback(
    (newInputs: LeaseOptionInput[], newConfig: CalculationConfig) => {
      if (newInputs.length >= 2) {
        const r = calculateDealComparison(newInputs, newConfig);
        setResults(r);
      }
    },
    []
  );

  // Debounced save
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const indices = Array.from(dirtyIndices.current);
      if (indices.length === 0) return;
      dirtyIndices.current.clear();
      setSaving(true);
      try {
        const currentInputs = inputsRef.current;
        const currentIds = optionIdsRef.current;
        const currentDealId = dealIdRef.current;

        await Promise.all(
          indices.map((idx) => {
            const optId = currentIds[idx];
            const input = currentInputs[idx];
            if (!optId || !input) return Promise.resolve();
            return fetch(
              `/api/deals/${currentDealId}/options/${optId}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  optionName: input.optionName,
                  rentableSF: input.rentableSF,
                  usableSF: input.usableSF,
                  loadFactor: input.loadFactor,
                  termMonths: input.termMonths,
                  baseRentY1: input.baseRentY1,
                  escalationType: input.escalationType,
                  escalationPercent: input.escalationPercent,
                  cpiAssumedPercent: input.cpiAssumedPercent,
                  freeRentMonths: input.freeRentMonths,
                  freeRentType: input.freeRentType,
                  rentStructure: input.rentStructure,
                  opExPerSF: input.opExPerSF,
                  opExEscalation: input.opExEscalation,
                  propertyTax: input.propertyTax,
                  parkingCostMonthly: input.parkingCostMonthly,
                  otherMonthlyFees: input.otherMonthlyFees,
                  tiAllowance: input.tiAllowance,
                  estimatedBuildoutCost: input.estimatedBuildoutCost,
                  discountRate: input.discountRate,
                  annualRevenue: input.annualRevenue,
                  employees: input.employees,
                  expectedRevenueGrowth: input.expectedRevenueGrowth,
                }),
              }
            );
          })
        );
      } catch (err) {
        console.error("Failed to save option changes:", err);
      } finally {
        setSaving(false);
      }
    }, SAVE_DEBOUNCE_MS);
  }, []);

  // Flush saves immediately (used before AI analysis)
  const flushSaves = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const indices = Array.from(dirtyIndices.current);
    if (indices.length === 0) return;
    dirtyIndices.current.clear();
    setSaving(true);
    try {
      const currentInputs = inputsRef.current;
      const currentIds = optionIdsRef.current;
      const currentDealId = dealIdRef.current;
      await Promise.all(
        indices.map((idx) => {
          const optId = currentIds[idx];
          const input = currentInputs[idx];
          if (!optId || !input) return Promise.resolve();
          return fetch(
            `/api/deals/${currentDealId}/options/${optId}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                optionName: input.optionName,
                rentableSF: input.rentableSF,
                usableSF: input.usableSF,
                loadFactor: input.loadFactor,
                termMonths: input.termMonths,
                baseRentY1: input.baseRentY1,
                escalationType: input.escalationType,
                escalationPercent: input.escalationPercent,
                cpiAssumedPercent: input.cpiAssumedPercent,
                freeRentMonths: input.freeRentMonths,
                freeRentType: input.freeRentType,
                rentStructure: input.rentStructure,
                opExPerSF: input.opExPerSF,
                opExEscalation: input.opExEscalation,
                propertyTax: input.propertyTax,
                parkingCostMonthly: input.parkingCostMonthly,
                otherMonthlyFees: input.otherMonthlyFees,
                tiAllowance: input.tiAllowance,
                estimatedBuildoutCost: input.estimatedBuildoutCost,
                discountRate: input.discountRate,
                annualRevenue: input.annualRevenue,
                employees: input.employees,
                expectedRevenueGrowth: input.expectedRevenueGrowth,
              }),
            }
          );
        })
      );
    } catch (err) {
      console.error("Failed to flush saves:", err);
    } finally {
      setSaving(false);
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const updateField = useCallback(
    (
      optionIndex: number,
      field: keyof LeaseOptionInput,
      value: string | number
    ) => {
      setInputs((prev) => {
        const next = prev.map((input, i) => {
          if (i !== optionIndex) return input;
          return { ...input, [field]: value };
        });
        // Recalculate immediately with new inputs
        recalculate(next, config);
        return next;
      });
      dirtyIndices.current.add(optionIndex);
      scheduleSave();
    },
    [config, recalculate, scheduleSave]
  );

  const setConfig = useCallback(
    (newConfig: CalculationConfig) => {
      setConfigState(newConfig);
      recalculate(inputs, newConfig);
    },
    [inputs, recalculate]
  );

  return {
    inputs,
    results,
    config,
    saving,
    dirty: dirtyIndices.current.size > 0,
    updateField,
    setConfig,
    flushSaves,
  };
}
