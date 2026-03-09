"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { SurveyProgress } from "./SurveyProgress";
import { SurveyReview } from "./SurveyReview";
import { renderMarkdown } from "@/lib/markdown";
import type { SurveyMessage, SurveyPhase, ExtractedSurveyData } from "@/types/survey";

interface SurveyChatProps {
  token: string;
  clientName: string;
  brokerageName?: string;
  initialMessages: SurveyMessage[];
  initialPhase: SurveyPhase;
  initialExtractedData: ExtractedSurveyData;
}

const INDUSTRY_LABELS: Record<string, string> = {
  MEDICAL: "Healthcare / Medical",
  LEGAL: "Law Firm / Legal",
  AEROSPACE_DEFENSE: "Aerospace & Defense",
  TECH: "Technology",
  FINANCIAL: "Financial Services",
  GENERAL_OFFICE: "General Office",
};

/**
 * Parse multiple choice options from an assistant message.
 * Matches lines like "A) Option text"
 */
function parseChoices(content: string): { letter: string; text: string }[] {
  const lines = content.split("\n");
  const choices: { letter: string; text: string }[] = [];
  for (const line of lines) {
    const match = line.trim().match(/^([A-Z])\)\s+(.+)$/);
    if (match) {
      choices.push({ letter: match[1], text: match[2] });
    }
  }
  return choices;
}

