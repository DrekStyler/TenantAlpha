"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { DealCard } from "@/components/deals/DealCard";
import { ClientTable } from "@/components/clients/ClientTable";
import { ClientModal } from "@/components/clients/ClientModal";
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

interface ClientRow {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  industry?: string | null;
  companySize?: string | null;
  token: string;
  questionnaireCompletedAt?: string | null;
  updatedAt: string;
  _count: { deals: number };
}

export default function DashboardPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRow | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchDeals = async () => {
    const res = await fetch("/api/deals");
    if (res.ok) setDeals(await res.json());
    setLoading(false);
  };

  const fetchClients = useCallback(async () => {
    const res = await fetch("/api/clients");
    if (res.ok) setClients(await res.json());
    setClientsLoading(false);
  }, []);

  useEffect(() => {
    fetchDeals();
    fetchClients();
  }, [fetchClients]);

  const handleDeleteDeal = async (id: string) => {
    if (!confirm("Delete this deal? This cannot be undone.")) return;
    await fetch(`/api/deals/${id}`, { method: "DELETE" });
    setDeals((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSaveClient = async (data: {
    id?: string;
    name: string;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    industry?: string | null;
    companySize?: string | null;
  }) => {
    if (data.id) {
      const res = await fetch(`/api/clients/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update client");
    } else {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create client");
    }
    setShowClientModal(false);
    setEditingClient(null);
    await fetchClients();
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm("Delete this client? Deals will be unlinked but not deleted."))
      return;
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/q/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-10">
      {/* Deals Section */}
      <section>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy-900">Deals</h1>
            <p className="mt-1 text-sm text-navy-500">Your lease analysis history</p>
          </div>
          <Link href="/deals/new">
            <Button>+ New Analysis</Button>
          </Link>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-navy-200 py-20 text-center">
              <p className="text-lg font-medium text-navy-900">
                No analyses yet
              </p>
              <p className="mt-2 text-sm text-navy-500">
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
                  onDelete={handleDeleteDeal}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Clients Section */}
      <section>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-navy-900">Clients</h2>
            <p className="mt-1 text-sm text-navy-500">
              Manage clients and economic questionnaires
            </p>
          </div>
          <Button onClick={() => setShowClientModal(true)}>+ Add Client</Button>
        </div>

        <div className="mt-6">
          {clientsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <ClientTable
              clients={clients}
              onCopyLink={handleCopyLink}
              onEdit={(client) => {
                setEditingClient(client);
                setShowClientModal(true);
              }}
              onDelete={handleDeleteClient}
            />
          )}
        </div>

        {copiedToken && (
          <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-navy-900 px-4 py-2 text-sm text-white shadow-lg">
            Questionnaire link copied to clipboard
          </div>
        )}
      </section>

      {/* Client Modal */}
      {showClientModal && (
        <ClientModal
          client={editingClient}
          onSave={handleSaveClient}
          onClose={() => {
            setShowClientModal(false);
            setEditingClient(null);
          }}
        />
      )}
    </div>
  );
}
