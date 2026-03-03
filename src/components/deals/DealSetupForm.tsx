"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { dealSchema, type DealFormData } from "@/schemas/deal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { PROPERTY_TYPES } from "@/lib/constants";

export function DealSetupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: { propertyType: "OFFICE" },
  });

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
