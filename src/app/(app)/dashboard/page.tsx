"use client";

import { useEffect, useState } from "react";
import { BrokerDashboard } from "@/components/dashboard/BrokerDashboard";
import { ClientDashboard } from "@/components/dashboard/ClientDashboard";
import { Spinner } from "@/components/ui/Spinner";

export default function DashboardPage() {
  const [role, setRole] = useState<"broker" | "client" | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setRole(d.role ?? "broker"));
  }, []);

  if (!role) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return role === "client" ? <ClientDashboard /> : <BrokerDashboard />;
}
