"use client";

import type { LeaseOptionInput } from "@/engine/types";
import { EditableCell, type SelectOption } from "./EditableCell";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import {
  ESCALATION_TYPES,
  FREE_RENT_TYPES,
  RENT_STRUCTURES,
} from "@/lib/constants";
import { OPTION_COLORS } from "@/config/theme";

/** Highlight info for a single cell */
export interface CellHighlight {
  targetValue: number;
  targetDisplay: string;
  reason: string;
}

/** Map key format: `${optionIndex}:${field}` */
export type HighlightMap = Map<string, CellHighlight>;

interface EditableAssumptionsTableProps {
  inputs: LeaseOptionInput[];
  updateField: (
    optionIndex: number,
    field: keyof LeaseOptionInput,
    value: string | number
  ) => void;
  highlights?: HighlightMap;
}

interface FieldRow {
  label: string;
  field: keyof LeaseOptionInput;
  type: "currency" | "percent" | "number" | "months" | "select";
  options?: readonly SelectOption[];
  format: (value: unknown) => string;
  /** Hide this row unless condition returns true for at least one option */
  showWhen?: (inputs: LeaseOptionInput[]) => boolean;
  group: string;
}

const FIELD_ROWS: FieldRow[] = [
  // Space
  {
    label: "Rentable SF",
    field: "rentableSF",
    type: "number",
    format: (v) => Number(v).toLocaleString(),
    group: "Space",
  },
  {
    label: "Term (months)",
    field: "termMonths",
    type: "number",
    format: (v) => String(v),
    group: "Space",
  },
  // Rent
  {
    label: "Base Rent ($/SF/yr)",
    field: "baseRentY1",
    type: "currency",
    format: (v) => `$${(Number(v) || 0).toFixed(2)}`,
    group: "Rent",
  },
  {
    label: "Escalation Type",
    field: "escalationType",
    type: "select",
    options: ESCALATION_TYPES,
    format: (v) => {
      const found = ESCALATION_TYPES.find((e) => e.value === v);
      return found?.label ?? String(v);
    },
    group: "Rent",
  },
  {
    label: "Escalation %",
    field: "escalationPercent",
    type: "percent",
    format: (v) => formatPercent(Number(v)),
    group: "Rent",
  },
  {
    label: "Assumed CPI %",
    field: "cpiAssumedPercent",
    type: "percent",
    format: (v) => (v != null ? formatPercent(Number(v)) : "—"),
    showWhen: (inputs) =>
      inputs.some((inp) => inp.escalationType === "CPI"),
    group: "Rent",
  },
  // Concessions
  {
    label: "Free Rent (months)",
    field: "freeRentMonths",
    type: "number",
    format: (v) => String(v),
    group: "Concessions",
  },
  {
    label: "Free Rent Type",
    field: "freeRentType",
    type: "select",
    options: FREE_RENT_TYPES,
    format: (v) => {
      const found = FREE_RENT_TYPES.find((e) => e.value === v);
      return found?.label ?? String(v);
    },
    group: "Concessions",
  },
  {
    label: "TI Allowance ($)",
    field: "tiAllowance",
    type: "currency",
    format: (v) => (v != null && Number(v) > 0 ? formatCurrency(Number(v)) : "—"),
    group: "Concessions",
  },
  {
    label: "Buildout Cost ($)",
    field: "estimatedBuildoutCost",
    type: "currency",
    format: (v) => (v != null && Number(v) > 0 ? formatCurrency(Number(v)) : "—"),
    group: "Concessions",
  },
  // Operating
  {
    label: "Rent Structure",
    field: "rentStructure",
    type: "select",
    options: RENT_STRUCTURES,
    format: (v) => {
      const found = RENT_STRUCTURES.find((e) => e.value === v);
      return found?.label ?? String(v);
    },
    group: "Operating",
  },
  {
    label: "OpEx ($/SF/yr)",
    field: "opExPerSF",
    type: "currency",
    format: (v) => (v != null && Number(v) > 0 ? `$${Number(v).toFixed(2)}` : "—"),
    showWhen: (inputs) =>
      inputs.some((inp) => inp.rentStructure !== "GROSS"),
    group: "Operating",
  },
  {
    label: "OpEx Escalation %",
    field: "opExEscalation",
    type: "percent",
    format: (v) => (v != null && Number(v) > 0 ? formatPercent(Number(v)) : "—"),
    showWhen: (inputs) =>
      inputs.some((inp) => inp.rentStructure !== "GROSS"),
    group: "Operating",
  },
  {
    label: "Property Tax ($/SF/yr)",
    field: "propertyTax",
    type: "currency",
    format: (v) => (v != null && Number(v) > 0 ? `$${Number(v).toFixed(2)}` : "—"),
    showWhen: (inputs) =>
      inputs.some((inp) => inp.rentStructure !== "GROSS"),
    group: "Operating",
  },
  {
    label: "Parking ($/mo)",
    field: "parkingCostMonthly",
    type: "currency",
    format: (v) => (v != null && Number(v) > 0 ? formatCurrency(Number(v)) : "—"),
    group: "Operating",
  },
  {
    label: "Other Fees ($/mo)",
    field: "otherMonthlyFees",
    type: "currency",
    format: (v) => (v != null && Number(v) > 0 ? formatCurrency(Number(v)) : "—"),
    group: "Operating",
  },
  // Financial
  {
    label: "Discount Rate %",
    field: "discountRate",
    type: "percent",
    format: (v) => formatPercent(Number(v)),
    group: "Financial",
  },
];

