"use client";

import { useOptionLocation } from "@/hooks/useLocationData";
import { ScoreBadge } from "./ScoreBadge";
import { AmenityList } from "./AmenityList";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface LocationPreviewProps {
  dealId: string;
  optionId?: string;
  address?: string;
}

export function LocationPreview({
  dealId,
  optionId,
  address,
}: LocationPreviewProps) {
  const { location, loading, error, fetchLocation } = useOptionLocation(
    dealId,
    optionId
  );

  // Don't render until we have a saved option with an address
  if (!optionId || !address) return null;

  return (
    <div className="col-span-2 rounded-xl border border-navy-200 bg-navy-50/50 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-navy-500">
          Location Intelligence
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchLocation}
          loading={loading}
        >
          {location ? "Refresh" : "Fetch Location Data"}
        </Button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}

      {loading && !location && (
        <div className="flex justify-center py-6">
          <Spinner size="sm" />
        </div>
      )}

      {!loading && !location && !error && (
        <p className="mt-2 text-xs text-navy-400">
          Click &quot;Fetch Location Data&quot; to get walk/drive scores and nearby amenities.
        </p>
      )}

      {location && (
        <div className="mt-3 space-y-3">
          {/* Scores */}
          <div className="flex items-center gap-6">
            {location.walkScore != null && (
              <ScoreBadge score={location.walkScore} label="Walk" size="sm" />
            )}
            {location.driveScore != null && (
              <ScoreBadge score={location.driveScore} label="Drive" size="sm" />
            )}
            {location.formattedAddress && (
              <span className="text-xs text-navy-400 truncate">
                {location.formattedAddress}
              </span>
            )}
          </div>

          {/* Amenity summary */}
          {location.amenities.length > 0 && (
            <AmenityList amenities={location.amenities} compact />
          )}
        </div>
      )}
    </div>
  );
}
