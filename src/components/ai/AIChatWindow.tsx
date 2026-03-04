"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { ComparisonResult } from "@/engine/types";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AIChatWindowProps {
  dealId: string;
  calculationResults: ComparisonResult;
}

export function AIChatWindow({ dealId, calculationResults }: AIChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!input.trim() || isLoading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: input.trim(),
      };

      const assistantId = (Date.now() + 1).toString();
      const assistantMsg: Message = { id: assistantId, role: "assistant", content: "" };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setIsLoading(true);
      setError("");

      try {
        const history = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dealId, calculationResults, messages: history }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError((data as { error?: string }).error ?? "Failed to get response.");
          setIsLoading(false);
          return;
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let text = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          const snapshot = text;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: snapshot } : m))
          );
        }
      } catch {
        setError("Failed to connect to AI. Check your API key.");
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, dealId, calculationResults]
  );

  const STARTERS = [
    "Which option has the lowest risk?",
    "What are the hidden costs in Option A?",
    "How does free rent affect the true cost?",
    "Explain the TI gap impact on cash flow.",
  ];

  return (
    <div className="flex flex-col" style={{ minHeight: 360 }}>
      <div className="flex-1 space-y-4 overflow-y-auto py-3" style={{ maxHeight: 420 }}>
        {messages.length === 0 && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-navy-500">
              Ask me anything about this lease analysis. I have full context on all
              options and their calculated metrics.
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="rounded-full border border-navy-200 px-3.5 py-2 text-xs text-navy-600 transition-colors hover:border-navy-400 hover:bg-navy-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
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
                m.content.split("\n").filter(Boolean).map((line, i) => (
                  <p key={i} className="mb-1 last:mb-0">
                    {line}
                  </p>
                ))
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

      <form
        onSubmit={handleSubmit}
        className="mt-4 flex items-end gap-3 border-t border-navy-200 pt-4"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about options, risks, or trade-offs…"
          rows={2}
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
    </div>
  );
}
