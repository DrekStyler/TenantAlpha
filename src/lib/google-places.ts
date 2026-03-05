import type { GeocodedLocation, AmenityResult, AmenityCategory } from "@/types/location";
import { AMENITY_CATEGORIES } from "@/types/location";

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Geocode a street address to lat/lng using the Google Geocoding API.
 * Returns null if the address can't be geocoded.
 */
export async function geocodeAddress(
  address: string
): Promise<GeocodedLocation | null> {
  if (!API_KEY || API_KEY === "placeholder") {
    console.error("GOOGLE_MAPS_API_KEY not configured");
    return null;
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("key", API_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = await res.json();
  if (data.status !== "OK" || !data.results?.length) return null;

  const result = data.results[0];
  return {
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
    formattedAddress: result.formatted_address,
  };
}

/**
 * Fetch nearby amenities using Google Places API (New) — Nearby Search.
 * Makes one API call per category (8 total).
 */
export async function fetchNearbyAmenities(
  lat: number,
  lng: number,
  radiusMeters: number = 1600
): Promise<AmenityResult[]> {
  if (!API_KEY || API_KEY === "placeholder") {
    console.error("GOOGLE_MAPS_API_KEY not configured");
    return [];
  }

  const allAmenities: AmenityResult[] = [];

  for (const category of AMENITY_CATEGORIES) {
    const body = {
      includedTypes: [category.placeType],
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radiusMeters,
        },
      },
      maxResultCount: 10,
    };

    try {
      const res = await fetch(
        "https://places.googleapis.com/v1/places:searchNearby",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": API_KEY,
            "X-Goog-FieldMask":
              "places.displayName,places.location,places.rating,places.formattedAddress",
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) continue;
      const data = await res.json();

      for (const place of data.places ?? []) {
        const placeLat = place.location?.latitude;
        const placeLng = place.location?.longitude;
        if (placeLat == null || placeLng == null) continue;

        const distanceMeters = haversineDistance(lat, lng, placeLat, placeLng);

        allAmenities.push({
          category: category.key as AmenityCategory,
          name: place.displayName?.text ?? "Unknown",
          latitude: placeLat,
          longitude: placeLng,
          distanceMeters: Math.round(distanceMeters),
          rating: place.rating ?? undefined,
          address: place.formattedAddress ?? undefined,
        });
      }
    } catch (err) {
      console.error(`Places API error for ${category.key}:`, err);
      continue;
    }
  }

  return allAmenities;
}

/**
 * Haversine distance in meters between two lat/lng points.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
