import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "@/schemas/client";
import { ok, unauthorized, notFound, badRequest, forbidden } from "@/lib/api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { clientId } = await params;
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { deals: { select: { id: true, dealName: true, status: true } } },
  });

  if (!client) return notFound("Client");
  if (client.userId !== userId) return forbidden();

  return ok(client);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { clientId } = await params;
  const existing = await prisma.client.findUnique({
    where: { id: clientId },
  });
  if (!existing) return notFound("Client");
  if (existing.userId !== userId) return forbidden();

  const body = await req.json();
  const parsed = clientSchema.partial().safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const client = await prisma.client.update({
    where: { id: clientId },
    data: {
      ...parsed.data,
      email: parsed.data.email === "" ? null : parsed.data.email,
    },
  });

  return ok(client);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { clientId } = await params;
  const existing = await prisma.client.findUnique({
    where: { id: clientId },
  });
  if (!existing) return notFound("Client");
  if (existing.userId !== userId) return forbidden();

  // Unlink deals before deleting
  await prisma.deal.updateMany({
    where: { clientId },
    data: { clientId: null },
  });

  await prisma.client.delete({ where: { id: clientId } });

  return ok({ deleted: true });
}
