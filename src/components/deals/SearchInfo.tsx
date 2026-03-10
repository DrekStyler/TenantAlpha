"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type KeyboardEvent,
} from "react";
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

interface Prediction {
  placeId: string;
  description: string;
  mainText?: string;
  secondaryText?: string;
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

/** Place types for region/city autocomplete */
const LOCATION_TYPES = [
  "locality",
  "sublocality",
  "administrative_area_level_1",
  "administrative_area_level_2",
  "neighborhood",
];

export function SearchInfo({ dealId, deal, onDealChange }: SearchInfoProps) {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(deal.clientId ?? "");
  const [locationInput, setLocationInput] = useState(deal.searchLocation ?? "");
  const [geocoding, setGeocoding] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [targetSF, setTargetSF] = useState(deal.targetSF?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const sfDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Location autocomplete state
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const locationContainerRef = useRef<HTMLDivElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const sessionTokenRef = useRef(crypto.randomUUID());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listboxId = "search-location-listbox";

  // Fetch clients list
  useEffect(() => {
    fetch("/api/clients")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setClients(data));
  }, []);

  // Close location dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        locationContainerRef.current &&
        !locationContainerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  // Fetch location predictions with debounce
  const fetchLocationPredictions = useCallback(async (input: string) => {
    if (input.length < 3) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    setLoadingPredictions(true);
    try {
      const res = await fetch("/api/places/autocomplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          sessionToken: sessionTokenRef.current,
          includedPrimaryTypes: LOCATION_TYPES,
          includedRegionCodes: ["us"],
        }),
      });

      if (!res.ok) {
        setPredictions([]);
        return;
      }

      const data = await res.json();
      const items = data.predictions ?? [];
      setPredictions(items);
      setShowDropdown(items.length > 0);
      setActiveIndex(-1);
    } catch {
      setPredictions([]);
    } finally {
      setLoadingPredictions(false);
    }
  }, []);

  const handleLocationInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = e.target.value;
    setLocationInput(val);
    setLocationError("");

    // If the user clears the field, clear bounds
    if (!val.trim()) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    // Debounce autocomplete API calls
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchLocationPredictions(val), 300);
  };

  // Geocode a selected location and save to deal
  const geocodeAndSave = async (address: string) => {
    setGeocoding(true);
    setLocationError("");
    try {
      const res = await fetch("/api/places/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
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

  const handleSelectPrediction = (prediction: Prediction) => {
    setLocationInput(prediction.description);
    setPredictions([]);
    setShowDropdown(false);
    setActiveIndex(-1);
    sessionTokenRef.current = crypto.randomUUID();
    locationInputRef.current?.blur();

    // Geocode the selected place and save bounds
    geocodeAndSave(prediction.description);
  };

  const handleLocationKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || predictions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i < predictions.length - 1 ? i + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i > 0 ? i - 1 : predictions.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < predictions.length) {
          handleSelectPrediction(predictions[activeIndex]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setActiveIndex(-1);
        break;
    }
  };

  // When the user clears the field and leaves, clear bounds
  const handleLocationBlur = () => {
    // Small timeout to allow dropdown click to register
    setTimeout(() => {
      if (!locationInput.trim() && deal.searchLocation) {
        patchDeal({
          searchLocation: null,
          searchLocationBounds: null,
        });
      }
    }, 200);
  };

  // Handle nationwide (clear bounds)
  const handleNationwide = () => {
    setLocationInput("");
    setLocationError("");
    setPredictions([]);
    setShowDropdown(false);
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

          {/* Search Location with Autocomplete */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="search-location"
              className="text-sm font-medium text-navy-700"
            >
              Search Location
            </label>
            <div ref={locationContainerRef} className="relative">
              <div className="relative">
                <input
                  ref={locationInputRef}
                  id="search-location"
                  type="text"
                  role="combobox"
                  aria-expanded={showDropdown}
                  aria-controls={listboxId}
                  aria-activedescendant={
                    activeIndex >= 0
                      ? `location-option-${activeIndex}`
                      : undefined
                  }
                  aria-autocomplete="list"
                  autoComplete="off"
                  value={locationInput}
                  onChange={handleLocationInputChange}
                  onKeyDown={handleLocationKeyDown}
                  onBlur={handleLocationBlur}
                  onFocus={() => {
                    if (predictions.length > 0) setShowDropdown(true);
                  }}
                  placeholder="e.g. Downtown Chicago, IL"
                  className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder-navy-300 transition-colors hover:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500"
                />
                {(loadingPredictions || geocoding) && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-navy-200 border-t-navy-500" />
                  </div>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {showDropdown && predictions.length > 0 && (
                <ul
                  id={listboxId}
                  role="listbox"
                  className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-navy-200 bg-white shadow-lg"
                >
                  {predictions.map((prediction, index) => (
                    <li
                      key={prediction.placeId}
                      id={`location-option-${index}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectPrediction(prediction);
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`cursor-pointer px-4 py-2.5 text-sm transition-colors ${
                        index === activeIndex
                          ? "bg-navy-50"
                          : "hover:bg-navy-50"
                      } ${index === 0 ? "rounded-t-lg" : ""}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <svg
                          className="mt-0.5 h-4 w-4 shrink-0 text-navy-400"
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
                        <div className="min-w-0 flex-1">
                          {prediction.mainText ? (
                            <>
                              <span className="font-medium text-navy-900">
                                {prediction.mainText}
                              </span>
                              {prediction.secondaryText && (
                                <span className="ml-1 text-navy-400">
                                  {prediction.secondaryText}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-navy-900 truncate">
                              {prediction.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                  <li className="border-t border-navy-100 px-4 py-1.5">
                    <span className="text-[10px] text-navy-300">
                      Powered by Google
                    </span>
                  </li>
                </ul>
              )}
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
            {geocoding && (
              <p className="text-xs text-navy-400">
                Setting location bounds…
              </p>
            )}
            {!deal.searchLocation && !geocoding && (
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
