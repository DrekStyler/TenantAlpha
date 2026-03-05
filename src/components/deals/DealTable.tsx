"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PROPERTY_TYPES, DEAL_STAGE_CONFIG } from "@/lib/constants";
import type { DealStage } from "@/schemas/deal";

// ─── Types ──────────────────────────────────────────────────────

type DealStatus = "DRAFT" | "CALCULATED" | "EXPORTED" | "ARCHIVED";

export interface DealRow {
  id: string;
  dealName: string;
  clientName?: string | null;
  propertyType: string;
  status: DealStatus;
  stage: DealStage;
  updatedAt: string;
  _count: { options: number };
  options: { rentableSF: number }[];
}

type SortKey =
  | "dealName"
  | "clientName"
  | "propertyType"
  | "sfRange"
  | "stage"
  | "status"
  | "optionCount";

type SortDir = "asc" | "desc";

type EditableField = "dealName" | "clientName" | "propertyType" | "stage";

interface EditingCell {
  dealId: string;
  field: EditableField;
}

interface DealTableProps {
  deals: DealRow[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
}

// ─── Status Badge Mapping ───────────────────────────────────────

const statusVariants: Record<DealStatus, "default" | "success" | "warning" | "gold"> = {
  DRAFT: "default",
  CALCULATED: "success",
  EXPORTED: "gold",
  ARCHIVED: "warning",
};

// ─── Sort Arrow ─────────────────────────────────────────────────

function SortArrow({
  columnKey,
  activeKey,
  dir,
}: {
  columnKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
}) {
  if (columnKey !== activeKey) {
    return <span className="ml-1 text-navy-300">{"\u2195"}</span>;
  }
  return (
    <span className="ml-1 text-navy-700">
      {dir === "asc" ? "\u2191" : "\u2193"}
    </span>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function getSFDisplay(options: { rentableSF: number }[]): string {
  if (options.length === 0) return "\u2014";
  const sfs = options.map((o) => o.rentableSF);
  const min = Math.min(...sfs);
  const max = Math.max(...sfs);
  if (min === max) return min.toLocaleString();
  return `${min.toLocaleString()}\u2013${max.toLocaleString()}`;
}

function getMinSF(options: { rentableSF: number }[]): number {
  if (options.length === 0) return 0;
  return Math.min(...options.map((o) => o.rentableSF));
}

function getPropertyLabel(value: string): string {
  return PROPERTY_TYPES.find((p) => p.value === value)?.label ?? value;
}

function getStageConfig(value: string) {
  return DEAL_STAGE_CONFIG.find((s) => s.value === value);
}

function getDealHref(deal: DealRow): string {
  return deal.status === "CALCULATED" || deal.status === "EXPORTED"
    ? `/deals/${deal.id}/results`
    : `/deals/${deal.id}/edit`;
}

// ─── Component ──────────────────────────────────────────────────

export function DealTable({ deals, onDelete, onUpdate }: DealTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("dealName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [editingCell]);

  // ─── Sorting ────────────────────────────────────────────────

  const handleHeaderClick = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey]
  );

  const sortedDeals = useMemo(() => {
    const stageOrder = DEAL_STAGE_CONFIG.map((s) => s.value);
    return [...deals].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "dealName":
          cmp = a.dealName.localeCompare(b.dealName);
          break;
        case "clientName":
          cmp = (a.clientName ?? "").localeCompare(b.clientName ?? "");
          break;
        case "propertyType":
          cmp = a.propertyType.localeCompare(b.propertyType);
          break;
        case "sfRange":
          cmp = getMinSF(a.options) - getMinSF(b.options);
          break;
        case "stage":
          cmp = stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "optionCount":
          cmp = a._count.options - b._count.options;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [deals, sortKey, sortDir]);

  // ─── Inline Editing ─────────────────────────────────────────

  const startEdit = useCallback(
    (dealId: string, field: EditableField, currentValue: string) => {
      if (saving) return;
      setEditingCell({ dealId, field });
      setEditValue(currentValue);
    },
    [saving]
  );

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue("");
  }, []);

  const commitEdit = useCallback(
    async (dealId: string, field: EditableField, value: string) => {
      setEditingCell(null);
      if (!value.trim() && field === "dealName") return; // Don't allow empty deal name
      setSaving(true);
      try {
        await onUpdate(dealId, { [field]: value || null });
      } catch {
        // Silently fail — the value will revert on next fetch
      } finally {
        setSaving(false);
      }
    },
    [onUpdate]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, dealId: string, field: EditableField) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitEdit(dealId, field, editValue);
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelEdit();
      }
    },
    [editValue, commitEdit, cancelEdit]
  );

  const handleSelectChange = useCallback(
    (dealId: string, field: EditableField, value: string) => {
      setEditingCell(null);
      setSaving(true);
      onUpdate(dealId, { [field]: value })
        .catch(() => {})
        .finally(() => setSaving(false));
    },
    [onUpdate]
  );

  // ─── Empty State ────────────────────────────────────────────

  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-navy-200 py-20 text-center">
        <p className="text-lg font-medium text-navy-900">No analyses yet</p>
        <p className="mt-2 text-sm text-navy-500">
          Start by comparing 2-5 lease options
        </p>
        <Link href="/deals/new" className="mt-4">
          <Button>Start New Analysis</Button>
        </Link>
      </div>
    );
  }

  // ─── Table Header Helper ────────────────────────────────────

  const thClass =
    "py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-500 cursor-pointer select-none hover:text-navy-700 transition-colors";

  return (
    <div className="overflow-x-auto rounded-xl border border-navy-200 bg-white shadow-sm">
      <table className="w-full min-w-[800px] text-sm">
        <thead>
          <tr className="border-b border-navy-200 bg-navy-50/50">
            <th
              className={`${thClass} pl-5 pr-3`}
              onClick={() => handleHeaderClick("dealName")}
            >
              Deal
              <SortArrow
                columnKey="dealName"
                activeKey={sortKey}
                dir={sortDir}
              />
            </th>
            <th
              className={`${thClass} px-4`}
              onClick={() => handleHeaderClick("clientName")}
            >
              Client
              <SortArrow
                columnKey="clientName"
                activeKey={sortKey}
                dir={sortDir}
              />
            </th>
            <th
              className={`${thClass} px-4`}
              onClick={() => handleHeaderClick("propertyType")}
            >
              Type
              <SortArrow
                columnKey="propertyType"
                activeKey={sortKey}
                dir={sortDir}
              />
            </th>
            <th
              className={`${thClass} px-4 text-right`}
              onClick={() => handleHeaderClick("sfRange")}
            >
              Space (SF)
              <SortArrow
                columnKey="sfRange"
                activeKey={sortKey}
                dir={sortDir}
              />
            </th>
            <th
              className={`${thClass} px-4`}
              onClick={() => handleHeaderClick("stage")}
            >
              Stage
              <SortArrow
                columnKey="stage"
                activeKey={sortKey}
                dir={sortDir}
              />
            </th>
            <th
              className={`${thClass} px-4`}
              onClick={() => handleHeaderClick("status")}
            >
              Status
              <SortArrow
                columnKey="status"
                activeKey={sortKey}
                dir={sortDir}
              />
            </th>
            <th
              className={`${thClass} px-4 text-center`}
              onClick={() => handleHeaderClick("optionCount")}
            >
              Opts
              <SortArrow
                columnKey="optionCount"
                activeKey={sortKey}
                dir={sortDir}
              />
            </th>
            <th className="py-3 px-4 pr-5 text-right text-xs font-semibold uppercase tracking-wide text-navy-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedDeals.map((deal) => {
            const href = getDealHref(deal);
            const stageConfig = getStageConfig(deal.stage);
            const isEditing = (field: EditableField) =>
              editingCell?.dealId === deal.id && editingCell.field === field;

            return (
              <tr
                key={deal.id}
                className="group border-b border-navy-50 transition-colors hover:bg-navy-50/50"
              >
                {/* Deal Name */}
                <td className="py-3.5 pl-5 pr-3">
                  {isEditing("dealName") ? (
                    <input
                      ref={inputRef as React.RefObject<HTMLInputElement>}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() =>
                        commitEdit(deal.id, "dealName", editValue)
                      }
                      onKeyDown={(e) => handleKeyDown(e, deal.id, "dealName")}
                      className="w-full min-w-[140px] rounded border border-navy-300 bg-white px-2 py-1 text-sm font-medium text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Link
                        href={href}
                        className="font-medium text-navy-900 hover:text-navy-700 hover:underline"
                      >
                        {deal.dealName}
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(deal.id, "dealName", deal.dealName);
                        }}
                        className="rounded p-0.5 text-navy-300 opacity-0 transition-opacity hover:text-navy-600 group-hover:opacity-100"
                        title="Edit name"
                      >
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </td>

                {/* Client */}
                <td className="px-4 py-3.5">
                  {isEditing("clientName") ? (
                    <input
                      ref={inputRef as React.RefObject<HTMLInputElement>}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() =>
                        commitEdit(deal.id, "clientName", editValue)
                      }
                      onKeyDown={(e) =>
                        handleKeyDown(e, deal.id, "clientName")
                      }
                      placeholder="Add client..."
                      className="w-full min-w-[100px] rounded border border-navy-300 bg-white px-2 py-1 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                    />
                  ) : (
                    <span
                      className="cursor-pointer text-navy-600 transition-colors hover:text-navy-900"
                      onClick={() =>
                        startEdit(
                          deal.id,
                          "clientName",
                          deal.clientName ?? ""
                        )
                      }
                      title="Click to edit"
                    >
                      {deal.clientName || (
                        <span className="text-navy-300 italic">Add client...</span>
                      )}
                    </span>
                  )}
                </td>

                {/* Property Type */}
                <td className="px-4 py-3.5">
                  {isEditing("propertyType") ? (
                    <select
                      ref={inputRef as React.RefObject<HTMLSelectElement>}
                      value={editValue}
                      onChange={(e) =>
                        handleSelectChange(
                          deal.id,
                          "propertyType",
                          e.target.value
                        )
                      }
                      onBlur={cancelEdit}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="rounded border border-navy-300 bg-white px-2 py-1 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                    >
                      {PROPERTY_TYPES.map((pt) => (
                        <option key={pt.value} value={pt.value}>
                          {pt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className="cursor-pointer text-navy-600 transition-colors hover:text-navy-900"
                      onClick={() =>
                        startEdit(deal.id, "propertyType", deal.propertyType)
                      }
                      title="Click to edit"
                    >
                      {getPropertyLabel(deal.propertyType)}
                    </span>
                  )}
                </td>

                {/* Space (SF) */}
                <td className="px-4 py-3.5 text-right tabular-nums text-navy-600">
                  {getSFDisplay(deal.options)}
                </td>

                {/* Stage */}
                <td className="px-4 py-3.5">
                  {isEditing("stage") ? (
                    <select
                      ref={inputRef as React.RefObject<HTMLSelectElement>}
                      value={editValue}
                      onChange={(e) =>
                        handleSelectChange(deal.id, "stage", e.target.value)
                      }
                      onBlur={cancelEdit}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="rounded border border-navy-300 bg-white px-2 py-1 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                    >
                      {DEAL_STAGE_CONFIG.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`inline-flex cursor-pointer items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-80 ${stageConfig?.color ?? "bg-navy-100 text-navy-700"}`}
                      onClick={() =>
                        startEdit(deal.id, "stage", deal.stage)
                      }
                      title="Click to change stage"
                    >
                      {stageConfig?.label ?? deal.stage}
                    </span>
                  )}
                </td>

                {/* Status */}
                <td className="px-4 py-3.5">
                  <Badge variant={statusVariants[deal.status]}>
                    {deal.status.charAt(0) + deal.status.slice(1).toLowerCase()}
                  </Badge>
                </td>

                {/* Options Count */}
                <td className="px-4 py-3.5 text-center tabular-nums text-navy-600">
                  {deal._count.options}
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5 pr-5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={href}
                      className="rounded-md px-2.5 py-1.5 text-xs font-medium text-navy-600 transition-colors hover:bg-navy-100 hover:text-navy-900"
                    >
                      {deal.status === "CALCULATED" ||
                      deal.status === "EXPORTED"
                        ? "Results"
                        : "Edit"}
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDelete(deal.id)}
                      className="rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
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
