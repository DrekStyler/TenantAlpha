"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import {
  MEMO_AUDIENCES,
  MEMO_TONES,
  MEMO_SECTIONS,
  type MemoAudience,
  type MemoTone,
  type MemoSectionId,
} from "@/lib/memos/types";

interface MemoConfigModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (config: {
    memoType: string;
    audience: MemoAudience;
    tone: MemoTone;
    includeSections: MemoSectionId[];
  }) => void;
  loading: boolean;
  error?: string;
}

export function MemoConfigModal({
  open,
  onClose,
  onGenerate,
  loading,
  error,
}: MemoConfigModalProps) {
  const [audience, setAudience] = useState<MemoAudience>("IC");
  const [tone, setTone] = useState<MemoTone>("BANK_STYLE");
  const [sections, setSections] = useState<Set<MemoSectionId>>(
    new Set(MEMO_SECTIONS.map((s) => s.id))
  );
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, loading, onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current && !loading) {
      onClose();
    }
  };

  const toggleSection = (id: MemoSectionId) => {
    setSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleGenerate = () => {
    if (sections.size === 0) return;
    onGenerate({
      memoType: "IC_DECISION_MEMO",
      audience,
      tone,
      includeSections: Array.from(sections),
    });
  };

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg rounded-xl border border-navy-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-navy-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-navy-900">
            Generate Word Memo
          </h2>
          <p className="mt-1 text-sm text-navy-500">
            Configure your AI-generated CRE briefing memo
          </p>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5 space-y-6">
          {/* Audience */}
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-500">
              Audience
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {MEMO_AUDIENCES.map((a) => (
                <label
                  key={a.id}
                  className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 transition-colors ${
                    audience === a.id
                      ? "border-navy-900 bg-navy-50"
                      : "border-navy-200 hover:border-navy-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="audience"
                    value={a.id}
                    checked={audience === a.id}
                    onChange={() => setAudience(a.id)}
                    className="mt-0.5 accent-navy-900"
                  />
                  <div>
                    <div className="text-sm font-medium text-navy-900">
                      {a.label}
                    </div>
                    <div className="text-xs text-navy-500">{a.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Tone */}
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-500">
              Tone
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {MEMO_TONES.map((t) => (
                <label
                  key={t.id}
                  className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors ${
                    tone === t.id
                      ? "border-navy-900 bg-navy-50"
                      : "border-navy-200 hover:border-navy-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="tone"
                    value={t.id}
                    checked={tone === t.id}
                    onChange={() => setTone(t.id)}
                    className="sr-only"
                  />
                  <div className="text-sm font-medium text-navy-900">
                    {t.label}
                  </div>
                  <div className="text-xs text-navy-500">{t.description}</div>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Sections */}
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-500">
              Include Sections
            </legend>
            <div className="space-y-2">
              {MEMO_SECTIONS.map((s) => (
                <label
                  key={s.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                    sections.has(s.id)
                      ? "border-navy-300 bg-navy-50/50"
                      : "border-navy-200 hover:border-navy-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={sections.has(s.id)}
                    onChange={() => toggleSection(s.id)}
                    className="mt-0.5 accent-navy-900"
                  />
                  <div>
                    <div className="text-sm font-medium text-navy-900">
                      {s.label}
                    </div>
                    <div className="text-xs text-navy-500">{s.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-navy-100 px-6 py-4">
          <p className="text-xs text-navy-400">
            AI will generate each section using your deal data
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleGenerate}
              loading={loading}
              disabled={sections.size === 0}
            >
              {loading ? "Generating..." : "Generate Memo"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
