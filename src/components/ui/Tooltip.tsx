"use client";

import { useState } from "react";
import { TOOLTIPS } from "@/config/tooltips";

interface TooltipProps {
  term: keyof typeof TOOLTIPS | string;
  children: React.ReactNode;
  content?: string;
}

export function Tooltip({ term, children, content }: TooltipProps) {
  const [show, setShow] = useState(false);
  const text = content ?? TOOLTIPS[term as keyof typeof TOOLTIPS] ?? "";

  if (!text) return <>{children}</>;

  return (
    <span className="relative inline-flex items-center gap-1">
      {children}
      <button
        type="button"
        className="shrink-0 text-navy-300 hover:text-navy-500 focus:outline-none"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        onClick={() => setShow((s) => !s)}
        aria-label={`Help: ${String(term)}`}
      >
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM9 9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-3.75a.75.75 0 100 1.5.75.75 0 000-1.5z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {show && (
        <span className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg bg-navy-900 px-3 py-2 text-xs text-white shadow-lg">
          {text}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-navy-900" />
        </span>
      )}
    </span>
  );
}

export function FieldLabel({
  label,
  term,
  required,
}: {
  label: string;
  term?: string;
  required?: boolean;
}) {
  return (
    <span className="flex items-center gap-1 text-sm font-medium text-navy-700">
      {label}
      {required && <span className="text-red-500">*</span>}
      {term && <Tooltip term={term}><span /></Tooltip>}
    </span>
  );
}
