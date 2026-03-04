import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "@/schemas/client";
import { ok, unauthorized, badRequest, err } from "@/lib/api";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const clients = await prisma.client.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { deals: true } } },
    });

    return ok(clients);
  } catch (e) {
    console.error("[api/clients] GET error:", e);
    return err("Failed to load clients", 500);
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const body = await req.json();
  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  try {
    // Ensure user profile exists
    await prisma.userProfile.upsert({
      where: { clerkUserId: userId },
      update: {},
      create: { clerkUserId: userId, email: "" },
    });

    // Questionnaire token expires in 30 days
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30);

    const client = await prisma.client.create({
      data: {
        ...parsed.data,
        email: parsed.data.email || undefined,
        userId,
        tokenExpiresAt,
      },
    });

    return ok(client, 201);
  } catch (e) {
    console.error("[api/clients] POST error:", e);
    return err("Failed to create client", 500);
  }
}
