import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { leaseOptionSchema } from "@/schemas/option";
import { ok, unauthorized, notFound, forbidden, badRequest } from "@/lib/api";

async function verifyDealOwnership(dealId: string, userId: string) {
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) return "not_found";
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

  const deal = await verifyDealOwnership(dealId, userId);
  if (deal === "not_found") return notFound("Deal");
  if (deal === "forbidden") return forbidden();

  const options = await prisma.leaseOption.findMany({
    where: { dealId },
    orderBy: { sortOrder: "asc" },
  });

  return ok(options);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();
  const { dealId } = await params;

  const deal = await verifyDealOwnership(dealId, userId);
  if (deal === "not_found") return notFound("Deal");
  if (deal === "forbidden") return forbidden();

  const body = await req.json();
  const parsed = leaseOptionSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const count = await prisma.leaseOption.count({ where: { dealId } });
  if (count >= 5) return badRequest("Maximum 5 options per deal");

  const option = await prisma.leaseOption.create({
    data: { ...parsed.data, dealId, sortOrder: parsed.data.sortOrder ?? count },
  });

  return ok(option, 201);
}
