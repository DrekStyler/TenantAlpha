"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DealCard } from "@/components/deals/DealCard";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface Deal {
  id: string;
  dealName: string;
  clientName?: string;
  propertyType: string;
  status: "DRAFT" | "CALCULATED" | "EXPORTED" | "ARCHIVED";
  updatedAt: string;
  _count: { options: number };
}

export default function DashboardPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeals = async () => {
    const res = await fetch("/api/deals");
    if (res.ok) setDeals(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchDeals(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this deal? This cannot be undone.")) return;
    await fetch(`/api/deals/${id}`, { method: "DELETE" });
    setDeals((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Deals</h1>
          <p className="text-sm text-navy-500">Your lease analysis history</p>
        </div>
        <Link href="/deals/new">
          <Button>+ New Analysis</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : deals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-navy-100 py-16 text-center">
          <p className="text-lg font-medium text-navy-900">No analyses yet</p>
          <p className="mt-1 text-sm text-navy-500">
            Start by comparing 2-5 lease options
          </p>
          <Link href="/deals/new" className="mt-4">
            <Button>Start New Analysis</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal) => (
            <DealCard
              key={deal.id}
              id={deal.id}
              dealName={deal.dealName}
              clientName={deal.clientName}
              propertyType={deal.propertyType}
              status={deal.status}
              updatedAt={deal.updatedAt}
              optionCount={deal._count.options}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
