import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/schemas/profile";
import { ok, unauthorized, badRequest } from "@/lib/api";

export async function GET() {
  const { userId } = auth();
  if (!userId) return unauthorized();

  const clerkUser = await currentUser();

  const profile = await prisma.userProfile.upsert({
    where: { clerkUserId: userId },
    update: {},
    create: {
      clerkUserId: userId,
      email: clerkUser?.emailAddresses[0]?.emailAddress ?? "",
      name: clerkUser?.fullName ?? undefined,
    },
  });

  return ok(profile);
}

export async function PUT(req: Request) {
  const { userId } = auth();
  if (!userId) return unauthorized();

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const profile = await prisma.userProfile.upsert({
    where: { clerkUserId: userId },
    update: parsed.data,
    create: { clerkUserId: userId, email: "", ...parsed.data },
  });

  return ok(profile);
}
