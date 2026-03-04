import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "@/schemas/client";
import { ok, unauthorized, badRequest } from "@/lib/api";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const clients = await prisma.client.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { deals: true } } },
  });

  return ok(clients);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const body = await req.json();
  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  // Ensure user profile exists
  await prisma.userProfile.upsert({
    where: { clerkUserId: userId },
    update: {},
    create: { clerkUserId: userId, email: "" },
  });

  const client = await prisma.client.create({
    data: {
      ...parsed.data,
      email: parsed.data.email || undefined,
      userId,
    },
  });

  return ok(client, 201);
}
