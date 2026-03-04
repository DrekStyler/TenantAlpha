"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";

interface ClientInfo {
  clientName: string;
  company?: string;
  alreadyCompleted: boolean;
  brokerName?: string;
  brokerageName?: string;
}

const timelineOptions = [
  { value: "", label: "Select timeline..." },
  { value: "IMMEDIATE", label: "Immediately (within 3 months)" },
  { value: "6_MONTHS", label: "Within 6 months" },
  { value: "12_MONTHS", label: "Within 12 months" },
  { value: "24_MONTHS", label: "Within 24 months" },
  { value: "36_PLUS_MONTHS", label: "3+ years out" },
];

const goalOptions = [
  { value: "", label: "Select primary goal..." },
  { value: "MINIMIZE_COST", label: "Minimize occupancy costs" },
  { value: "MAXIMIZE_GROWTH", label: "Maximize revenue growth potential" },
  { value: "ATTRACT_TALENT", label: "Attract and retain talent" },
  { value: "IMPROVE_LOCATION", label: "Improve location / accessibility" },
  { value: "EXPAND_CAPACITY", label: "Expand operational capacity" },
];

const amenityChoices = [
  "Parking",
  "Conference rooms",
  "Private offices",
  "Open floor plan",
  "Kitchen / break room",
  "Building security",
  "Fitness center",
  "Outdoor space",
  "Public transit access",
  "Signage / visibility",
];

