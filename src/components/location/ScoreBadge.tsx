"use client";

interface ScoreBadgeProps {
  score: number; // 0–100
  label: "Walk" | "Drive";
  size?: "sm" | "md";
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-green-700 bg-green-50 border-green-200";
  if (score >= 40) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-red-700 bg-red-50 border-red-200";
}

function scoreRing(score: number): string {
  if (score >= 70) return "border-green-500";
  if (score >= 40) return "border-amber-500";
  return "border-red-500";
}

function scoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Very Good";
  if (score >= 50) return "Good";
  if (score >= 25) return "Fair";
  return "Limited";
}

export function ScoreBadge({ score, label, size = "md" }: ScoreBadgeProps) {
  if (size === "sm") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${scoreColor(score)}`}
      >
        <span>{label}</span>
        <span className="tabular-nums">{score}</span>
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full border-3 ${scoreRing(score)}`}
      >
        <span className="text-lg font-bold tabular-nums text-navy-900">
          {score}
        </span>
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-navy-500">
        {label} Score
      </span>
      <span className={`text-xs font-medium ${score >= 70 ? "text-green-600" : score >= 40 ? "text-amber-600" : "text-red-600"}`}>
        {scoreLabel(score)}
      </span>
    </div>
  );
}
