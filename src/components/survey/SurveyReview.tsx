"use client";

import type { ExtractedSurveyData } from "@/types/survey";
import { Button } from "@/components/ui/Button";

interface SurveyReviewProps {
  data: ExtractedSurveyData;
  onConfirm: () => void;
  loading: boolean;
}

function formatCurrency(val?: number) {
  if (!val) return "—";
  return `$${val.toLocaleString()}`;
}

export function SurveyReview({ data, onConfirm, loading }: SurveyReviewProps) {
  return (
    <div className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-navy-900">Review Your Information</h3>
      <p className="text-sm text-navy-500">
        Please confirm the details below. Once confirmed, we'll generate your ROI analysis.
      </p>

      {/* General Info */}
      <section>
        <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-navy-500">
          General
        </h4>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {data.industry && <Row label="Industry" value={data.industry.replace("_", " / ")} />}
          {data.companyName && <Row label="Company" value={data.companyName} />}
          {data.headcount && <Row label="Headcount" value={data.headcount.toString()} />}
          {data.projectedHeadcount12mo && <Row label="Projected (12mo)" value={data.projectedHeadcount12mo.toString()} />}
          {data.annualRevenue && <Row label="Annual Revenue" value={formatCurrency(data.annualRevenue)} />}
          {data.revenuePerEmployee && <Row label="Rev/Employee" value={formatCurrency(data.revenuePerEmployee)} />}
          {data.projectedRevenueGrowth != null && <Row label="Growth" value={`${data.projectedRevenueGrowth}%`} />}
          {data.primaryGoal && <Row label="Primary Goal" value={data.primaryGoal.replace(/_/g, " ")} />}
          {data.expansionTimeline && <Row label="Timeline" value={data.expansionTimeline.replace(/_/g, " ")} />}
        </dl>
      </section>

      {/* Industry-Specific */}
      {data.industryInputs && Object.keys(data.industryInputs).length > 0 && (
        <section>
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-navy-500">
            Industry Details
          </h4>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {Object.entries(data.industryInputs).map(([key, value]) => (
              <Row
                key={key}
                label={key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                value={typeof value === "object" ? JSON.stringify(value) : String(value)}
              />
            ))}
          </dl>
        </section>
      )}

      {/* Lease Preferences */}
      {data.leasePreferences && (
        <section>
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-navy-500">
            Lease Preferences
          </h4>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {data.leasePreferences.preferredTerm && <Row label="Term" value={`${data.leasePreferences.preferredTerm} months`} />}
            {data.leasePreferences.preferredRentStructure && <Row label="Structure" value={data.leasePreferences.preferredRentStructure} />}
            {data.leasePreferences.maxBaseRent && <Row label="Max Rent" value={`$${data.leasePreferences.maxBaseRent}/SF/yr`} />}
            {data.leasePreferences.tiExpectation && <Row label="TI Expectation" value={formatCurrency(data.leasePreferences.tiExpectation)} />}
            {data.leasePreferences.freeRentExpectation != null && <Row label="Free Rent" value={`${data.leasePreferences.freeRentExpectation} months`} />}
            {data.leasePreferences.preferredLocation && <Row label="Location" value={data.leasePreferences.preferredLocation} />}
            {data.leasePreferences.parkingNeeded != null && <Row label="Parking" value={`${data.leasePreferences.parkingNeeded} spaces`} />}
          </dl>
        </section>
      )}

      {/* Current Lease */}
      {data.currentLease && (
        <section>
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-navy-500">
            Current Lease
          </h4>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {data.currentLease.currentRent && <Row label="Rent" value={`$${data.currentLease.currentRent}/SF/yr`} />}
            {data.currentLease.currentEscalation && <Row label="Escalation" value={`${data.currentLease.currentEscalation}%`} />}
            {data.currentLease.currentSF && <Row label="Square Footage" value={data.currentLease.currentSF.toLocaleString()} />}
            {data.currentLease.painPoints && data.currentLease.painPoints.length > 0 && (
              <Row label="Pain Points" value={data.currentLease.painPoints.join(", ")} />
            )}
          </dl>
        </section>
      )}

      {/* Amenities */}
      {data.criticalAmenities && data.criticalAmenities.length > 0 && (
        <section>
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-navy-500">
            Critical Amenities
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {data.criticalAmenities.map((a) => (
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

      <Button onClick={onConfirm} loading={loading} className="w-full">
        Confirm & Generate ROI Analysis
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-navy-500">{label}</dt>
      <dd className="font-medium text-navy-800">{value}</dd>
    </>
  );
}
