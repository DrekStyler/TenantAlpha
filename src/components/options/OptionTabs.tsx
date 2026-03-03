"use client";

import { useState } from "react";
import { OptionForm } from "./OptionForm";

interface OptionTabsProps {
  dealId: string;
  options: Array<{
    id: string;
    optionName: string;
    sortOrder: number;
    [key: string]: unknown;
  }>;
  onOptionsChange: () => void;
}

export function OptionTabs({
  dealId,
  options,
  onOptionsChange,
}: OptionTabsProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div>
      {/* Tab Bar */}
      <div className="flex gap-1 overflow-x-auto border-b border-navy-100 pb-0">
        {options.map((opt, i) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setActiveTab(i)}
            className={`shrink-0 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === i
                ? "border-b-2 border-navy-900 text-navy-900"
                : "text-navy-400 hover:text-navy-700"
            }`}
          >
            {opt.optionName || `Option ${String.fromCharCode(65 + i)}`}
          </button>
        ))}
      </div>

      {/* Active Option Form */}
      <div className="mt-6">
        {options[activeTab] && (
          <OptionForm
            key={options[activeTab].id}
            dealId={dealId}
            optionId={options[activeTab].id}
            initialData={options[activeTab] as Parameters<typeof OptionForm>[0]["initialData"]}
            onSaved={onOptionsChange}
            index={activeTab}
          />
        )}
      </div>
    </div>
  );
}
