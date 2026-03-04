"use client";

import React, { useEffect, useRef, useState } from "react";
import type { ComparisonResult } from "@/engine/types";
import { Spinner } from "@/components/ui/Spinner";

function renderInline(text: string): React.ReactNode {
  // Handle **bold** and *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  const bulletBuffer: string[] = [];
  let key = 0;

  function flushBullets() {
    if (bulletBuffer.length === 0) return;
    nodes.push(
      <ul key={key++} className="mb-4 ml-5 list-disc space-y-2">
        {bulletBuffer.map((b, i) => (
          <li key={i} className="leading-relaxed text-navy-600">{renderInline(b)}</li>
        ))}
      </ul>
    );
    bulletBuffer.length = 0;
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushBullets();
      continue;
    }
    if (trimmed.startsWith("### ")) {
      flushBullets();
      nodes.push(
        <h3 key={key++} className="mb-2 mt-6 text-sm font-semibold text-navy-900">
          {renderInline(trimmed.slice(4))}
        </h3>
      );
    } else if (trimmed.startsWith("## ")) {
      flushBullets();
      nodes.push(
        <h2 key={key++} className="mb-2 mt-6 text-base font-semibold text-navy-900">
          {renderInline(trimmed.slice(3))}
        </h2>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      bulletBuffer.push(trimmed.slice(2));
    } else {
      flushBullets();
      nodes.push(
        <p key={key++} className="mb-3 leading-relaxed text-navy-600">
          {renderInline(trimmed)}
        </p>
      );
    }
  }
  flushBullets();
  return nodes;
}

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
          setError(data.error ?? "Failed to generate summary.");
          setLoading(false);
          return;
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        setLoading(false);

        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;
          accumulated += decoder.decode(value, { stream: true });
          setText(accumulated);
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
        Generating AI executive summary…
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
