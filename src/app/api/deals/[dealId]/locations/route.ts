import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, notFound, forbidden } from "@/lib/api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { dealId } = await params;
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      options: {
        orderBy: { sortOrder: "asc" },
        include: { amenities: true },
      },
    },
  });

  if (!deal) return notFound("Deal");
  if (deal.userId !== userId) return forbidden();

  const locations = deal.options.map((opt) => ({
    optionId: opt.id,
    optionName: opt.optionName,
    propertyAddress: opt.propertyAddress,
    location:
      opt.latitude != null
        ? {
            latitude: opt.latitude!,
            longitude: opt.longitude!,
            formattedAddress: opt.formattedAddress,
            walkScore: opt.walkScore,
            driveScore: opt.driveScore,
            amenities: opt.amenities.map((a) => ({
              category: a.category,
              name: a.name,
              latitude: a.latitude,
              longitude: a.longitude,
              distanceMeters: a.distanceMeters,
              rating: a.rating,
              address: a.address,
            })),
            fetchedAt: opt.locationFetchedAt?.toISOString() ?? null,
          }
        : null,
  }));

  return ok({ locations });
}
