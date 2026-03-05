import { auth } from "@clerk/nextjs/server";
import { ok, unauthorized, badRequest } from "@/lib/api";

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const body = await req.json();
  const { input, sessionToken } = body as {
    input?: string;
    sessionToken?: string;
  };

  if (!input || typeof input !== "string" || input.length < 2) {
    return badRequest("Input must be at least 2 characters");
  }

  if (!API_KEY) {
    return badRequest("Google Maps API not configured");
  }

  try {
    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/autocomplete/json"
    );
    url.searchParams.set("input", input);
    url.searchParams.set("key", API_KEY);
    url.searchParams.set("types", "address");
    if (sessionToken) {
      url.searchParams.set("sessiontoken", sessionToken);
    }

    const placesRes = await fetch(url.toString());
    const data = await placesRes.json();

    if (data.status === "OK" && data.predictions) {
      return ok({
        predictions: data.predictions.map(
          (p: { place_id: string; description: string }) => ({
            placeId: p.place_id,
            description: p.description,
          })
        ),
      });
    }

    return ok({ predictions: [] });
  } catch (err) {
    console.error("Autocomplete error:", err);
    return ok({ predictions: [] });
  }
}
