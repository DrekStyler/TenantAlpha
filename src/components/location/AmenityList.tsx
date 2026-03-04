"use client";

import { useState } from "react";
import type { AmenityResult } from "@/types/location";
import { AMENITY_CATEGORIES } from "@/types/location";

interface AmenityListProps {
  amenities: AmenityResult[];
  compact?: boolean;
}

export function AmenityList({ amenities, compact = false }: AmenityListProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Group amenities by category
  const grouped = AMENITY_CATEGORIES.map((cat) => {
    const items = amenities
      .filter((a) => a.category === cat.key)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
    const avgDistance =
      items.length > 0
        ? Math.round(
            items.reduce((s, a) => s + a.distanceMeters, 0) / items.length
          )
        : 0;
    return { ...cat, items, avgDistance };
  }).filter((g) => g.items.length > 0);

  if (grouped.length === 0) {
    return (
      <p className="text-sm text-navy-400 italic">
        No nearby amenities found
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {grouped.map((group) => (
        <div key={group.key}>
          <button
            type="button"
            onClick={() =>
              setExpandedCategory(
                expandedCategory === group.key ? null : group.key
              )
            }
            className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-navy-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span>{group.icon}</span>
              <span className="font-medium text-navy-700">{group.label}</span>
              <span className="rounded-full bg-navy-100 px-1.5 py-0.5 text-xs tabular-nums text-navy-600">
                {group.items.length}
              </span>
            </span>
            <span className="text-xs text-navy-400">
              avg {formatDistance(group.avgDistance)}
            </span>
          </button>

          {!compact && expandedCategory === group.key && (
            <div className="ml-8 space-y-0.5 pb-1">
              {group.items.map((item, i) => (
                <div
                  key={`${item.name}-${i}`}
                  className="flex items-center justify-between text-xs text-navy-500"
                >
                  <span className="truncate pr-2">{item.name}</span>
                  <span className="shrink-0 tabular-nums">
                    {formatDistance(item.distanceMeters)}
                    {item.rating != null && (
                      <span className="ml-1.5 text-amber-500">
                        {item.rating.toFixed(1)}★
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
