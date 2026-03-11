"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface ProfileCompletionModalProps {
  onSaveAndExport: () => void;
  onExportAnyway: () => void;
  onClose: () => void;
}

export function ProfileCompletionModal({
  onSaveAndExport,
  onExportAnyway,
  onClose,
}: ProfileCompletionModalProps) {
  const [name, setName] = useState("");
  const [brokerageName, setBrokerageName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSaveAndExport = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, brokerageName: brokerageName || undefined }),
      });
      if (res.ok) {
        onSaveAndExport();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-navy-900">
          Complete Your Profile
        </h2>
        <p className="mt-1 text-sm text-navy-500">
          Your name and brokerage appear on exported PDF reports. Add them now for professional branding.
        </p>

        <div className="mt-5 space-y-4">
          <Input
            label="Your Name"
            placeholder="Jane Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Brokerage Name"
            placeholder="Smith Commercial Realty"
            value={brokerageName}
            onChange={(e) => setBrokerageName(e.target.value)}
          />
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" size="sm" onClick={onExportAnyway}>
            Export Without Branding
          </Button>
          <Button
            size="sm"
            onClick={handleSaveAndExport}
            loading={saving}
            disabled={!name.trim() && !brokerageName.trim()}
          >
            Save &amp; Export
          </Button>
        </div>
      </div>
    </div>
  );
}
