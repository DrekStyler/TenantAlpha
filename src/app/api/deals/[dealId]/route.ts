import { auth } from "@clerk/nextjs/server";
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

  const updated = await prisma.deal.update({
    where: { id: dealId },
    data: parsed.data,
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
