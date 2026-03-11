import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized } from "@/lib/api";

export async function GET() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return unauthorized();

  const client = await prisma.client.findUnique({
    where: { clientClerkUserId: clerkUserId },
    select: {
      id: true,
      name: true,
      company: true,
      user: {
        select: { name: true, brokerageName: true, email: true },
      },
    },
  });

  if (client) {
    return ok({
      role: "client" as const,
      clientId: client.id,
      clientName: client.name,
      company: client.company,
      broker: {
        name: client.user.name,
        brokerage: client.user.brokerageName,
        email: client.user.email,
      },
    });
  }

  return ok({ role: "broker" as const });
}
