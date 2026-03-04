"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import type { ComparisonResult } from "@/engine/types";
import { ResultsDashboard } from "@/components/results/ResultsDashboard";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { usePDFExport } from "@/hooks/usePDFExport";

interface Deal {
  id: string;
  dealName: string;
  clientName?: string;
}

export default function ResultsPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = use(params);
  const router = useRouter();
  const [results, setResults] = useState<ComparisonResult | null>(null);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const { exportPDF, exporting, error } = usePDFExport({
    dealId,
    calculationResults: results ?? { options: [], rankedByEffectiveRent: [], rankedByNPV: [], bestValueOption: "", bestValueReasons: [] },
  });

  useEffect(() => {
    // Try sessionStorage first
    const cached = sessionStorage.getItem(`calc-${dealId}`);
    if (cached) {
      try {
        setResults(JSON.parse(cached));
      } catch {
        // ignore parse error
      }
    }

    // Always fetch deal info
    fetch(`/api/deals/${dealId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setDeal(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dealId]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId, discountingMode: { frequency: "monthly" } }),
      });
      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem(`calc-${dealId}`, JSON.stringify(data));
        setResults(data);
      }
    } finally {
      setRecalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            {deal?.dealName ?? "Deal Results"}
          </h1>
          {deal?.clientName && (
            <p className="text-sm text-navy-500">{deal.clientName}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/deals/${dealId}/negotiate`)}
          >
            ← Negotiation Planner
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/deals/${dealId}/edit`)}
          >
            ← Edit Options
          </Button>
          <Button
            variant="secondary"
            onClick={handleRecalculate}
            loading={recalculating}
          >
            Recalculate
          </Button>
          {results && (
            <Button onClick={exportPDF} loading={exporting}>
              Export PDF ↓
            </Button>
          )}
        </div>
      </div>

      {/* PDF export error */}
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results or empty state */}
      {results ? (
        <ResultsDashboard
          dealId={dealId}
          dealName={deal?.dealName ?? "Lease Analysis"}
          results={results}
        />
      ) : (
        <div className="rounded-xl border border-navy-100 bg-white p-8 text-center">
          <p className="mb-4 text-navy-500">
            No calculation results found. Run the calculation from the edit page.
          </p>
          <div className="flex justify-center gap-3">
            <Button
              variant="secondary"
              onClick={() => router.push(`/deals/${dealId}/edit`)}
            >
              Go to Edit
            </Button>
            <Button onClick={handleRecalculate} loading={recalculating}>
              Calculate Now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
