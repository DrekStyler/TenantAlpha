"use client";

import { Badge } from "@/components/ui/Badge";
import { computeSurveyStatus, type SurveyStatus } from "@/lib/survey-status";

export interface ClientRow {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  industry?: string | null;
  companySize?: string | null;
  token: string;
  tokenExpiresAt?: string | null;
  questionnaireCompletedAt?: string | null;
  surveyMode?: string | null;
  updatedAt: string;
  _count: { deals: number };
  surveySession?: {
    phase: string;
    updatedAt: string;
    createdAt: string;
  } | null;
}

interface ClientTableProps {
  clients: ClientRow[];
  onCopyLink: (token: string) => void;
  onEdit: (client: ClientRow) => void;
  onDelete: (id: string) => void;
  onViewQuestionnaire: (clientId: string) => void;
  onRegenerateToken: (clientId: string) => void;
}

const sizeLabels: Record<string, string> = {
  SOLO: "1",
  SMALL: "2-10",
  MEDIUM: "11-50",
  LARGE: "51-200",
  ENTERPRISE: "200+",
};

function SurveyStatusCell({
  status,
  onViewQuestionnaire,
  onRegenerateToken,
}: {
  status: SurveyStatus;
  onViewQuestionnaire: () => void;
  onRegenerateToken: () => void;
}) {
  switch (status.state) {
    case "completed": {
      const date = new Date(status.completedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      return (
        <button
          type="button"
          onClick={onViewQuestionnaire}
          title="View questionnaire responses"
        >
          <Badge
            variant="success"
            className="cursor-pointer transition-colors hover:bg-emerald-100"
          >
            Completed
          </Badge>
          <p className="mt-0.5 text-[10px] text-navy-400">{date}</p>
        </button>
      );
    }

    case "in_progress":
      return (
        <div>
          <Badge variant="default">In Progress</Badge>
          <p className="mt-0.5 text-[10px] text-navy-400">
            {status.phaseLabel}
          </p>
          <p className="text-[10px] text-navy-400">{status.lastActivity}</p>
        </div>
      );

    case "expired":
      return (
        <div>
          <Badge variant="error">Expired</Badge>
          <button
            type="button"
            onClick={onRegenerateToken}
            className="mt-0.5 block text-[10px] font-medium text-navy-600 underline decoration-navy-300 hover:text-navy-900"
          >
            Regenerate
          </button>
        </div>
      );

    case "pending": {
      const expiryWarning =
        status.daysUntilExpiry !== null && status.daysUntilExpiry <= 7;
      return (
        <div>
          <Badge variant="warning">Pending</Badge>
          {status.daysUntilExpiry !== null && (
            <p
              className={`mt-0.5 text-[10px] ${expiryWarning ? "font-medium text-amber-600" : "text-navy-400"}`}
            >
              Expires in {status.daysUntilExpiry}d
            </p>
          )}
        </div>
      );
    }
  }
}

export function ClientTable({
  clients,
  onCopyLink,
  onEdit,
  onDelete,
  onViewQuestionnaire,
  onRegenerateToken,
}: ClientTableProps) {
  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-navy-200 bg-white py-14 text-center shadow-[0_1px_3px_0_rgb(16_42_67/0.04)]">
        <p className="text-sm font-medium text-navy-900">No clients yet</p>
        <p className="mt-2 text-xs text-navy-500">
          Add a client to send them an economic questionnaire
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-navy-200 bg-white shadow-[0_1px_3px_0_rgb(16_42_67/0.06),0_1px_2px_-1px_rgb(16_42_67/0.06)]">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="border-b border-navy-200 bg-navy-50/60">
            <th className="py-3 pl-5 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-500">
              Client
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-500">
              Industry
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-navy-500">
              Size
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-navy-500">
              Deals
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-navy-500">
              Survey
            </th>
            <th className="px-4 py-3 pr-5 text-right text-xs font-semibold uppercase tracking-wide text-navy-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => {
            const status = computeSurveyStatus(client);
            return (
              <tr
                key={client.id}
                className="group border-b border-navy-100/60 transition-colors hover:bg-navy-50/40"
              >
                <td className="py-3.5 pl-5 pr-3">
                  <div>
                    <span className="font-medium text-navy-900">
                      {client.name}
                    </span>
                    {client.company && (
                      <p className="mt-0.5 text-xs text-navy-500">{client.company}</p>
                    )}
                    {client.email && (
                      <p className="text-xs text-navy-400">{client.email}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5 text-navy-600">
                  {client.industry || "\u2014"}
                </td>
                <td className="px-4 py-3.5 text-center tabular-nums text-navy-600">
                  {client.companySize
                    ? sizeLabels[client.companySize] || client.companySize
                    : "\u2014"}
                </td>
                <td className="px-4 py-3.5 text-center tabular-nums text-navy-600">
                  {client._count.deals}
                </td>
                <td className="px-4 py-3.5 text-center">
                  <SurveyStatusCell
                    status={status}
                    onViewQuestionnaire={() => onViewQuestionnaire(client.id)}
                    onRegenerateToken={() => onRegenerateToken(client.id)}
                  />
                </td>
                <td className="px-4 py-3.5 pr-5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onCopyLink(client.token)}
                      className="rounded-md px-2.5 py-1.5 text-xs font-medium text-navy-600 transition-colors hover:bg-navy-100 hover:text-navy-900"
                      title="Copy questionnaire link"
                    >
                      Link
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(client)}
                      className="rounded-md px-2.5 py-1.5 text-xs font-medium text-navy-600 transition-colors hover:bg-navy-100 hover:text-navy-900"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(client.id)}
                      className="rounded-md px-2.5 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
