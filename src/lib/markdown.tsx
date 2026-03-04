import React from "react";

function renderInline(text: string): React.ReactNode {
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

export function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  const bulletBuffer: string[] = [];
  let key = 0;

  function flushBullets() {
    if (bulletBuffer.length === 0) return;
    nodes.push(
      <ul key={key++} className="mb-4 ml-5 list-disc space-y-2">
        {bulletBuffer.map((b, i) => (
          <li key={i} className="leading-relaxed">{renderInline(b)}</li>
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

    // Numbered list items: "1. ", "2. ", etc.
    const numberedMatch = trimmed.match(/^\d+\.\s+(.*)/);

    if (trimmed.startsWith("### ")) {
      flushBullets();
      nodes.push(
        <h3 key={key++} className="mb-2 mt-5 text-sm font-semibold">
          {renderInline(trimmed.slice(4))}
        </h3>
      );
    } else if (trimmed.startsWith("## ")) {
      flushBullets();
      nodes.push(
        <h2 key={key++} className="mb-2 mt-6 text-base font-semibold">
          {renderInline(trimmed.slice(3))}
        </h2>
      );
    } else if (trimmed.startsWith("# ")) {
      flushBullets();
      nodes.push(
        <h2 key={key++} className="mb-2 mt-6 text-base font-bold">
          {renderInline(trimmed.slice(2))}
        </h2>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      bulletBuffer.push(trimmed.slice(2));
    } else if (numberedMatch) {
      bulletBuffer.push(numberedMatch[1]);
    } else {
      flushBullets();
      nodes.push(
        <p key={key++} className="mb-3 leading-relaxed">
          {renderInline(trimmed)}
        </p>
      );
    }
  }
  flushBullets();
  return nodes;
}
