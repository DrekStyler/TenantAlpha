"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatDistanceToNow } from "date-fns";

type DealStatus = "DRAFT" | "CALCULATED" | "EXPORTED" | "ARCHIVED";

interface DealCardProps {
  id: string;
  dealName: string;
  clientName?: string | null;
  propertyType: string;
  status: DealStatus;
  updatedAt: string | Date;
  optionCount: number;
  onDelete?: (id: string) => void;
}

const statusVariants: Record<
  DealStatus,
  "default" | "success" | "warning" | "gold"
> = {
  DRAFT: "default",
  CALCULATED: "success",
  EXPORTED: "gold",
  ARCHIVED: "warning",
};

export function DealCard({
  id,
  dealName,
  clientName,
  status,
  updatedAt,
  optionCount,
  onDelete,
}: DealCardProps) {
  const href =
    status === "CALCULATED" || status === "EXPORTED"
      ? `/deals/${id}/results`
      : `/deals/${id}/edit`;

  return (
    <div className="group flex flex-col gap-3 rounded-xl border border-navy-100 bg-white p-4 transition-shadow hover:shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={href}
            className="line-clamp-1 font-semibold text-navy-900 hover:text-navy-700"
          >
            {dealName}
          </Link>
          {clientName && (
            <p className="mt-0.5 text-sm text-navy-500">{clientName}</p>
          )}
        </div>
        <Badge variant={statusVariants[status]}>
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-xs text-navy-400">
        <span>{optionCount} option{optionCount !== 1 ? "s" : ""}</span>
        <span>
          Updated {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
        </span>
      </div>

      <div className="flex gap-2">
        <Link
          href={href}
          className="flex-1 rounded-lg border border-navy-200 py-1.5 text-center text-xs font-medium text-navy-700 hover:bg-navy-50"
        >
          {status === "CALCULATED" || status === "EXPORTED"
            ? "View Results"
            : "Edit"}
        </Link>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(id)}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
