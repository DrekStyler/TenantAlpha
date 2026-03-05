"use client";

import { useEffect, useRef } from "react";
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

  // Track the previous address to detect autocomplete selections
  const prevAddressRef = useRef(address);
  const hasFetchedRef = useRef(false);

  // Auto-fetch when address changes (user selected from autocomplete)
  useEffect(() => {
    if (
      address &&
      optionId &&
      address !== prevAddressRef.current &&
      !hasFetchedRef.current
    ) {
      prevAddressRef.current = address;
      hasFetchedRef.current = true;
      fetchLocation().finally(() => {
        hasFetchedRef.current = false;
      });
    }
    // Only re-run when address or optionId changes — NOT loading/fetchLocation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, optionId]);

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
