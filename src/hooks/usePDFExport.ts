"use client";

import { useState } from "react";
import type { ComparisonResult } from "@/engine/types";

interface UsePDFExportOptions {
  dealId: string;
  calculationResults: ComparisonResult;
  aiSummary?: string;
}

export function usePDFExport({ dealId, calculationResults, aiSummary }: UsePDFExportOptions) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const exportPDF = async () => {
    setExporting(true);
    setError("");
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId,
          calculationResults,
          aiSummary: aiSummary ?? "",
          chartImages: {},
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "PDF generation failed.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lease-analysis-${dealId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return { exportPDF, exporting, error };
}
