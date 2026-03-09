"use client";

import { useEffect, useRef, useState } from "react";
import type { ComparisonResult } from "@/engine/types";
import { Spinner } from "@/components/ui/Spinner";
import { renderMarkdown } from "@/lib/markdown";

interface AISummaryProps {
  dealId: string;
  calculationResults: ComparisonResult;
}

export function AISummary({ dealId, calculationResults }: AISummaryProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    let cancelled = false;

    async function generateSummary() {
      try {
        const res = await fetch("/api/ai/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dealId, calculationResults }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError((data as { error?: string }).error ?? "Failed to generate summary.");
          setLoading(false);
          return;
        }

        // Accumulate the full response without showing partial text
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;
          accumulated += decoder.decode(value, { stream: true });
        }

        if (!cancelled) {
          setText(accumulated);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to connect to AI. Check your API key configuration.");
          setLoading(false);
        }
      }
    }

    generateSummary();
    return () => { cancelled = true; };
  }, [dealId, calculationResults]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-4 text-sm text-navy-500">
        <Spinner size="sm" />
        Generating executive summary…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {error}
      </div>
    );
  }

  return (
    <div className="prose prose-sm max-w-none text-navy-700">
      {text ? renderMarkdown(text) : (
        <p className="text-navy-400 italic">Summary not available.</p>
      )}
    </div>
  );
}
