import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { savedLeaseSchema } from "@/schemas/lease";
import { ok, unauthorized, badRequest } from "@/lib/api";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const leases = await prisma.savedLease.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  return ok(leases);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const body = await req.json();
  const parsed = savedLeaseSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  await prisma.userProfile.upsert({
    where: { clerkUserId: userId },
    update: {},
    create: { clerkUserId: userId, email: "" },
  });

  const lease = await prisma.savedLease.create({
    data: {
      ...parsed.data,
      userId,
      signedDate: parsed.data.signedDate
        ? new Date(parsed.data.signedDate)
        : undefined,
    },
  });

  return ok(lease, 201);
}
