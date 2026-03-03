import { AppShell } from "@/components/layout/AppShell";

// Authenticated routes are always dynamic (require Clerk session)
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
