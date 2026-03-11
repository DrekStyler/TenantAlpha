"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { savedLeaseSchema, type SavedLeaseFormData } from "@/schemas/lease";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/formatters";
import { PROPERTY_TYPES, RENT_STRUCTURES, ESCALATION_TYPES } from "@/lib/constants";

interface SavedLease {
  id: string;
  leaseName: string;
  tenantName?: string;
  propertyAddress?: string;
  propertyType?: string;
  rentableSF: number;
  termMonths: number;
  baseRentY1: number;
  escalationType: string;
  escalationPercent: number;
  rentStructure: string;
  tiAllowance?: number;
  signedDate?: string;
  notes?: string;
  createdAt: string;
}

export default function LeasesPage() {
  const router = useRouter();
  const [leases, setLeases] = useState<SavedLease[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SavedLeaseFormData>({
    resolver: zodResolver(savedLeaseSchema),
    defaultValues: {
      escalationType: "FIXED_PERCENT",
      escalationPercent: 3,
      rentStructure: "GROSS",
    },
  });

  const fetchLeases = async () => {
    const res = await fetch("/api/leases");
    if (res.ok) setLeases(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => { if (d.role === "client") router.replace("/roi"); });
  }, [router]);

  useEffect(() => {
    fetchLeases();
  }, []);

  const onSubmit = async (data: SavedLeaseFormData) => {
    setSaving(true);
    const res = await fetch("/api/leases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      await fetchLeases();
      reset();
      setShowForm(false);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await fetch(`/api/leases/${id}`, { method: "DELETE" });
    setLeases((prev) => prev.filter((l) => l.id !== id));
    setDeletingId(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Saved Leases</h1>
          <p className="text-sm text-navy-500">Historical lease records for reference</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ Add Lease"}
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card>
          <CardHeader title="Add Saved Lease" subtitle="Record a historical lease for future reference" />
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Lease Name *"
                placeholder="e.g. 2022 HQ Lease"
                error={errors.leaseName?.message}
                {...register("leaseName")}
              />
              <Input
                label="Tenant / Client Name"
                placeholder="e.g. Acme Corp"
                {...register("tenantName")}
              />
              <Input
                label="Property Address"
                placeholder="100 Main St, Suite 200"
                {...register("propertyAddress")}
              />
              <Select
                label="Property Type"
                options={PROPERTY_TYPES.map((p) => ({ value: p.value, label: p.label }))}
                {...register("propertyType")}
              />
              <Input
                label="Rentable SF *"
                type="number"
                min={1}
                error={errors.rentableSF?.message}
                {...register("rentableSF", { valueAsNumber: true })}
              />
              <Input
                label="Term (months) *"
                type="number"
                min={1}
                error={errors.termMonths?.message}
                {...register("termMonths", { valueAsNumber: true })}
              />
              <Input
                label="Base Rent Y1 ($/SF/yr) *"
                type="number"
                step="0.01"
                min={0}
                error={errors.baseRentY1?.message}
                {...register("baseRentY1", { valueAsNumber: true })}
              />
              <Select
                label="Rent Structure"
                options={RENT_STRUCTURES.map((r) => ({ value: r.value, label: r.label }))}
                {...register("rentStructure")}
              />
              <Select
                label="Escalation Type"
                options={ESCALATION_TYPES.map((e) => ({ value: e.value, label: e.label }))}
                {...register("escalationType")}
              />
              <Input
                label="Escalation %"
                type="number"
                step="0.1"
                min={0}
                max={50}
                error={errors.escalationPercent?.message}
                {...register("escalationPercent", { valueAsNumber: true })}
              />
              <Input
                label="TI Allowance ($)"
                type="number"
                min={0}
                {...register("tiAllowance", { valueAsNumber: true })}
              />
              <Input
                label="Signed Date"
                type="date"
                {...register("signedDate")}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy-700">Notes</label>
              <textarea
                {...register("notes")}
                rows={3}
                placeholder="Any additional context about this lease…"
                className="w-full resize-none rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-800 placeholder:text-navy-400 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                Save Lease
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Leases List */}
      {leases.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <p className="mb-2 text-navy-500">No saved leases yet.</p>
            <p className="text-sm text-navy-400">
              Save historical leases here for easy reference in future analyses.
            </p>
            {!showForm && (
              <Button className="mt-4" onClick={() => setShowForm(true)}>
                + Add First Lease
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {leases.map((lease) => (
            <Card key={lease.id} padding="sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-navy-900">{lease.leaseName}</h3>
                    {lease.rentStructure && (
                      <Badge variant="default">{lease.rentStructure}</Badge>
                    )}
                    {lease.propertyType && (
                      <Badge variant="default">{lease.propertyType}</Badge>
                    )}
                  </div>
                  {lease.tenantName && (
                    <p className="mt-0.5 text-sm text-navy-500">{lease.tenantName}</p>
                  )}
                  {lease.propertyAddress && (
                    <p className="text-sm text-navy-400">{lease.propertyAddress}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-navy-600">
                    <span>
                      <span className="font-medium">${(lease.baseRentY1 ?? 0).toFixed(2)}/SF/yr</span>
                    </span>
                    <span>{(lease.rentableSF ?? 0).toLocaleString()} SF</span>
                    <span>{((lease.termMonths ?? 0) / 12).toFixed(1)} yrs</span>
                    {lease.tiAllowance && lease.tiAllowance > 0 && (
                      <span>TI: {formatCurrency(lease.tiAllowance)}</span>
                    )}
                    {lease.signedDate && (
                      <span>
                        Signed:{" "}
                        {new Date(lease.signedDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                        })}
                      </span>
                    )}
                  </div>
                  {lease.notes && (
                    <p className="mt-1.5 text-xs text-navy-400 italic">{lease.notes}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(lease.id)}
                  loading={deletingId === lease.id}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
