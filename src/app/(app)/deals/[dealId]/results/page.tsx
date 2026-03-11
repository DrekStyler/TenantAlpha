"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ComparisonResult } from "@/engine/types";
import type { ROIOutputs } from "@/types/survey";
import { ResultsDashboard } from "@/components/results/ResultsDashboard";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { usePDFExport } from "@/hooks/usePDFExport";
import { useMemoExport } from "@/hooks/useMemoExport";
import { MemoConfigModal } from "@/components/memos/MemoConfigModal";
import { ProfileCompletionModal } from "@/components/onboarding/ProfileCompletionModal";

interface Deal {
  id: string;
  dealName: string;
  clientName?: string;
  client?: {
    industryProfile?: {
      industryType: string;
      roiOutputs: unknown;
    } | null;
  } | null;
}

export default function ResultsPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [results, setResults] = useState<ComparisonResult | null>(null);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const { exportPDF, doExport, exporting, error: pdfError, showProfileModal, setShowProfileModal } = usePDFExport({
    dealId,
    calculationResults: results ?? { options: [], rankedByEffectiveRent: [], rankedByNPV: [], bestValueOption: "", bestValueReasons: [] },
  });
  const {
    openModal: openMemoModal,
    closeModal: closeMemoModal,
    generateMemo,
    showModal: showMemoModal,
    exporting: memoExporting,
    error: memoError,
  } = useMemoExport({ dealId });

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
            <>
              <Button onClick={exportPDF} loading={exporting}>
                Export PDF ↓
              </Button>
              <Button
                variant="secondary"
                onClick={openMemoModal}
                loading={memoExporting}
              >
                Word Memo ↓
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Export errors */}
      {(pdfError || memoError) && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {pdfError || memoError}
        </div>
      )}

      {/* Memo config modal */}
      <MemoConfigModal
        open={showMemoModal}
        onClose={closeMemoModal}
        onGenerate={generateMemo}
        loading={memoExporting}
        error={memoError}
      />

      {/* Profile completion modal for PDF export */}
      {showProfileModal && (
        <ProfileCompletionModal
          onSaveAndExport={() => { setShowProfileModal(false); doExport(); }}
          onExportAnyway={() => { setShowProfileModal(false); doExport(); }}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Results or empty state */}
      {results ? (
        <ResultsDashboard
          dealId={dealId}
          dealName={deal?.dealName ?? "Lease Analysis"}
          results={results}
          roiOutputs={(deal?.client?.industryProfile?.roiOutputs as ROIOutputs) ?? undefined}
          industryType={deal?.client?.industryProfile?.industryType ?? undefined}
          initialTab={tabParam === "roi" ? "ROI Analysis" : undefined}
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
