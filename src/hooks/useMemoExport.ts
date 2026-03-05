"use client";

import { useState, useCallback } from "react";
import type { MemoAudience, MemoTone, MemoSectionId } from "@/lib/memos/types";

interface MemoConfig {
  memoType: string;
  audience: MemoAudience;
  tone: MemoTone;
  includeSections: MemoSectionId[];
}

interface UseMemoExportOptions {
  dealId: string;
}

export function useMemoExport({ dealId }: UseMemoExportOptions) {
  const [showModal, setShowModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const openModal = useCallback(() => {
    setError("");
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const generateMemo = useCallback(
    async (config: MemoConfig) => {
      setExporting(true);
      setError("");
      try {
        const res = await fetch(`/api/deals/${dealId}/memos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(
            (data as { error?: string }).error ?? "Memo generation failed."
          );
          return;
        }

        // Download the blob
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `memo-${dealId}.docx`;

        // Try to extract filename from Content-Disposition
        const disposition = res.headers.get("Content-Disposition");
        if (disposition) {
          const match = disposition.match(/filename="?([^"]+)"?/);
          if (match) a.download = match[1];
        }

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setShowModal(false);
      } catch {
        setError("Failed to generate memo. Please try again.");
      } finally {
        setExporting(false);
      }
    },
    [dealId]
  );

  return { openModal, closeModal, generateMemo, showModal, exporting, error };
}
