import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { dealSchema } from "@/schemas/deal";
import { ok, unauthorized, badRequest } from "@/lib/api";

export async function GET() {
  const { userId } = auth();
  if (!userId) return unauthorized();

  const deals = await prisma.deal.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { options: true } } },
  });

  return ok(deals);
}

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return unauthorized();

  const body = await req.json();
  const parsed = dealSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  // Ensure user profile exists
  await prisma.userProfile.upsert({
    where: { clerkUserId: userId },
    update: {},
    create: { clerkUserId: userId, email: "" },
  });

  const deal = await prisma.deal.create({
    data: { ...parsed.data, userId },
  });

  return ok(deal, 201);
}
