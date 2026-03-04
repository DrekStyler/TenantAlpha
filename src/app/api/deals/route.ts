import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { dealSchema } from "@/schemas/deal";
import { ok, unauthorized, badRequest, forbidden, err } from "@/lib/api";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const deals = await prisma.deal.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { options: true } } },
    });

    return ok(deals);
  } catch (e) {
    console.error("[api/deals] GET error:", e);
    return err("Failed to load deals", 500);
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const body = await req.json();
  const parsed = dealSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  // Verify clientId belongs to this user if provided
  if (parsed.data.clientId) {
    const client = await prisma.client.findUnique({
      where: { id: parsed.data.clientId },
      select: { userId: true },
    });
    if (!client || client.userId !== userId) {
      return forbidden();
    }
  }

  try {
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
  } catch (e) {
    console.error("[api/deals] POST error:", e);
    return err("Failed to create deal", 500);
  }
}
