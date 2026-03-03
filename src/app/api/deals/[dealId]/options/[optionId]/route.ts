import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { leaseOptionSchema } from "@/schemas/option";
import { ok, unauthorized, notFound, forbidden, badRequest } from "@/lib/api";

async function getOptionOwned(optionId: string, dealId: string, userId: string) {
  const option = await prisma.leaseOption.findFirst({
    where: { id: optionId, dealId },
    include: { deal: { select: { userId: true } } },
  });
  if (!option) return null;
  if (option.deal.userId !== userId) return "forbidden";
  return option;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ dealId: string; optionId: string }> }
) {
  const { userId } = auth();
  if (!userId) return unauthorized();
  const { dealId, optionId } = await params;

  const option = await getOptionOwned(optionId, dealId, userId);
  if (!option) return notFound("Option");
  if (option === "forbidden") return forbidden();

  return ok(option);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ dealId: string; optionId: string }> }
) {
  const { userId } = auth();
  if (!userId) return unauthorized();
  const { dealId, optionId } = await params;

  const existing = await getOptionOwned(optionId, dealId, userId);
  if (!existing) return notFound("Option");
  if (existing === "forbidden") return forbidden();

  const body = await req.json();
  const parsed = leaseOptionSchema.partial().safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const updated = await prisma.leaseOption.update({
    where: { id: optionId },
    data: parsed.data,
  });

  // Reset deal status to DRAFT when options change
  await prisma.deal.update({
    where: { id: dealId },
    data: { status: "DRAFT" },
  });

  return ok(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ dealId: string; optionId: string }> }
) {
  const { userId } = auth();
  if (!userId) return unauthorized();
  const { dealId, optionId } = await params;

  const existing = await getOptionOwned(optionId, dealId, userId);
  if (!existing) return notFound("Option");
  if (existing === "forbidden") return forbidden();

  await prisma.leaseOption.delete({ where: { id: optionId } });

  return ok({ deleted: true });
}
