import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, notFound, forbidden, err } from "@/lib/api";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { clientId } = await params;
  const existing = await prisma.client.findUnique({
    where: { id: clientId },
    include: { surveySession: { select: { id: true } } },
  });

  if (!existing) return notFound("Client");
  if (existing.userId !== userId) return forbidden();

  try {
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30);

    // Generate a new token (same format as Prisma's cuid default)
    const newToken = crypto.randomUUID();

    // Delete stale survey session if it exists
    if (existing.surveySession) {
      await prisma.surveySession.delete({
        where: { id: existing.surveySession.id },
      });
    }

    const client = await prisma.client.update({
      where: { id: clientId },
      data: {
        token: newToken,
        tokenExpiresAt,
        // Only reset completion if the survey wasn't completed
        // (expired tokens that were never finished)
        ...(existing.questionnaireCompletedAt
          ? {}
          : { questionnaireCompletedAt: null }),
      },
      include: {
        _count: { select: { deals: true } },
        surveySession: {
          select: { phase: true, updatedAt: true, createdAt: true },
        },
      },
    });

    return ok(client);
  } catch (e) {
    console.error("[api/clients/regenerate-token] POST error:", e);
    return err("Failed to regenerate token", 500);
  }
}
