"use client";

import { useState, useEffect, useCallback } from "react";
import type { LocationData, OptionLocationSummary } from "@/types/location";

/**
 * Fetch and manage location data for a single lease option.
 * Loads cached data on mount, provides `fetchLocation()` to trigger a fresh fetch.
 */
export function useOptionLocation(
  dealId: string,
  optionId: string | undefined,
  address?: string
) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Trigger a fresh geocode + amenity fetch (POST)
  const fetchLocation = useCallback(async () => {
    if (!optionId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/deals/${dealId}/options/${optionId}/location`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: address ?? "" }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(
          (data as { error?: string }).error ?? "Failed to fetch location data"
        );
        return;
      }
      setLocation(data.location);
    } catch {
      setError("Failed to fetch location data");
    } finally {
      setLoading(false);
    }
  }, [dealId, optionId, address]);

  // Load cached data on mount (GET)
  useEffect(() => {
    if (!optionId) return;
    fetch(`/api/deals/${dealId}/options/${optionId}/location`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.location) setLocation(data.location);
      })
      .catch(() => {});
  }, [dealId, optionId]);

  return { location, loading, error, fetchLocation };
}

/**
 * Fetch location data for all options in a deal.
 * Used by Results and Negotiate pages for map + comparison views.
 */
export function useDealLocations(dealId: string) {
  const [locations, setLocations] = useState<OptionLocationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/deals/${dealId}/locations`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.locations) setLocations(data.locations);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dealId]);

  return { locations, loading };
}
