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

  if (!API_KEY || API_KEY === "placeholder") {
    return ok({ predictions: [] });
  }

  try {
    // Use the new Places API (v1) — matches the API enabled for nearby search
    const placesRes = await fetch(
      "https://places.googleapis.com/v1/places:autocomplete",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY,
        },
        body: JSON.stringify({
          input,
          includedPrimaryTypes: ["street_address", "subpremise", "premise", "route"],
          ...(sessionToken ? { sessionToken } : {}),
        }),
      }
    );

    if (!placesRes.ok) {
      console.error("[places/autocomplete] API error:", placesRes.status, await placesRes.text());
      return ok({ predictions: [] });
    }

    const data = await placesRes.json();
    const suggestions = data.suggestions ?? [];

    const predictions = suggestions
      .filter((s: { placePrediction?: unknown }) => s.placePrediction)
      .map(
        (s: {
          placePrediction: {
            placeId: string;
            text: { text: string };
            structuredFormat?: {
              mainText?: { text: string };
              secondaryText?: { text: string };
            };
          };
        }) => ({
          placeId: s.placePrediction.placeId,
          description: s.placePrediction.text.text,
          mainText: s.placePrediction.structuredFormat?.mainText?.text ?? "",
          secondaryText: s.placePrediction.structuredFormat?.secondaryText?.text ?? "",
        })
      );

    return ok({ predictions });
  } catch (err) {
    console.error("Autocomplete error:", err);
    return ok({ predictions: [] });
  }
}
