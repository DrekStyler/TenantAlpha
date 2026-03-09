"use client";

import type { SurveyPhase } from "@/types/survey";

const PHASES: { key: SurveyPhase; label: string }[] = [
  { key: "INDUSTRY_DETECTION", label: "Industry" },
  { key: "INDUSTRY_QUESTIONS", label: "Business Details" },
  { key: "LEASE_PREFERENCES", label: "Space Preferences" },
  { key: "REVIEW", label: "Review" },
  { key: "COMPLETED", label: "Complete" },
];

interface SurveyProgressProps {
  currentPhase: SurveyPhase;
}

export function SurveyProgress({ currentPhase }: SurveyProgressProps) {
  const currentIndex = PHASES.findIndex((p) => p.key === currentPhase);

  return (
    <div className="flex items-center justify-between px-2">
      {PHASES.map((phase, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;

        return (
          <div key={phase.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isCompleted
                    ? "bg-gold-500 text-navy-900"
                    : isCurrent
                      ? "bg-navy-900 text-white"
                      : "bg-navy-100 text-navy-400"
                }`}
              >
                {isCompleted ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`mt-1 text-[10px] font-medium ${
                  isCurrent ? "text-navy-900" : isCompleted ? "text-gold-600" : "text-navy-400"
                }`}
              >
                {phase.label}
              </span>
            </div>
            {i < PHASES.length - 1 && (
              <div
                className={`mx-1 h-0.5 w-6 sm:w-10 ${
                  i < currentIndex ? "bg-gold-500" : "bg-navy-100"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
