import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized } from "@/lib/api";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  await prisma.userProfile.update({
    where: { clerkUserId: userId },
    data: { onboardingCompletedAt: new Date() },
  });

  return ok({ dismissed: true });
}
