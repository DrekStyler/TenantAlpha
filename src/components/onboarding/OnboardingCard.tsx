"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface OnboardingCardProps {
  profile: { name?: string | null; brokerageName?: string | null };
  dealCount: number;
  clientCount: number;
  onDismiss: () => void;
  onSampleDeal: () => void;
  sampleDealLoading: boolean;
}

function StepCircle({ step, done }: { step: number; done: boolean }) {
  if (done) {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-navy-200 text-sm font-semibold text-navy-400">
      {step}
    </div>
  );
}

export function OnboardingCard({
  profile,
  dealCount,
  clientCount,
  onDismiss,
  onSampleDeal,
  sampleDealLoading,
}: OnboardingCardProps) {
  const profileDone = !!(profile.name && profile.brokerageName);
  const clientDone = clientCount > 0;
  const dealDone = dealCount > 0;
  const allDone = profileDone && clientDone && dealDone;

  // Auto-dismiss when all steps are complete
  useEffect(() => {
    if (allDone) onDismiss();
  }, [allDone, onDismiss]);

  if (allDone) return null;

  return (
    <div className="rounded-xl border border-navy-200 bg-gradient-to-br from-white to-navy-50/50 p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        {/* Left: steps */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">
            Welcome to TenantAlpha
          </h2>
          <p className="mt-1 text-sm text-navy-500">
            Get started in 3 steps to unlock lease analysis and client insights.
          </p>

          <div className="mt-6 space-y-4">
            {/* Step 1: Profile */}
            <div className="flex items-center gap-3">
              <StepCircle step={1} done={profileDone} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${profileDone ? "text-navy-400 line-through" : "text-navy-900"}`}>
                  Set up your profile
                </p>
                {!profileDone && (
                  <Link
                    href="/profile"
                    className="mt-0.5 inline-block text-xs font-medium text-navy-600 underline decoration-navy-300 hover:text-navy-900"
                  >
                    Add name &amp; brokerage
                  </Link>
                )}
              </div>
            </div>

            {/* Connector */}
            <div className="ml-[15px] h-2 border-l-2 border-dashed border-navy-200" />

            {/* Step 2: Client */}
            <div className="flex items-center gap-3">
              <StepCircle step={2} done={clientDone} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${clientDone ? "text-navy-400 line-through" : "text-navy-900"}`}>
                  Add your first client
                </p>
                {!clientDone && (
                  <p className="mt-0.5 text-xs text-navy-500">
                    Send them an economic questionnaire
                  </p>
                )}
              </div>
            </div>

            {/* Connector */}
            <div className="ml-[15px] h-2 border-l-2 border-dashed border-navy-200" />

            {/* Step 3: Deal */}
            <div className="flex items-center gap-3">
              <StepCircle step={3} done={dealDone} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${dealDone ? "text-navy-400 line-through" : "text-navy-900"}`}>
                  Run your first analysis
                </p>
                {!dealDone && (
                  <Link
                    href="/deals/new"
                    className="mt-0.5 inline-block text-xs font-medium text-navy-600 underline decoration-navy-300 hover:text-navy-900"
                  >
                    Compare lease options
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: sample data CTA */}
        <div className="flex shrink-0 flex-col items-start gap-3 rounded-lg border border-gold-200 bg-gold-50/50 p-5 lg:w-64">
          <p className="text-sm font-semibold text-navy-900">Want to explore first?</p>
          <p className="text-xs text-navy-500">
            See a fully calculated example with 3 lease options for a sample client.
          </p>
          <Button
            onClick={onSampleDeal}
            loading={sampleDealLoading}
            className="bg-gold-600 text-white hover:bg-gold-700 active:bg-gold-800"
          >
            Try with sample data
          </Button>
        </div>
      </div>

      {/* Skip */}
      <div className="mt-4 text-right">
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-medium text-navy-400 hover:text-navy-600"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
