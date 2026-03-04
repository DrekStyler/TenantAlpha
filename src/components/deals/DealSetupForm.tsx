"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { dealSchema, type DealFormData } from "@/schemas/deal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { PROPERTY_TYPES } from "@/lib/constants";

interface ClientOption {
  id: string;
  name: string;
  company?: string | null;
}

export function DealSetupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clients, setClients] = useState<ClientOption[]>([]);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setClients(data));
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: { propertyType: "OFFICE" },
  });

  const selectedClientId = watch("clientId");

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    setValue("clientId", clientId || undefined);
    if (clientId) {
      const client = clients.find((c) => c.id === clientId);
      if (client) {
        setValue("clientName", client.company || client.name);
      }
    }
  };

  const onSubmit = async (data: DealFormData) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      const deal = await res.json();
      router.push(`/deals/${deal.id}/edit`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create deal");
      setLoading(false);
    }
  };

  const clientSelectOptions = [
    { value: "", label: "No client linked" },
    ...clients.map((c) => ({
      value: c.id,
      label: c.company ? `${c.name} (${c.company})` : c.name,
    })),
  ];

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader
          title="New Analysis"
          subtitle="Enter deal details to get started"
        />
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Deal Name"
            placeholder="e.g. Acme Corp Office Relocation"
            required
            error={errors.dealName?.message}
            {...register("dealName")}
          />

          {clients.length > 0 && (
            <Select
              label="Link Client"
              options={clientSelectOptions}
              value={selectedClientId || ""}
              onChange={handleClientChange}
              hint="Link a client to auto-fill their name and use questionnaire data"
            />
          )}

          <Input
            label="Client Name"
            placeholder="e.g. Acme Corp"
            error={errors.clientName?.message}
            {...register("clientName")}
          />
          <Select
            label="Property Type"
            required
            options={PROPERTY_TYPES.map((t) => ({
              value: t.value,
              label: t.label,
            }))}
            error={errors.propertyType?.message}
            {...register("propertyType")}
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} size="lg" className="mt-2 w-full">
            Continue to Options →
          </Button>
        </form>
      </Card>
    </div>
  );
}
