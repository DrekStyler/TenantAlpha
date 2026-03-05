"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import type { OptionLocationSummary } from "@/types/location";
import { OPTION_COLORS } from "@/config/theme";
import { AMENITY_CATEGORIES } from "@/types/location";

interface LocationMapProps {
  locations: OptionLocationSummary[];
  showAmenities?: boolean;
  height?: string;
  selectedOptionId?: string;
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

/** Fit map bounds to show all markers */
function MapBoundsHandler({
  locations,
}: {
  locations: OptionLocationSummary[];
}) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (!map || fitted.current) return;
    const points = locations
      .filter((l) => l.location)
      .map((l) => ({
        lat: l.location!.latitude,
        lng: l.location!.longitude,
      }));
    if (points.length === 0) return;

    if (points.length === 1) {
      map.setCenter(points[0]);
      map.setZoom(15);
    } else {
      const bounds = new google.maps.LatLngBounds();
      points.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, 60);
    }
    fitted.current = true;
  }, [map, locations]);

  return null;
}

export function LocationMap({
  locations,
  showAmenities = false,
  height = "400px",
}: LocationMapProps) {
  const [selectedMarker, setSelectedMarker] = useState<{
    name: string;
    lat: number;
    lng: number;
    detail?: string;
  } | null>(null);

  const locationsWithData = useMemo(
    () => locations.filter((l) => l.location),
    [locations]
  );

  const amenityCategoryMap = useMemo(
    () => Object.fromEntries(AMENITY_CATEGORIES.map((c) => [c.key, c])),
    []
  );

  const handleMarkerClick = useCallback(
    (name: string, lat: number, lng: number, detail?: string) => {
      setSelectedMarker({ name, lat, lng, detail });
    },
    []
  );

  if (!API_KEY || API_KEY === "placeholder") {
    return (
      <div
        className="flex items-center justify-center rounded-xl border-2 border-dashed border-navy-200 bg-navy-50"
        style={{ height }}
      >
        <p className="text-sm text-navy-400">
          Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable maps
        </p>
      </div>
    );
  }

  if (locationsWithData.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border-2 border-dashed border-navy-200 bg-navy-50"
        style={{ height }}
      >
        <p className="text-sm text-navy-400">
          No geocoded locations to display
        </p>
      </div>
    );
  }

  const defaultCenter = {
    lat: locationsWithData[0].location!.latitude,
    lng: locationsWithData[0].location!.longitude,
  };

  return (
    <div className="overflow-hidden rounded-xl border border-navy-200" style={{ height }}>
      <APIProvider apiKey={API_KEY}>
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={13}
          mapId="tenant-alpha-map"
          gestureHandling="cooperative"
          disableDefaultUI={false}
          style={{ width: "100%", height: "100%" }}
        >
          <MapBoundsHandler locations={locations} />

          {/* Property markers */}
          {locationsWithData.map((loc, i) => (
            <AdvancedMarker
              key={loc.optionId}
              position={{
                lat: loc.location!.latitude,
                lng: loc.location!.longitude,
              }}
              onClick={() =>
                handleMarkerClick(
                  loc.optionName,
                  loc.location!.latitude,
                  loc.location!.longitude,
                  `Walk: ${loc.location!.walkScore ?? "—"} | Drive: ${loc.location!.driveScore ?? "—"}`
                )
              }
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-md"
                style={{ backgroundColor: OPTION_COLORS[i % OPTION_COLORS.length] }}
              >
                {String.fromCharCode(65 + i)}
              </div>
            </AdvancedMarker>
          ))}

          {/* Amenity markers */}
          {showAmenities &&
            locationsWithData.flatMap((loc) =>
              (loc.location!.amenities ?? []).map((amenity, j) => (
                <AdvancedMarker
                  key={`${loc.optionId}-${amenity.category}-${j}`}
                  position={{
                    lat: amenity.latitude,
                    lng: amenity.longitude,
                  }}
                  onClick={() =>
                    handleMarkerClick(
                      amenity.name,
                      amenity.latitude,
                      amenity.longitude,
                      `${amenityCategoryMap[amenity.category]?.label ?? amenity.category}${amenity.rating != null ? ` — ${amenity.rating.toFixed(1)}/5` : ""}`
                    )
                  }
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-navy-600 shadow-sm border border-navy-200">
                    {amenityCategoryMap[amenity.category]?.abbr ?? "?"}
                  </div>
                </AdvancedMarker>
              ))
            )}

          {/* Info window */}
          {selectedMarker && (
            <InfoWindow
              position={{
                lat: selectedMarker.lat,
                lng: selectedMarker.lng,
              }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="px-1 py-0.5">
                <p className="text-sm font-semibold">{selectedMarker.name}</p>
                {selectedMarker.detail && (
                  <p className="text-xs text-gray-600">
                    {selectedMarker.detail}
                  </p>
                )}
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
