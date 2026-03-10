import { auth } from "@clerk/nextjs/server";
import { ok, unauthorized, badRequest } from "@/lib/api";

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const body = await req.json();
  const { address } = body as { address?: string };

  if (!address || typeof address !== "string" || address.length < 2) {
    return badRequest("Address must be at least 2 characters");
  }

  if (!API_KEY || API_KEY === "placeholder") {
    return badRequest("Google Maps API key not configured");
  }

  try {
    const geocodeRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`
    );

    if (!geocodeRes.ok) {
      console.error("[places/geocode] API error:", geocodeRes.status);
      return badRequest("Geocoding failed");
    }

    const data = await geocodeRes.json();
    const results = data.results ?? [];

    if (results.length === 0) {
      return badRequest("Could not find this location. Please try a different search term.");
    }

    const result = results[0];
    const viewport = result.geometry?.viewport;
    const formattedAddress = result.formatted_address ?? address;

    if (!viewport) {
      // Fallback: use location point with a rough bounding box (~50km)
      const loc = result.geometry?.location;
      if (!loc) return badRequest("No geometry data for this location");

      const offset = 0.5; // ~50km
      return ok({
        bounds: {
          ne: { lat: loc.lat + offset, lng: loc.lng + offset },
          sw: { lat: loc.lat - offset, lng: loc.lng - offset },
        },
        formattedAddress,
      });
    }

    return ok({
      bounds: {
        ne: { lat: viewport.northeast.lat, lng: viewport.northeast.lng },
        sw: { lat: viewport.southwest.lat, lng: viewport.southwest.lng },
      },
      formattedAddress,
    });
  } catch (err) {
    console.error("Geocode error:", err);
    return badRequest("Geocoding failed. Please try again.");
  }
}
