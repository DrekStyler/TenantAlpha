"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export type CellType = "currency" | "percent" | "number" | "months" | "select";

export interface SelectOption {
  value: string;
  label: string;
}

interface EditableCellProps {
  value: string | number | undefined;
  displayValue: string;
  cellType: CellType;
  options?: readonly SelectOption[];
  onChange: (value: string | number) => void;
  className?: string;
  /** Highlight this cell as negotiable */
  highlight?: boolean;
  /** Formatted target value to show under the current value */
  targetDisplay?: string;
  /** Tooltip reason for the highlight */
  highlightReason?: string;
}

export function EditableCell({
  value,
  displayValue,
  cellType,
  options,
  onChange,
  className = "",
  highlight = false,
  targetDisplay,
  highlightReason,
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [editing]);

  const startEdit = useCallback(() => {
    if (cellType === "select") {
      setEditing(true);
      setEditValue(String(value ?? ""));
    } else {
      setEditing(true);
      const raw = value ?? "";
      setEditValue(String(raw));
    }
  }, [value, cellType]);

  const commitEdit = useCallback(() => {
    setEditing(false);
    if (cellType === "select") {
      onChange(editValue);
      return;
    }
    const cleaned = editValue.replace(/[$,%\s]/g, "").replace(/,/g, "");
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      onChange(num);
    }
  }, [editValue, cellType, onChange]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitEdit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelEdit();
      }
    },
    [commitEdit, cancelEdit]
  );

  const highlightBg = highlight ? "bg-amber-50/70" : "";
  const highlightBorder = highlight ? "border-l-2 border-l-amber-400" : "";

  if (editing && cellType === "select" && options) {
    return (
      <td className={`px-3 py-2 ${highlightBg} ${highlightBorder} ${className}`}>
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            onChange(e.target.value);
            setEditing(false);
          }}
          onBlur={() => setEditing(false)}
          onKeyDown={handleKeyDown}
          className="w-full rounded border border-navy-300 bg-white px-2 py-1 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </td>
    );
  }

  if (editing) {
    return (
      <td className={`px-3 py-2 ${highlightBg} ${highlightBorder} ${className}`}>
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          inputMode="decimal"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className="w-full rounded border border-navy-300 bg-white px-2 py-1 text-right text-sm tabular-nums text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
        />
      </td>
    );
  }

  return (
    <td
      className={`cursor-pointer px-3 py-2 text-right tabular-nums text-sm transition-colors hover:bg-navy-50 ${highlightBg} ${highlightBorder} ${className}`}
      onClick={startEdit}
      title={highlightReason || "Click to edit"}
    >
      <div className="text-navy-700">{displayValue}</div>
      {highlight && targetDisplay && (
        <div className="mt-0.5 text-[10px] font-medium text-amber-600">
          Target: {targetDisplay}
        </div>
      )}
    </td>
  );
}
