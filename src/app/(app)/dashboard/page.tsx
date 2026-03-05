"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { DealTable } from "@/components/deals/DealTable";
import type { DealRow } from "@/components/deals/DealTable";
import { ClientTable } from "@/components/clients/ClientTable";
import { ClientModal } from "@/components/clients/ClientModal";
import { QuestionnaireModal } from "@/components/clients/QuestionnaireModal";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

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
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRow | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [questionnaireClient, setQuestionnaireClient] = useState<any | null>(null);

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

  const handleUpdateDeal = async (id: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/deals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update deal");
    const updated = await res.json();
    setDeals((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, ...data, updatedAt: updated.updatedAt } as DealRow : d
      )
    );
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

  const handleViewQuestionnaire = async (clientId: string) => {
    const res = await fetch(`/api/clients/${clientId}`);
    if (res.ok) {
      setQuestionnaireClient(await res.json());
    }
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
          ) : (
            <DealTable
              deals={deals}
              onDelete={handleDeleteDeal}
              onUpdate={handleUpdateDeal}
            />
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
              onViewQuestionnaire={handleViewQuestionnaire}
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

      {/* Questionnaire Responses Modal */}
      {questionnaireClient && (
        <QuestionnaireModal
          client={questionnaireClient}
          onClose={() => setQuestionnaireClient(null)}
        />
      )}
    </div>
  );
}