export function SurveyChat({
  token,
  clientName,
  brokerageName,
  initialMessages,
  initialPhase,
  initialExtractedData,
}: SurveyChatProps) {
  const [messages, setMessages] = useState<SurveyMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<SurveyPhase>(initialPhase);
  const [extractedData, setExtractedData] = useState<ExtractedSurveyData>(initialExtractedData);
  const [showReview, setShowReview] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [dealId, setDealId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-start the conversation if no messages exist
  useEffect(() => {
    if (messages.length === 0 && phase === "INDUSTRY_DETECTION") {
      sendMessage("Hi, I'm ready to get started!");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback(
    async (messageText?: string) => {
      const text = messageText ?? input.trim();
      if (!text || isLoading) return;

      const userMsg: SurveyMessage = {
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };

      const assistantMsg: SurveyMessage = {
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      if (!messageText) setInput("");
      setIsLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/survey/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError((data as { error?: string }).error ?? "Failed to get response.");
          setIsLoading(false);
          return;
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
          const snapshot = fullText;
          setMessages((prev) =>
            prev.map((m, i) =>
              i === prev.length - 1 && m.role === "assistant"
                ? { ...m, content: snapshot }
                : m
            )
          );
        }

        // Refresh session state to get updated phase and extractedData
        const stateRes = await fetch(`/api/survey/${token}`);
        if (stateRes.ok) {
          const state = await stateRes.json();
          setPhase(state.phase);
          setExtractedData(state.extractedData);

          if (state.phase === "REVIEW") {
            setShowReview(true);
          }
        }
      } catch {
        setError("Failed to connect. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, token]
  );

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      sendMessage();
    },
    [sendMessage]
  );

  const handleComplete = useCallback(async () => {
    setCompleting(true);
    setError("");
    try {
      const res = await fetch(`/api/survey/${token}/complete`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to complete survey.");
      }
      const result = await res.json();
      setDealId(result.dealId);
      setPhase("COMPLETED");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setCompleting(false);
    }
  }, [token]);

  // Completed state
  if (phase === "COMPLETED" && dealId) {
    const resultsUrl = encodeURIComponent(`/q/${token}/results`);
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-50 p-4">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-navy-900">Your ROI Analysis is Ready!</h1>
          <p className="mt-2 text-sm text-navy-500">
            Create a free account to save your results and access them anytime.
          </p>
          <a
            href={`/sign-up?redirect_url=${resultsUrl}`}
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-navy-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
          >
            Sign Up & View Results
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

  // Parse choices from the last assistant message for clickable buttons
  const lastMsg = messages[messages.length - 1];
  const lastAssistantChoices =
    !isLoading && lastMsg?.role === "assistant" && lastMsg.content
      ? parseChoices(lastMsg.content)
      : [];
  const hasOtherOption = lastAssistantChoices.some(
    (c) => c.text.toLowerCase().startsWith("other")
  );
  const nonOtherChoices = lastAssistantChoices.filter(
    (c) => !c.text.toLowerCase().startsWith("other")
  );

  return (
    <div className="min-h-screen bg-navy-50 px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-4 text-center">
          <h1 className="text-xl font-bold text-navy-900 sm:text-2xl">
            Business Needs Assessment
          </h1>
          {brokerageName && (
            <p className="mt-0.5 text-xs text-navy-500">Powered by {brokerageName}</p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4 rounded-xl bg-white p-3 shadow-sm">
          <SurveyProgress currentPhase={phase} />
        </div>

        {/* Industry Badge */}
        {extractedData.industry && (
          <div className="mb-3 flex justify-center">
            <span className="rounded-full bg-navy-900 px-3 py-1 text-xs font-semibold text-white">
              {INDUSTRY_LABELS[extractedData.industry] ?? extractedData.industry}
            </span>
          </div>
        )}

        {/* Review Panel */}
        {showReview && (
          <div className="mb-4">
            <SurveyReview
              data={extractedData}
              onConfirm={handleComplete}
              loading={completing}
            />
          </div>
        )}

        {/* Chat Window */}
        <div className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
          <div
            className="space-y-3 overflow-y-auto"
            style={{ maxHeight: showReview ? 300 : 480 }}
          >
            {messages.map((m, i) => (
              <div
                key={`${m.timestamp}-${i}`}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-navy-900 text-white"
                      : "bg-navy-50 text-navy-800"
                  }`}
                >
                  {m.content ? (
                    <div className="[&>*:last-child]:mb-0">
                      {renderMarkdown(m.content)}
                    </div>
                  ) : (
                    <Spinner size="sm" />
                  )}
                </div>
              </div>
            ))}

            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Multiple Choice Buttons */}
          {phase !== "COMPLETED" && !showReview && nonOtherChoices.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-navy-100 pt-3">
              {nonOtherChoices.map((choice) => (
                <button
                  key={choice.letter}
                  type="button"
                  disabled={isLoading}
                  onClick={() => sendMessage(`${choice.letter}) ${choice.text}`)}
                  className="rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-xs font-medium text-navy-700 transition-colors hover:border-navy-400 hover:bg-navy-50 disabled:opacity-50"
                >
                  {choice.letter}) {choice.text}
                </button>
              ))}
              {hasOtherOption && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    const textarea = document.querySelector("textarea");
                    textarea?.focus();
                  }}
                  className="rounded-lg border border-dashed border-navy-300 bg-white px-3 py-1.5 text-xs font-medium text-navy-500 transition-colors hover:border-navy-400 hover:bg-navy-50 disabled:opacity-50"
                >
                  Other...
                </button>
              )}
            </div>
          )}

          {/* Text Input */}
          {phase !== "COMPLETED" && !showReview && (
            <form
              onSubmit={handleSubmit}
              className="mt-3 flex items-end gap-3 border-t border-navy-200 pt-3"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  nonOtherChoices.length > 0
                    ? "Or type your own answer..."
                    : "Type your answer..."
                }
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                className="flex-1 resize-none rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-800 placeholder:text-navy-400 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
              <Button
                type="submit"
                size="sm"
                disabled={isLoading || !input.trim()}
                loading={isLoading}
                className="shrink-0"
              >
                Send
              </Button>
            </form>
          )}
        </div>

        <p className="mt-3 text-center text-xs text-navy-400">
          Your responses are confidential and shared only with your broker.
        </p>
      </div>
    </div>
  );
}
