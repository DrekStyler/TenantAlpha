"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { NegotiationPlanner } from "@/components/negotiation/NegotiationPlanner";
import { prismaOptionToLeaseInput, type PrismaOption } from "@/lib/mappers";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { usePDFExport } from "@/hooks/usePDFExport";
import { calculateDealComparison } from "@/engine";

interface Deal {
  id: string;
  dealName: string;
  clientName?: string;
  options: PrismaOption[];
}

export default function NegotiatePage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = use(params);
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);

  // PDF export — compute results on-the-fly for export
  const currentResults = deal && deal.options.length >= 2
    ? calculateDealComparison(
        deal.options.map(prismaOptionToLeaseInput),
        { discountingMode: { frequency: "monthly" }, includeTIInEffectiveRent: false }
      )
    : null;

  const { exportPDF, exporting, error: pdfError } = usePDFExport({
    dealId,
    calculationResults: currentResults ?? {
      options: [],
      rankedByEffectiveRent: [],
      rankedByNPV: [],
      bestValueOption: "",
      bestValueReasons: [],
    },
  });

  useEffect(() => {
    fetch(`/api/deals/${dealId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setDeal(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dealId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="py-16 text-center">
        <p className="text-navy-500">Deal not found.</p>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => router.push("/dashboard")}
        >
          ← Dashboard
        </Button>
      </div>
    );
  }

  if (deal.options.length < 2) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{deal.dealName}</h1>
          {deal.clientName && (
            <p className="text-sm text-navy-500">{deal.clientName}</p>
          )}
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-8 text-center">
          <p className="mb-4 text-navy-500">
            Add at least 2 lease options before using the Negotiation Planner.
          </p>
          <Button onClick={() => router.push(`/deals/${dealId}/edit`)}>
            ← Edit Options
          </Button>
        </div>
      </div>
    );
  }

  const initialInputs = deal.options.map(prismaOptionToLeaseInput);
  const optionIds = deal.options.map((o) => o.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            {deal.dealName}
          </h1>
          {deal.clientName && (
            <p className="text-sm text-navy-500">{deal.clientName}</p>
          )}
          <p className="mt-0.5 text-xs text-navy-400">Negotiation Planner</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/deals/${dealId}/edit`)}
          >
            ← Edit Options
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              // Store current results for results page
              if (currentResults) {
                sessionStorage.setItem(
                  `calc-${dealId}`,
                  JSON.stringify(currentResults)
                );
              }
              router.push(`/deals/${dealId}/results`);
            }}
          >
            Full Results →
          </Button>
          <Button size="sm" onClick={exportPDF} loading={exporting}>
            Export PDF ↓
          </Button>
        </div>
      </div>

      {/* PDF error */}
      {pdfError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {pdfError}
        </div>
      )}

      {/* Negotiation Planner */}
      <NegotiationPlanner
        dealId={dealId}
        dealName={deal.dealName}
        initialInputs={initialInputs}
        optionIds={optionIds}
      />
    </div>
  );
}
