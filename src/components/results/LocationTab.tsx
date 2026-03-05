"use client";

import { useDealLocations } from "@/hooks/useLocationData";
import { LocationMap } from "@/components/location/LocationMap";
import { ScoreBadge } from "@/components/location/ScoreBadge";
import { AmenityList } from "@/components/location/AmenityList";
import { Spinner } from "@/components/ui/Spinner";
import { OPTION_COLORS } from "@/config/theme";
import { AMENITY_CATEGORIES } from "@/types/location";

interface LocationTabProps {
  dealId: string;
}

export function LocationTab({ dealId }: LocationTabProps) {
  const { locations, loading } = useDealLocations(dealId);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const locationsWithData = locations.filter((l) => l.location);

  if (locationsWithData.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-navy-200 py-14 text-center">
        <p className="text-sm font-medium text-navy-900">
          No location data available
        </p>
        <p className="mt-2 text-xs text-navy-500">
          Enter property addresses in the Edit page and click "Fetch Location
          Data" to see walk scores, drive scores, and nearby amenities.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Map */}
      <LocationMap
        locations={locations}
        showAmenities
        height="450px"
      />

      {/* Score Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="border-b border-navy-200">
              <th className="py-3 pl-1 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-500">
                Metric
              </th>
              {locationsWithData.map((loc, i) => (
                <th
                  key={loc.optionId}
                  className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide"
                  style={{ color: OPTION_COLORS[i % OPTION_COLORS.length] }}
                >
                  {loc.optionName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Walk Score */}
            <tr className="border-b border-navy-50">
              <td className="py-3 pl-1 pr-3 font-medium text-navy-700">
                Walk Score
              </td>
              {locationsWithData.map((loc) => {
                const score = loc.location!.walkScore;
                const isBest =
                  score != null &&
                  score ===
                    Math.max(
                      ...locationsWithData
                        .map((l) => l.location!.walkScore)
                        .filter((s): s is number => s != null)
                    );
                return (
                  <td
                    key={loc.optionId}
                    className={`px-4 py-3 text-center ${isBest ? "font-bold text-green-700" : "text-navy-600"}`}
                  >
                    {score ?? "—"}
                  </td>
                );
              })}
            </tr>
            {/* Drive Score */}
            <tr className="border-b border-navy-50">
              <td className="py-3 pl-1 pr-3 font-medium text-navy-700">
                Drive Score
              </td>
              {locationsWithData.map((loc) => {
                const score = loc.location!.driveScore;
                const isBest =
                  score != null &&
                  score ===
                    Math.max(
                      ...locationsWithData
                        .map((l) => l.location!.driveScore)
                        .filter((s): s is number => s != null)
                    );
                return (
                  <td
                    key={loc.optionId}
                    className={`px-4 py-3 text-center ${isBest ? "font-bold text-green-700" : "text-navy-600"}`}
                  >
                    {score ?? "—"}
                  </td>
                );
              })}
            </tr>
            {/* Amenity counts by category */}
            {AMENITY_CATEGORIES.map((cat) => {
              const counts = locationsWithData.map(
                (loc) =>
                  (loc.location!.amenities ?? []).filter(
                    (a) => a.category === cat.key
                  ).length
              );
              const maxCount = Math.max(...counts);
              if (maxCount === 0) return null;
              return (
                <tr key={cat.key} className="border-b border-navy-50">
                  <td className="py-2.5 pl-1 pr-3 text-navy-600">
                    <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded bg-navy-100 text-[10px] font-bold text-navy-600">{cat.abbr}</span>
                    {cat.label}
                  </td>
                  {counts.map((count, i) => (
                    <td
                      key={locationsWithData[i].optionId}
                      className={`px-4 py-2.5 text-center tabular-nums ${count === maxCount && count > 0 ? "font-semibold text-green-700" : "text-navy-600"}`}
                    >
                      {count}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detailed Amenity Lists per Option */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {locationsWithData.map((loc, i) => (
          <div
            key={loc.optionId}
            className="rounded-xl border border-navy-200 p-4"
          >
            <h4
              className="mb-3 text-sm font-semibold"
              style={{ color: OPTION_COLORS[i % OPTION_COLORS.length] }}
            >
              {loc.optionName}
            </h4>
            <p className="mb-2 text-xs text-navy-400 truncate">
              {loc.location!.formattedAddress ?? loc.propertyAddress}
            </p>
            <AmenityList amenities={loc.location!.amenities ?? []} />
          </div>
        ))}
      </div>
    </div>
  );
}
