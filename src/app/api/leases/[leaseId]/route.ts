import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { savedLeaseSchema } from "@/schemas/lease";
import { ok, unauthorized, notFound, forbidden, badRequest } from "@/lib/api";

async function getLeaseOwned(leaseId: string, userId: string) {
  const lease = await prisma.savedLease.findUnique({ where: { id: leaseId } });
  if (!lease) return null;
  if (lease.userId !== userId) return "forbidden";
  return lease;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ leaseId: string }> }
) {
  const { userId } = auth();
  if (!userId) return unauthorized();
  const { leaseId } = await params;

  const lease = await getLeaseOwned(leaseId, userId);
  if (!lease) return notFound("Lease");
  if (lease === "forbidden") return forbidden();

  return ok(lease);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ leaseId: string }> }
) {
  const { userId } = auth();
  if (!userId) return unauthorized();
  const { leaseId } = await params;

  const existing = await getLeaseOwned(leaseId, userId);
  if (!existing) return notFound("Lease");
  if (existing === "forbidden") return forbidden();

  const body = await req.json();
  const parsed = savedLeaseSchema.partial().safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const updated = await prisma.savedLease.update({
    where: { id: leaseId },
    data: {
      ...parsed.data,
      signedDate: parsed.data.signedDate
        ? new Date(parsed.data.signedDate)
        : undefined,
    },
  });

  return ok(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ leaseId: string }> }
) {
  const { userId } = auth();
  if (!userId) return unauthorized();
  const { leaseId } = await params;

  const existing = await getLeaseOwned(leaseId, userId);
  if (!existing) return notFound("Lease");
  if (existing === "forbidden") return forbidden();

  await prisma.savedLease.delete({ where: { id: leaseId } });
  return ok({ deleted: true });
}
