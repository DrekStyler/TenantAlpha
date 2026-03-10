import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, notFound, forbidden, badRequest, tooManyRequests } from "@/lib/api";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { geocodeAddress, fetchNearbyAmenities } from "@/lib/google-places";
import { computeWalkScore, computeDriveScore } from "@/lib/location-scores";

/** Cache duration: 30 days */
const CACHE_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ dealId: string; optionId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { dealId, optionId } = await params;
  const option = await prisma.leaseOption.findFirst({
    where: { id: optionId, dealId },
    include: {
      deal: { select: { userId: true } },
      amenities: true,
    },
  });
  if (!option) return notFound("Option");
  if (option.deal.userId !== userId) return forbidden();

  if (!option.latitude || !option.longitude) {
    return ok({ location: null });
  }

  return ok({
    location: {
      latitude: option.latitude,
      longitude: option.longitude,
      formattedAddress: option.formattedAddress,
      walkScore: option.walkScore,
      driveScore: option.driveScore,
      amenities: option.amenities.map((a) => ({
        category: a.category,
        name: a.name,
        latitude: a.latitude,
        longitude: a.longitude,
        distanceMeters: a.distanceMeters,
        rating: a.rating,
        address: a.address,
      })),
      fetchedAt: option.locationFetchedAt?.toISOString() ?? null,
    },
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ dealId: string; optionId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const rl = checkRateLimit(`location:${userId}`, RATE_LIMITS.location);
  if (!rl.allowed) return tooManyRequests(rl.retryAfterMs);

  const { dealId, optionId } = await params;
  const option = await prisma.leaseOption.findFirst({
    where: { id: optionId, dealId },
    include: { deal: { select: { userId: true } } },
  });
  if (!option) return notFound("Option");
  if (option.deal.userId !== userId) return forbidden();

  // Accept address from body as fallback (handles race with form auto-save)
  const body = await req.json().catch(() => ({})) as { address?: string };
  const address = option.propertyAddress ?? body.address;
  if (!address) {
    return badRequest("No property address set for this option. Please enter an address and save first.");
  }

  // If the DB didn't have the address, persist it now
  if (!option.propertyAddress && address) {
    await prisma.leaseOption.update({
      where: { id: optionId },
      data: { propertyAddress: address },
    });
  }

  // Check cache freshness
  if (option.locationFetchedAt && option.latitude != null) {
    const age = Date.now() - option.locationFetchedAt.getTime();
    if (age < CACHE_DURATION_MS) {
      const amenities = await prisma.locationAmenity.findMany({
        where: { optionId },
      });
      return ok({
        location: {
          latitude: option.latitude,
          longitude: option.longitude,
          formattedAddress: option.formattedAddress,
          walkScore: option.walkScore,
          driveScore: option.driveScore,
          amenities: amenities.map((a) => ({
            category: a.category,
            name: a.name,
            latitude: a.latitude,
            longitude: a.longitude,
            distanceMeters: a.distanceMeters,
            rating: a.rating,
            address: a.address,
          })),
          fetchedAt: option.locationFetchedAt!.toISOString(),
        },
        cached: true,
      });
    }
  }

  // Geocode the address
  const geo = await geocodeAddress(address);
  if (!geo) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === "placeholder") {
      return badRequest(
        "Google Maps API key not configured. Please set GOOGLE_MAPS_API_KEY in your environment variables."
      );
    }
    return badRequest(
      "Could not geocode this address. Please check the address and try again."
    );
  }

  // Fetch amenities (1600m radius covers both walk and drive)
  const amenities = await fetchNearbyAmenities(
    geo.latitude,
    geo.longitude,
    1600
  );

  // Compute scores
  const walkScore = computeWalkScore(amenities);
  const driveScore = computeDriveScore(amenities);

  // Clear old amenities and save new ones
  await prisma.locationAmenity.deleteMany({ where: { optionId } });

  if (amenities.length > 0) {
    await prisma.locationAmenity.createMany({
      data: amenities.map((a) => ({
        optionId,
        category: a.category,
        name: a.name,
        latitude: a.latitude,
        longitude: a.longitude,
        distanceMeters: a.distanceMeters,
        rating: a.rating ?? null,
        address: a.address ?? null,
      })),
    });
  }

  // Update option with geocoded data and scores
  await prisma.leaseOption.update({
    where: { id: optionId },
    data: {
      latitude: geo.latitude,
      longitude: geo.longitude,
      formattedAddress: geo.formattedAddress,
      walkScore,
      driveScore,
      locationFetchedAt: new Date(),
    },
  });

  return ok({
    location: {
      latitude: geo.latitude,
      longitude: geo.longitude,
      formattedAddress: geo.formattedAddress,
      walkScore,
      driveScore,
      amenities,
      fetchedAt: new Date().toISOString(),
    },
    cached: false,
  });
}
