export type SurveyStatus =
  | { state: "pending"; daysUntilExpiry: number | null }
  | { state: "expired" }
  | {
      state: "in_progress";
      phase: string;
      phaseLabel: string;
      lastActivity: string;
      daysUntilExpiry: number | null;
    }
  | { state: "completed"; completedAt: string };

const PHASE_LABELS: Record<string, string> = {
  INDUSTRY_DETECTION: "Getting started",
  INDUSTRY_QUESTIONS: "Industry details",
  LEASE_PREFERENCES: "Lease preferences",
  REVIEW: "Reviewing answers",
  COMPLETED: "Done",
};

export function getPhaseLabel(phase: string): string {
  return PHASE_LABELS[phase] || phase;
}

export function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return "just now";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

export function computeSurveyStatus(client: {
  tokenExpiresAt?: string | null;
  questionnaireCompletedAt?: string | null;
  surveySession?: {
    phase: string;
    updatedAt: string;
    createdAt: string;
  } | null;
}): SurveyStatus {
  // Completed takes priority
  if (client.questionnaireCompletedAt) {
    return {
      state: "completed",
      completedAt: client.questionnaireCompletedAt,
    };
  }

  // Check expiry
  const expiryDays = daysUntil(client.tokenExpiresAt ?? null);
  if (expiryDays !== null && expiryDays <= 0) {
    return { state: "expired" };
  }

  // In progress (survey session exists and has been started)
  if (client.surveySession) {
    return {
      state: "in_progress",
      phase: client.surveySession.phase,
      phaseLabel: getPhaseLabel(client.surveySession.phase),
      lastActivity: relativeTime(client.surveySession.updatedAt),
      daysUntilExpiry: expiryDays,
    };
  }

  // Pending — link exists but not started
  return { state: "pending", daysUntilExpiry: expiryDays };
}