export default function QuestionnairePage() {
  const { token } = useParams<{ token: string }>();
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [currentHeadcount, setCurrentHeadcount] = useState("");
  const [projectedHeadcount12mo, setProjectedHeadcount12mo] = useState("");
  const [revenuePerEmployee, setRevenuePerEmployee] = useState("");
  const [currentAnnualRevenue, setCurrentAnnualRevenue] = useState("");
  const [projectedRevenueGrowth, setProjectedRevenueGrowth] = useState("");
  const [sfPerEmployee, setSfPerEmployee] = useState("");
  const [criticalAmenities, setCriticalAmenities] = useState<string[]>([]);
  const [expansionTimeline, setExpansionTimeline] = useState("");
  const [budgetConstraint, setBudgetConstraint] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/questionnaire/${token}`);
      if (!res.ok) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setClientInfo(data);
      if (data.alreadyCompleted) setSubmitted(true);
      setLoading(false);
    }
    load();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const headcount = parseInt(currentHeadcount);
    const projected = parseInt(projectedHeadcount12mo);

    if (!headcount || headcount < 1) {
      setError("Current headcount is required");
      return;
    }
    if (!projected || projected < 1) {
      setError("Projected headcount is required");
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        currentHeadcount: headcount,
        projectedHeadcount12mo: projected,
      };

      if (revenuePerEmployee) body.revenuePerEmployee = parseFloat(revenuePerEmployee);
      if (currentAnnualRevenue) body.currentAnnualRevenue = parseFloat(currentAnnualRevenue);
      if (projectedRevenueGrowth) body.projectedRevenueGrowth = parseFloat(projectedRevenueGrowth);
      if (sfPerEmployee) body.sfPerEmployee = parseFloat(sfPerEmployee);
      if (criticalAmenities.length > 0) body.criticalAmenities = criticalAmenities;
      if (expansionTimeline) body.expansionTimeline = expansionTimeline;
      if (budgetConstraint) body.budgetConstraint = parseFloat(budgetConstraint);
      if (primaryGoal) body.primaryGoal = primaryGoal;

      const res = await fetch(`/api/questionnaire/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setCriticalAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-50 p-4">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-navy-900">
            Questionnaire Not Found
          </h1>
          <p className="mt-2 text-sm text-navy-500">
            This link may have expired or is invalid. Please contact your broker
            for a new link.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-50 p-4">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-navy-900">Thank You!</h1>
          <p className="mt-2 text-sm text-navy-500">
            Your responses have been submitted.{" "}
            {clientInfo?.brokerName || "Your broker"} will use this information
            to find the best space for your needs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-navy-900 sm:text-3xl">
            Space Planning Questionnaire
          </h1>
          {clientInfo?.brokerageName && (
            <p className="mt-1 text-sm text-navy-500">
              Prepared by {clientInfo.brokerageName}
            </p>
          )}
          <p className="mt-3 text-sm text-navy-600">
            Hi {clientInfo?.clientName}, your broker has asked you to complete
            this short questionnaire. Your answers help identify the best
            commercial space for your business growth.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl bg-white p-6 shadow-sm sm:p-8"
        >
          {/* Section 1: Headcount */}
          <fieldset>
            <legend className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-500">
              1. Team Size
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Current headcount"
                type="number"
                required
                min={1}
                value={currentHeadcount}
                onChange={(e) => setCurrentHeadcount(e.target.value)}
                hint="How many employees work in your office today?"
              />
              <Input
                label="Projected headcount (12 months)"
                type="number"
                required
                min={1}
                value={projectedHeadcount12mo}
                onChange={(e) => setProjectedHeadcount12mo(e.target.value)}
                hint="How many employees do you plan to have in a year?"
              />
            </div>
          </fieldset>

          {/* Section 2: Revenue */}
          <fieldset>
            <legend className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-500">
              2. Revenue Impact
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Current annual revenue"
                type="number"
                prefix="$"
                value={currentAnnualRevenue}
                onChange={(e) => setCurrentAnnualRevenue(e.target.value)}
                hint="Approximate total annual revenue"
              />
              <Input
                label="Revenue per employee"
                type="number"
                prefix="$"
                value={revenuePerEmployee}
                onChange={(e) => setRevenuePerEmployee(e.target.value)}
                hint="Average revenue generated per employee"
              />
            </div>
            <div className="mt-4">
              <Input
                label="Expected annual revenue growth"
                type="number"
                suffix="%"
                value={projectedRevenueGrowth}
                onChange={(e) => setProjectedRevenueGrowth(e.target.value)}
                hint="What % do you expect revenue to grow year-over-year?"
              />
            </div>
          </fieldset>

          {/* Section 3: Space Needs */}
          <fieldset>
            <legend className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-500">
              3. Space Requirements
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Desired SF per employee"
                type="number"
                value={sfPerEmployee}
                onChange={(e) => setSfPerEmployee(e.target.value)}
                hint="Typical: 150-250 SF per person"
              />
              <Input
                label="Monthly budget constraint"
                type="number"
                prefix="$"
                value={budgetConstraint}
                onChange={(e) => setBudgetConstraint(e.target.value)}
                hint="Max total monthly you can spend on space"
              />
            </div>
          </fieldset>

          {/* Section 4: Amenities */}
          <fieldset>
            <legend className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-500">
              4. Must-Have Amenities
            </legend>
            <p className="mb-3 text-xs text-navy-500">
              Select all that are important for your business
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {amenityChoices.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
                    criticalAmenities.includes(amenity)
                      ? "border-navy-900 bg-navy-900 text-white"
                      : "border-navy-200 text-navy-600 hover:bg-navy-50"
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Section 5: Timeline & Goals */}
          <fieldset>
            <legend className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-500">
              5. Timeline & Goals
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="When do you need new space?"
                options={timelineOptions}
                value={expansionTimeline}
                onChange={(e) => setExpansionTimeline(e.target.value)}
              />
              <Select
                label="Primary goal for new space"
                options={goalOptions}
                value={primaryGoal}
                onChange={(e) => setPrimaryGoal(e.target.value)}
              />
            </div>
          </fieldset>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" loading={submitting} className="w-full">
            Submit Questionnaire
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-navy-400">
          Your responses are confidential and shared only with your broker.
        </p>
      </div>
    </div>
  );
}
