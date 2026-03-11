import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, notFound } from "@/lib/api";

export async function GET() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return unauthorized();

  const client = await prisma.client.findUnique({
    where: { clientClerkUserId: clerkUserId },
    select: { id: true },
  });

  if (!client) return notFound("Client");

  const deals = await prisma.deal.findMany({
    where: { clientId: client.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      dealName: true,
      status: true,
      propertyType: true,
      stage: true,
      createdAt: true,
      updatedAt: true,
      options: {
        select: { optionName: true, rentableSF: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return ok(deals);
}
