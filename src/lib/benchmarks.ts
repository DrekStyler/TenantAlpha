import medicalData from "@/data/benchmarks/medical.json";
import legalData from "@/data/benchmarks/legal.json";
import aerospaceData from "@/data/benchmarks/aerospace.json";
import techData from "@/data/benchmarks/tech.json";
import financialData from "@/data/benchmarks/financial.json";
import marketRents from "@/data/benchmarks/market-rents.json";
import type { IndustryType } from "@/types/survey";

// ─── Industry Benchmark Lookups ──────────────────────────────────

const INDUSTRY_DATA: Record<string, unknown> = {
  MEDICAL: medicalData,
  LEGAL: legalData,
  AEROSPACE_DEFENSE: aerospaceData,
  TECH: techData,
  FINANCIAL: financialData,
};

/**
 * Get full benchmark data for a given industry.
 */
export function getIndustryData(industry: IndustryType): Record<string, unknown> {
  return (INDUSTRY_DATA[industry] ?? {}) as Record<string, unknown>;
}

// ─── Medical Benchmarks ─────────────────────────────────────────

export function getMedicalReimbursementRate(
  specialtyType: string,
  payerType: "medicare" | "medicaid" | "commercial"
): number {
  const rates = medicalData.reimbursementRates[specialtyType as keyof typeof medicalData.reimbursementRates];
  return rates?.[payerType] ?? 100;
}

export function getExamRoomBenchmark(specialtyType: string) {
  return medicalData.examRoomBenchmarks[specialtyType as keyof typeof medicalData.examRoomBenchmarks]
    ?? medicalData.examRoomBenchmarks.primary_care;
}

// ─── Legal Benchmarks ───────────────────────────────────────────

export function getLegalBillingRates(firmTier: string) {
  return legalData.billingRates[firmTier as keyof typeof legalData.billingRates]
    ?? legalData.billingRates.midsize;
}

export function getLegalRealizationRate(firmTier: string): number {
  return legalData.realizationBenchmarks[firmTier as keyof typeof legalData.realizationBenchmarks]
    ?? 87;
}

export function getLegalSpaceStandards() {
  return legalData.spaceStandards;
}

// ─── Market Rent Benchmarks ────────────────────────────────────

export interface MarketRentData {
  asking: number;
  effective: number;
  vacancy: number;
}

export function getMarketRent(market: string): MarketRentData {
  const normalized = market.toLowerCase().replace(/[\s,]+/g, "_");

  // Try exact match first
  const markets = marketRents.markets as Record<string, MarketRentData>;
  if (markets[normalized]) return markets[normalized];

  // Partial match
  const key = Object.keys(markets).find((k) => k.includes(normalized) || normalized.includes(k));
  if (key) return markets[key];

  return marketRents.nationalAverage;
}

export function getAllMarkets(): string[] {
  return Object.keys(marketRents.markets);
}

// ─── Validation Helpers ────────────────────────────────────────

/**
 * Compare a tenant-provided value against industry benchmarks.
 * Returns a description of how the value compares.
 */
export function compareToBenchmark(
  value: number,
  benchmarkValue: number,
  metricName: string
): { percentDiff: number; description: string } {
  const percentDiff = ((value - benchmarkValue) / benchmarkValue) * 100;

  let description: string;
  if (Math.abs(percentDiff) < 5) {
    description = `${metricName} is in line with industry benchmarks.`;
  } else if (percentDiff > 0) {
    description = `${metricName} is ${Math.abs(percentDiff).toFixed(0)}% above the industry average.`;
  } else {
    description = `${metricName} is ${Math.abs(percentDiff).toFixed(0)}% below the industry average.`;
  }

  return { percentDiff, description };
}
