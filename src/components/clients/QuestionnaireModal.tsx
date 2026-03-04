"use client";

interface QuestionnaireData {
  name: string;
  company?: string | null;
  currentHeadcount?: number | null;
  projectedHeadcount12mo?: number | null;
  revenuePerEmployee?: number | null;
  currentAnnualRevenue?: number | null;
  projectedRevenueGrowth?: number | null;
  sfPerEmployee?: number | null;
  criticalAmenities?: string | null;
  expansionTimeline?: string | null;
  budgetConstraint?: number | null;
  primaryGoal?: string | null;
  questionnaireCompletedAt?: string | null;
}

interface QuestionnaireModalProps {
  client: QuestionnaireData;
  onClose: () => void;
}

const timelineLabels: Record<string, string> = {
  IMMEDIATE: "Immediate (0-3 months)",
  SHORT_TERM: "Short-term (3-6 months)",
  MEDIUM_TERM: "Medium-term (6-12 months)",
  LONG_TERM: "Long-term (12+ months)",
};

const goalLabels: Record<string, string> = {
  COST_REDUCTION: "Cost Reduction",
  GROWTH_EXPANSION: "Growth / Expansion",
  CONSOLIDATION: "Consolidation",
  RELOCATION: "Relocation",
  UPGRADE: "Upgrade Space Quality",
  FLEXIBILITY: "Lease Flexibility",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-navy-100 py-3 last:border-b-0">
      <span className="text-sm text-navy-500">{label}</span>
      <span className="text-right text-sm font-medium text-navy-900">
        {value ?? "—"}
      </span>
    </div>
  );
}

export function QuestionnaireModal({ client, onClose }: QuestionnaireModalProps) {
  const amenities: string[] = client.criticalAmenities
    ? (() => {
        try {
          return JSON.parse(client.criticalAmenities);
        } catch {
          return [];
        }
      })()
    : [];

  const completedDate = client.questionnaireCompletedAt
    ? new Date(client.questionnaireCompletedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-navy-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-navy-900">
              Questionnaire Responses
            </h2>
            <p className="mt-0.5 text-sm text-navy-500">
              {client.name}
              {client.company ? ` — ${client.company}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-navy-400 hover:bg-navy-100 hover:text-navy-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {completedDate && (
            <p className="text-xs text-navy-400">
              Submitted {completedDate}
            </p>
          )}

          {/* Team Size */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">
              Team Size
            </h3>
            <div className="rounded-lg border border-navy-100 px-4">
              <Row
                label="Current Headcount"
                value={client.currentHeadcount?.toLocaleString()}
              />
              <Row
                label="Projected (12 mo)"
                value={client.projectedHeadcount12mo?.toLocaleString()}
              />
            </div>
          </section>

          {/* Revenue */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">
              Revenue Impact
            </h3>
            <div className="rounded-lg border border-navy-100 px-4">
              <Row
                label="Annual Revenue"
                value={
                  client.currentAnnualRevenue != null
                    ? formatCurrency(client.currentAnnualRevenue)
                    : null
                }
              />
              <Row
                label="Revenue / Employee"
                value={
                  client.revenuePerEmployee != null
                    ? formatCurrency(client.revenuePerEmployee)
                    : null
                }
              />
              <Row
                label="Expected Growth"
                value={
                  client.projectedRevenueGrowth != null
                    ? formatPercent(client.projectedRevenueGrowth)
                    : null
                }
              />
            </div>
          </section>

          {/* Space */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">
              Space Requirements
            </h3>
            <div className="rounded-lg border border-navy-100 px-4">
              <Row
                label="SF / Employee"
                value={
                  client.sfPerEmployee != null
                    ? `${client.sfPerEmployee.toLocaleString()} SF`
                    : null
                }
              />
              <Row
                label="Monthly Budget"
                value={
                  client.budgetConstraint != null
                    ? formatCurrency(client.budgetConstraint)
                    : null
                }
              />
            </div>
          </section>

          {/* Amenities */}
          {amenities.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">
                Must-Have Amenities
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {amenities.map((a: string) => (
                  <span
                    key={a}
                    className="rounded-full bg-navy-100 px-2.5 py-1 text-xs font-medium text-navy-700"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Timeline & Goals */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">
              Timeline & Goals
            </h3>
            <div className="rounded-lg border border-navy-100 px-4">
              <Row
                label="Expansion Timeline"
                value={
                  client.expansionTimeline
                    ? timelineLabels[client.expansionTimeline] || client.expansionTimeline
                    : null
                }
              />
              <Row
                label="Primary Goal"
                value={
                  client.primaryGoal
                    ? goalLabels[client.primaryGoal] || client.primaryGoal
                    : null
                }
              />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-navy-200 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
