"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DealTable } from "@/components/deals/DealTable";
import type { DealRow } from "@/components/deals/DealTable";
import { ClientTable, type ClientRow } from "@/components/clients/ClientTable";
import { ClientModal } from "@/components/clients/ClientModal";
import { QuestionnaireModal } from "@/components/clients/QuestionnaireModal";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface ProfileData {
  name?: string | null;
  brokerageName?: string | null;
  onboardingCompletedAt?: string | null;
}

export function BrokerDashboard() {
  const router = useRouter();
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRow | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [questionnaireClient, setQuestionnaireClient] = useState<any | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [sampleDealLoading, setSampleDealLoading] = useState(false);
  const dismissedRef = useRef(false);

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

  const fetchProfile = useCallback(async () => {
    const res = await fetch("/api/profile");
    if (res.ok) setProfile(await res.json());
  }, []);

  useEffect(() => {
    fetchDeals();
    fetchClients();
    fetchProfile();
  }, [fetchClients, fetchProfile]);

  // Auto-dismiss onboarding for existing users who already have deals
  useEffect(() => {
    if (profile && !profile.onboardingCompletedAt && deals.length > 0 && !loading && !dismissedRef.current) {
      dismissedRef.current = true;
      fetch("/api/onboarding/dismiss", { method: "POST" });
      setProfile((prev) => prev ? { ...prev, onboardingCompletedAt: new Date().toISOString() } : prev);
    }
  }, [profile, deals, loading]);

  const handleDismissOnboarding = useCallback(async () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setProfile((prev) => prev ? { ...prev, onboardingCompletedAt: new Date().toISOString() } : prev);
    await fetch("/api/onboarding/dismiss", { method: "POST" });
  }, []);

  const handleSampleDeal = useCallback(async () => {
    setSampleDealLoading(true);
    try {
      const res = await fetch("/api/onboarding/sample-deal", { method: "POST" });
      if (res.ok) {
        const { dealId } = await res.json();
        router.push(`/deals/${dealId}/edit`);
      }
    } finally {
      setSampleDealLoading(false);
    }
  }, [router]);

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

  const handleRegenerateToken = async (clientId: string) => {
    const res = await fetch(`/api/clients/${clientId}/regenerate-token`, {
      method: "POST",
    });
    if (!res.ok) {
      setToast("Failed to regenerate token");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    const updated: ClientRow = await res.json();
    setClients((prev) => prev.map((c) => (c.id === clientId ? updated : c)));
    // Auto-copy the new link
    const url = `${window.location.origin}/q/${updated.token}`;
    navigator.clipboard.writeText(url);
    setToast("New survey link generated and copied");
    setTimeout(() => setToast(null), 3000);
  };

  const showOnboarding = profile && !profile.onboardingCompletedAt && !loading;

  return (
    <div className="space-y-12">
      {/* Onboarding Card */}
      {showOnboarding && (
        <OnboardingCard
          profile={profile}
          dealCount={deals.length}
          clientCount={clients.length}
          onDismiss={handleDismissOnboarding}
          onSampleDeal={handleSampleDeal}
          sampleDealLoading={sampleDealLoading}
        />
      )}

      {/* Deals Section */}
      <section>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-navy-900">Deals</h1>
            <p className="mt-0.5 text-sm text-navy-500">Your lease analysis history</p>
          </div>
          <Link href="/deals/new">
            <Button>+ New Analysis</Button>
          </Link>
        </div>

        <div className="mt-5">
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
            <h2 className="text-xl font-semibold tracking-tight text-navy-900">Clients</h2>
            <p className="mt-0.5 text-sm text-navy-500">
              Manage clients and economic questionnaires
            </p>
          </div>
          <Button onClick={() => setShowClientModal(true)}>+ Add Client</Button>
        </div>

        <div className="mt-5">
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
              onRegenerateToken={handleRegenerateToken}
            />
          )}
        </div>

        {(copiedToken || toast) && (
          <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-navy-900 px-4 py-2 text-sm text-white shadow-lg">
            {toast || "Questionnaire link copied to clipboard"}
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