function shortName(name: string) {
  const dash = name.indexOf(" — ");
  return dash !== -1 ? name.slice(0, dash) : name;
}

export function EditableAssumptionsTable({
  inputs,
  updateField,
  highlights,
}: EditableAssumptionsTableProps) {
  // Filter visible rows
  const visibleRows = FIELD_ROWS.filter(
    (row) => !row.showWhen || row.showWhen(inputs)
  );

  // Group rows
  const groups: { name: string; rows: FieldRow[] }[] = [];
  let currentGroup = "";
  for (const row of visibleRows) {
    if (row.group !== currentGroup) {
      currentGroup = row.group;
      groups.push({ name: currentGroup, rows: [] });
    }
    groups[groups.length - 1].rows.push(row);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[500px] text-sm">
        <thead>
          <tr className="border-b border-navy-200">
            <th className="sticky left-0 z-10 bg-white py-3 pl-4 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-navy-500">
              Assumption
            </th>
            {inputs.map((inp, i) => (
              <th
                key={i}
                className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-navy-500"
              >
                <div className="flex items-center justify-end gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        OPTION_COLORS[i % OPTION_COLORS.length],
                    }}
                  />
                  <span>{shortName(inp.optionName)}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <>
              {/* Group header */}
              <tr key={`group-${group.name}`}>
                <td
                  colSpan={inputs.length + 1}
                  className="bg-navy-50/60 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-navy-500"
                >
                  {group.name}
                </td>
              </tr>
              {group.rows.map((row) => (
                <tr
                  key={row.field}
                  className="border-b border-navy-50 hover:bg-navy-50/30"
                >
                  <td className="sticky left-0 z-10 bg-white py-2.5 pl-4 pr-4 font-medium text-navy-700">
                    {row.label}
                  </td>
                  {inputs.map((inp, i) => {
                    const rawValue = inp[row.field];
                    const displayValue = row.format(rawValue);
                    const hlKey = `${i}:${row.field}`;
                    const hl = highlights?.get(hlKey);
                    return (
                      <EditableCell
                        key={`${row.field}-${i}`}
                        value={rawValue as string | number | undefined}
                        displayValue={displayValue}
                        cellType={row.type}
                        options={row.options as SelectOption[] | undefined}
                        onChange={(val) =>
                          updateField(i, row.field, val)
                        }
                        highlight={!!hl}
                        targetDisplay={hl?.targetDisplay}
                        highlightReason={hl?.reason}
                      />
                    );
                  })}
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
