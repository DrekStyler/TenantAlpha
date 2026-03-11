"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileFormData } from "@/schemas/profile";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";

interface Profile {
  id: string;
  name?: string;
  email: string;
  brokerageName?: string;
  phone?: string;
  logoUrl?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const fetchProfile = async () => {
    const res = await fetch("/api/profile");
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
      reset({
        name: data.name ?? "",
        brokerageName: data.brokerageName ?? "",
        phone: data.phone ?? "",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => { if (d.role === "client") router.replace("/roi"); });
  }, [router]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Logo must be under 2MB.");
      return;
    }

    setUploading(true);
    setUploadError("");
    const formData = new FormData();
    formData.append("logo", file);

    const res = await fetch("/api/upload/logo", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      await fetchProfile();
    } else {
      const data = await res.json().catch(() => ({}));
      setUploadError(data.error ?? "Upload failed.");
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Broker Profile</h1>
        <p className="text-sm text-navy-500">
          This information appears on exported PDF reports.
        </p>
      </div>

      {/* Logo Upload */}
      <Card>
        <CardHeader title="Brokerage Logo" subtitle="Shown on PDF cover page (PNG or JPEG, max 2MB)" />
        <div className="flex items-center gap-4">
          {profile?.logoUrl ? (
            <img
              src={profile.logoUrl}
              alt="Logo"
              className="h-16 w-auto max-w-[160px] rounded-lg border border-navy-100 object-contain p-2"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-navy-200 text-sm text-navy-400">
              No logo
            </div>
          )}
          <div>
            <label className="cursor-pointer">
              <span className="inline-flex items-center rounded-lg border border-navy-200 bg-white px-4 py-2 text-sm font-medium text-navy-700 transition-colors hover:bg-navy-50">
                {uploading ? "Uploading…" : profile?.logoUrl ? "Change Logo" : "Upload Logo"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleLogoUpload}
                disabled={uploading}
              />
            </label>
            {uploadError && (
              <p className="mt-1 text-xs text-red-600">{uploadError}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader title="Contact Information" subtitle="Used in PDF reports and deal summaries" />
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Jane Smith"
            error={errors.name?.message}
            {...register("name")}
          />
          {profile?.email && (
            <div>
              <label className="mb-1 block text-sm font-medium text-navy-700">
                Email
              </label>
              <p className="rounded-lg border border-navy-100 bg-navy-50 px-3 py-2 text-sm text-navy-500">
                {profile.email}
                <span className="ml-2 text-xs text-navy-400">(managed by Clerk)</span>
              </p>
            </div>
          )}
          <Input
            label="Brokerage Name"
            placeholder="Smith Commercial Realty"
            error={errors.brokerageName?.message}
            {...register("brokerageName")}
          />
          <Input
            label="Phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            error={errors.phone?.message}
            {...register("phone")}
          />
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={saving}>
              Save Changes
            </Button>
            {saved && (
              <span className="text-sm font-medium text-green-600">
                Saved
              </span>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
