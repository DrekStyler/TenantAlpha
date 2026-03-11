import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";

// Authenticated routes are always dynamic (require Clerk session)
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Detect if the authenticated user is a client (has a linked Client record)
  const client = await prisma.client.findUnique({
    where: { clientClerkUserId: userId },
    select: {
      id: true,
      name: true,
      user: { select: { name: true, brokerageName: true } },
    },
  });

  const userRole: "broker" | "client" = client ? "client" : "broker";
  const brokerInfo = client
    ? { name: client.user.name, brokerage: client.user.brokerageName }
    : null;

  return (
    <AppShell userRole={userRole} brokerInfo={brokerInfo}>
      {children}
    </AppShell>
  );
}
