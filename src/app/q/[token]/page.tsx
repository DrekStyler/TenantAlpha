"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { SurveyChat } from "@/components/survey/SurveyChat";
import { getIndustryConfig } from "@/lib/industry-config";
import type { SurveyMessage, SurveyPhase, ExtractedSurveyData } from "@/types/survey";

interface ClientInfo {
  clientName: string;
  company?: string;
  industry?: string;
  alreadyCompleted: boolean;
  brokerName?: string;
  brokerageName?: string;
  surveyMode?: string;
  phase?: SurveyPhase;
  messages?: SurveyMessage[];
  extractedData?: ExtractedSurveyData;
}

const timelineOptions = [
  { value: "", label: "Select timeline..." },
  { value: "IMMEDIATE", label: "Immediately (within 3 months)" },
  { value: "6_MONTHS", label: "Within 6 months" },
  { value: "12_MONTHS", label: "Within 12 months" },
  { value: "24_MONTHS", label: "Within 24 months" },
  { value: "36_PLUS_MONTHS", label: "3+ years out" },
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

  // Get industry-specific configuration
  const config = useMemo(
    () => getIndustryConfig(clientInfo?.industry),
    [clientInfo?.industry]
  );

  useEffect(() => {
    async function load() {
      // Try survey API first (returns surveyMode + session state)
      const surveyRes = await fetch(`/api/survey/${token}`);
      if (!surveyRes.ok) {
        // Fall back to questionnaire API for older clients
        const qRes = await fetch(`/api/questionnaire/${token}`);
        if (!qRes.ok) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const data = await qRes.json();
        setClientInfo(data);
        if (data.alreadyCompleted) setSubmitted(true);
        setLoading(false);
        return;
      }
      const data = await surveyRes.json();
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

  // AI Agent mode — render conversational survey
  if (clientInfo?.surveyMode === "AI_AGENT" && !submitted) {
    return (
      <SurveyChat
        token={token}
        clientName={clientInfo.clientName}
        brokerageName={clientInfo.brokerageName}
        initialMessages={clientInfo.messages ?? []}
        initialPhase={clientInfo.phase ?? "INDUSTRY_DETECTION"}
        initialExtractedData={clientInfo.extractedData ?? {}}
      />
    );
  }

  if (submitted) {
    const resultsUrl = encodeURIComponent(`/q/${token}/results`);
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
          <h1 className="text-xl font-bold text-navy-900">Your ROI Analysis is Ready!</h1>
          <p className="mt-2 text-sm text-navy-500">
            Your responses have been submitted and your personalized ROI
            analysis has been generated. Create a free account to save your
            results.
          </p>
          <a
            href={`/sign-up?redirect_url=${resultsUrl}`}
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-navy-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
          >
            Sign Up to View Results
          </a>
          <p className="mt-3 text-xs text-navy-500">
            <a
              href={`/sign-in?redirect_url=${resultsUrl}`}
              className="text-navy-700 underline hover:text-navy-900"
            >
              Already have an account? Sign in
            </a>
          </p>
          <a
            href={`/q/${token}/results`}
            className="mt-2 inline-block text-xs text-navy-400 underline hover:text-navy-600"
          >
            Skip for now
          </a>
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
              {config.teamSectionTitle}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={config.headcountLabel}
                type="number"
                required
                min={1}
                value={currentHeadcount}
                onChange={(e) => setCurrentHeadcount(e.target.value)}
                hint={config.headcountHint}
              />
              <Input
                label={config.projectedLabel}
                type="number"
                required
                min={1}
                value={projectedHeadcount12mo}
                onChange={(e) => setProjectedHeadcount12mo(e.target.value)}
                hint={config.projectedHint}
              />
            </div>
          </fieldset>

          {/* Section 2: Revenue */}
          <fieldset>
            <legend className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-500">
              {config.revenueSectionTitle}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={config.revenueLabel}
                type="number"
                prefix="$"
                value={currentAnnualRevenue}
                onChange={(e) => setCurrentAnnualRevenue(e.target.value)}
                hint={config.revenueHint}
              />
              <Input
                label={config.revenuePerPersonLabel}
                type="number"
                prefix="$"
                value={revenuePerEmployee}
                onChange={(e) => setRevenuePerEmployee(e.target.value)}
                hint={config.revenuePerPersonHint}
              />
            </div>
            <div className="mt-4">
              <Input
                label="Expected annual revenue growth"
                type="number"
                suffix="%"
                value={projectedRevenueGrowth}
                onChange={(e) => setProjectedRevenueGrowth(e.target.value)}
                hint={config.growthHint}
              />
            </div>
          </fieldset>

          {/* Section 3: Space Needs */}
          <fieldset>
            <legend className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-500">
              {config.spaceSectionTitle}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Desired SF per employee"
                type="number"
                value={sfPerEmployee}
                onChange={(e) => setSfPerEmployee(e.target.value)}
                hint={config.sfHint}
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
              {config.amenities.map((amenity) => (
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
                options={config.goals}
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
