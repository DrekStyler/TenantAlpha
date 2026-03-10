"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface ClientOption {
  id: string;
  name: string;
  company?: string | null;
}

interface LatLng {
  lat: number;
  lng: number;
}

interface SearchLocationBounds {
  ne: LatLng;
  sw: LatLng;
}

interface SearchInfoProps {
  dealId: string;
  deal: {
    clientId?: string | null;
    clientName?: string | null;
    searchLocation?: string | null;
    searchLocationBounds?: SearchLocationBounds | null;
    targetSF?: number | null;
  };
  onDealChange: () => void;
}

export function SearchInfo({ dealId, deal, onDealChange }: SearchInfoProps) {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(deal.clientId ?? "");
  const [locationInput, setLocationInput] = useState(deal.searchLocation ?? "");
  const [geocoding, setGeocoding] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [targetSF, setTargetSF] = useState(deal.targetSF?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const sfDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch clients list
  useEffect(() => {
    fetch("/api/clients")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setClients(data));
  }, []);

  // PATCH helper
  const patchDeal = useCallback(
    async (data: Record<string, unknown>) => {
      setSaving(true);
      try {
        const res = await fetch(`/api/deals/${dealId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) onDealChange();
      } finally {
        setSaving(false);
      }
    },
    [dealId, onDealChange]
  );

  // Handle client change
  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    setSelectedClientId(clientId);

    if (clientId) {
      const client = clients.find((c) => c.id === clientId);
      patchDeal({
        clientId,
        clientName: client?.company || client?.name || "",
      });
    } else {
      patchDeal({ clientId: null, clientName: null });
    }
  };

  // Handle search location geocoding
  const handleSetLocation = async () => {
    const text = locationInput.trim();
    if (!text) return;

    setGeocoding(true);
    setLocationError("");
    try {
      const res = await fetch("/api/places/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLocationError(
          (data as { error?: string }).error ?? "Could not geocode location"
        );
        return;
      }

      const { bounds, formattedAddress } = await res.json();
      setLocationInput(formattedAddress);
      await patchDeal({
        searchLocation: formattedAddress,
        searchLocationBounds: bounds,
      });
    } catch {
      setLocationError("Failed to geocode. Please try again.");
    } finally {
      setGeocoding(false);
    }
  };

  // Handle nationwide (clear bounds)
  const handleNationwide = () => {
    setLocationInput("");
    setLocationError("");
    patchDeal({
      searchLocation: null,
      searchLocationBounds: null,
    });
  };

  // Handle target SF with debounced save
  const handleTargetSFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTargetSF(val);

    if (sfDebounceRef.current) clearTimeout(sfDebounceRef.current);
    sfDebounceRef.current = setTimeout(() => {
      const num = parseInt(val, 10);
      if (val === "" || val === "0") {
        patchDeal({ targetSF: null });
      } else if (!isNaN(num) && num > 0) {
        patchDeal({ targetSF: num });
      }
    }, 800);
  };

  return (
    <Card padding="md">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-navy-500">
          Search Information
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Client Selector */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="search-client"
              className="text-sm font-medium text-navy-700"
            >
              Client
            </label>
            <select
              id="search-client"
              value={selectedClientId}
              onChange={handleClientChange}
              className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 transition-colors hover:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500"
            >
              <option value="">No client linked</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company ? `${c.name} (${c.company})` : c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Location */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="search-location"
              className="text-sm font-medium text-navy-700"
            >
              Search Location
            </label>
            <div className="flex gap-2">
              <input
                id="search-location"
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSetLocation();
                  }
                }}
                placeholder="e.g. Downtown Chicago, IL"
                className="min-w-0 flex-1 rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder-navy-300 transition-colors hover:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSetLocation}
                loading={geocoding}
                disabled={!locationInput.trim()}
              >
                Set
              </Button>
            </div>
            {locationError && (
              <p className="text-xs text-red-500">{locationError}</p>
            )}
            {deal.searchLocation && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-navy-100 px-2.5 py-0.5 text-xs font-medium text-navy-700">
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {deal.searchLocation}
                </span>
                <button
                  type="button"
                  onClick={handleNationwide}
                  className="text-xs text-navy-400 underline hover:text-navy-600"
                >
                  Clear (Nationwide)
                </button>
              </div>
            )}
            {!deal.searchLocation && (
              <p className="text-xs text-navy-400">
                Nationwide (no location bias)
              </p>
            )}
          </div>

          {/* Target SF */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="search-target-sf"
              className="text-sm font-medium text-navy-700"
            >
              Target Square Footage
            </label>
            <input
              id="search-target-sf"
              type="number"
              min={0}
              value={targetSF}
              onChange={handleTargetSFChange}
              placeholder="e.g. 10000"
              className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder-navy-300 transition-colors hover:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500"
            />
            <p className="text-xs text-navy-400">
              Auto-populates new option SF
            </p>
          </div>
        </div>

        {saving && (
          <p className="text-xs text-navy-400">Saving...</p>
        )}
      </div>
    </Card>
  );
}
