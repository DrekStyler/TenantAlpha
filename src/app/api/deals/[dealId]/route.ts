import { auth } from "@clerk/nextjs/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dealSchema } from "@/schemas/deal";
import { ok, unauthorized, notFound, forbidden, badRequest } from "@/lib/api";

async function getDealOwned(dealId: string, userId: string) {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { options: { orderBy: { sortOrder: "asc" } }, aiSummary: true },
  });
  if (!deal) return null;
  if (deal.userId !== userId) return "forbidden";
  return deal;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();
  const { dealId } = await params;

  const deal = await getDealOwned(dealId, userId);
  if (!deal) return notFound("Deal");
  if (deal === "forbidden") return forbidden();

  return ok(deal);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();
  const { dealId } = await params;

  const existing = await getDealOwned(dealId, userId);
  if (!existing) return notFound("Deal");
  if (existing === "forbidden") return forbidden();

  const body = await req.json();
  const parsed = dealSchema.partial().safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  // Verify clientId belongs to this user if being updated
  if (parsed.data.clientId) {
    const client = await prisma.client.findUnique({
      where: { id: parsed.data.clientId },
      select: { userId: true },
    });
    if (!client || client.userId !== userId) {
      return forbidden();
    }
  }

  // Handle explicit null values from body for clearing fields
  if ("clientId" in body && body.clientId === null) {
    (parsed.data as Record<string, unknown>).clientId = null;
  }
  if ("searchLocation" in body && body.searchLocation === null) {
    (parsed.data as Record<string, unknown>).searchLocation = null;
  }
  if ("searchLocationBounds" in body && body.searchLocationBounds === null) {
    (parsed.data as Record<string, unknown>).searchLocationBounds = null;
  }
  if ("targetSF" in body && body.targetSF === null) {
    (parsed.data as Record<string, unknown>).targetSF = null;
  }

  // Serialize JSON fields for Prisma
  const data = { ...parsed.data };
  if (data.searchLocationBounds !== undefined) {
    data.searchLocationBounds = data.searchLocationBounds
      ? JSON.parse(JSON.stringify(data.searchLocationBounds))
      : undefined;
  }

  const updated = await prisma.deal.update({
    where: { id: dealId },
    data: data as Prisma.DealUncheckedUpdateInput,
  });

  return ok(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();
  const { dealId } = await params;

  const existing = await getDealOwned(dealId, userId);
  if (!existing) return notFound("Deal");
  if (existing === "forbidden") return forbidden();

  await prisma.deal.delete({ where: { id: dealId } });

  return ok({ deleted: true });
}
