"use client";

import { useDealLocations } from "@/hooks/useLocationData";
import { ScoreBadge } from "@/components/location/ScoreBadge";
import { LocationMap } from "@/components/location/LocationMap";
import { Card, CardHeader } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { OPTION_COLORS } from "@/config/theme";

interface LocationSidebarProps {
  dealId: string;
}

export function LocationSidebar({ dealId }: LocationSidebarProps) {
  const { locations, loading } = useDealLocations(dealId);

  const locationsWithData = locations.filter((l) => l.location);

  if (loading) {
    return (
      <Card>
        <CardHeader title="Location Scores" />
        <div className="flex justify-center py-6">
          <Spinner size="sm" />
        </div>
      </Card>
    );
  }

  if (locationsWithData.length === 0) {
    return null; // Don't show anything if no location data
  }

  return (
    <Card>
      <CardHeader title="Location Scores" />
      <div className="space-y-4 px-5 pb-5">
        {/* Compact map */}
        <LocationMap
          locations={locations}
          height="180px"
        />

        {/* Score cards per option */}
        {locationsWithData.map((loc, i) => (
          <div
            key={loc.optionId}
            className="rounded-lg border border-navy-100 p-3"
          >
            <div className="mb-2 flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{
                  backgroundColor:
                    OPTION_COLORS[i % OPTION_COLORS.length],
                }}
              />
              <span className="text-xs font-semibold text-navy-700">
                {loc.optionName}
              </span>
            </div>
            <div className="flex items-center justify-around">
              {loc.location!.walkScore != null && (
                <ScoreBadge
                  score={loc.location!.walkScore}
                  label="Walk"
                  size="sm"
                />
              )}
              {loc.location!.driveScore != null && (
                <ScoreBadge
                  score={loc.location!.driveScore}
                  label="Drive"
                  size="sm"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
