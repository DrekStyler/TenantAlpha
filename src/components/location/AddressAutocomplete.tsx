"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from "react";

interface Prediction {
  placeId: string;
  description: string;
  mainText?: string;
  secondaryText?: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  /** Google Places API v1 locationBias — passed through as-is */
  locationBias?: Record<string, unknown>;
  includedPrimaryTypes?: string[];
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  error,
  label = "Property Address",
  placeholder = "Start typing an address…",
  locationBias,
  includedPrimaryTypes,
}: AddressAutocompleteProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionTokenRef = useRef(crypto.randomUUID());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listboxId = "address-autocomplete-listbox";

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch predictions with debounce
  const fetchPredictions = useCallback(async (input: string) => {
    if (input.length < 3) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/places/autocomplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          sessionToken: sessionTokenRef.current,
          ...(locationBias ? { locationBias } : {}),
          ...(includedPrimaryTypes?.length ? { includedPrimaryTypes } : {}),
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
      setLoading(false);
    }
  }, [locationBias, includedPrimaryTypes]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    // Debounce API calls
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(val), 300);
  };

  const handleSelectPrediction = (prediction: Prediction) => {
    onChange(prediction.description);
    onSelect(prediction.description);
    setPredictions([]);
    setShowDropdown(false);
    setActiveIndex(-1);
    // Reset session token for next autocomplete session
    sessionTokenRef.current = crypto.randomUUID();
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || predictions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) =>
          i < predictions.length - 1 ? i + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) =>
          i > 0 ? i - 1 : predictions.length - 1
        );
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

  const inputId = label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-navy-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? `address-option-${activeIndex}` : undefined
          }
          aria-autocomplete="list"
          autoComplete="off"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (predictions.length > 0) setShowDropdown(true);
          }}
          placeholder={placeholder}
          className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-navy-900 placeholder-navy-300 transition-colors focus:outline-none focus:ring-2 focus:ring-navy-500 ${
            error
              ? "border-red-400 focus:ring-red-400"
              : "border-navy-200 hover:border-navy-300"
          }`}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-navy-200 border-t-navy-500" />
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Dropdown */}
      {showDropdown && predictions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-navy-200 bg-white shadow-lg"
        >
          {predictions.map((prediction, index) => (
            <li
              key={prediction.placeId}
              id={`address-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectPrediction(prediction);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={`cursor-pointer px-4 py-2.5 text-sm transition-colors ${
                index === activeIndex ? "bg-navy-50" : "hover:bg-navy-50"
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
  );
}
