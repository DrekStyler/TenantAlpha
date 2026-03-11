"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

interface BrokerInfo {
  name: string | null;
  brokerage: string | null;
}

interface AppShellProps {
  children: React.ReactNode;
  userRole?: "broker" | "client";
  brokerInfo?: BrokerInfo | null;
}

const brokerNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/leases", label: "Leases", icon: "file" },
  { href: "/profile", label: "Profile", icon: "user" },
];

const clientNavItems = [
  { href: "/roi", label: "My Results", icon: "chart" },
  { href: "/dashboard", label: "My Deals", icon: "grid" },
];

function NavIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "chart":
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      );
    case "grid":
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case "file":
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case "user":
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    default:
      return null;
  }
}

export function AppShell({ children, userRole = "broker", brokerInfo }: AppShellProps) {
  const pathname = usePathname();
  const isClient = userRole === "client";
  const navItems = isClient ? clientNavItems : brokerNavItems;
  const homeHref = isClient ? "/roi" : "/dashboard";

  return (
    <div className="min-h-screen bg-navy-50">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-navy-200 bg-white/95 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-4 lg:px-8">
          <Link href={homeHref} className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900">
              <span className="text-sm font-bold text-gold-400">T</span>
            </div>
            <span className="hidden text-lg font-semibold tracking-tight text-navy-900 sm:block">
              TenantAlpha
            </span>
          </Link>
          <UserButton />
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar */}
        <aside className="hidden w-56 shrink-0 border-r border-navy-200 bg-white lg:flex lg:flex-col lg:justify-between">
          <nav className="flex flex-col gap-1 p-4">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-navy-900 text-white"
                      : "text-navy-600 hover:bg-navy-50 hover:text-navy-900"
                  }`}
                >
                  <NavIcon icon={item.icon} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Broker info card for clients */}
          {isClient && brokerInfo && (brokerInfo.name || brokerInfo.brokerage) && (
            <div className="border-t border-navy-100 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-navy-400">
                Your Broker
              </p>
              {brokerInfo.name && (
                <p className="mt-1 text-sm font-medium text-navy-900">
                  {brokerInfo.name}
                </p>
              )}
              {brokerInfo.brokerage && (
                <p className="text-xs text-navy-500">{brokerInfo.brokerage}</p>
              )}
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 pb-24 lg:pb-8">
          <div className="mx-auto max-w-7xl p-4 lg:p-8">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-navy-200 bg-white/95 backdrop-blur-sm lg:hidden">
        <div className="flex justify-around pb-[env(safe-area-inset-bottom)] pt-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-4 py-3 text-xs font-medium ${
                  isActive ? "text-navy-900" : "text-navy-400"
                }`}
              >
                <NavIcon icon={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
