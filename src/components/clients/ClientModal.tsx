"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface ClientData {
  id?: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  industry?: string | null;
  companySize?: string | null;
  surveyMode?: string | null;
}

interface ClientModalProps {
  client?: ClientData | null;
  onSave: (data: ClientData) => Promise<void>;
  onClose: () => void;
}

const sizeOptions = [
  { value: "", label: "Select size..." },
  { value: "SOLO", label: "Solo (1 person)" },
  { value: "SMALL", label: "Small (2-10)" },
  { value: "MEDIUM", label: "Medium (11-50)" },
  { value: "LARGE", label: "Large (51-200)" },
  { value: "ENTERPRISE", label: "Enterprise (200+)" },
];

const industryOptions = [
  { value: "", label: "Select industry..." },
  { value: "Legal", label: "Legal" },
  { value: "Financial Services", label: "Financial Services" },
  { value: "Technology", label: "Technology" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Consulting", label: "Consulting" },
  { value: "Real Estate", label: "Real Estate" },
  { value: "Accounting", label: "Accounting" },
  { value: "Insurance", label: "Insurance" },
  { value: "Media & Advertising", label: "Media & Advertising" },
  { value: "Architecture & Design", label: "Architecture & Design" },
  { value: "Nonprofit", label: "Nonprofit" },
  { value: "Government", label: "Government" },
  { value: "Other", label: "Other" },
];

export function ClientModal({ client, onSave, onClose }: ClientModalProps) {
  const isEdit = !!client?.id;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(client?.name ?? "");
  const [company, setCompany] = useState(client?.company ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [industry, setIndustry] = useState(client?.industry ?? "");
  const [companySize, setCompanySize] = useState(client?.companySize ?? "");
  const [surveyMode, setSurveyMode] = useState(client?.surveyMode ?? "STATIC");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Client name is required");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await onSave({
        id: client?.id,
        name: name.trim(),
        company: company.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        industry: industry || undefined,
        companySize: companySize || undefined,
        surveyMode: surveyMode || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save client");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-navy-900">
          {isEdit ? "Edit Client" : "Add Client"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Contact Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
          />
          <Input
            label="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme Corp"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@acme.com"
            />
            <Input
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Industry"
              options={industryOptions}
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
            <Select
              label="Company Size"
              options={sizeOptions}
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
            />
          </div>

          {/* Survey Mode Toggle */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-700">
              Survey Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSurveyMode("STATIC")}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  surveyMode === "STATIC"
                    ? "border-navy-900 bg-navy-900 text-white"
                    : "border-navy-200 text-navy-600 hover:bg-navy-50"
                }`}
              >
                Static Form
              </button>
              <button
                type="button"
                onClick={() => setSurveyMode("AI_AGENT")}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  surveyMode === "AI_AGENT"
                    ? "border-navy-900 bg-navy-900 text-white"
                    : "border-navy-200 text-navy-600 hover:bg-navy-50"
                }`}
              >
                AI Survey Agent
              </button>
            </div>
            <p className="mt-1 text-[10px] text-navy-400">
              {surveyMode === "AI_AGENT"
                ? "AI conducts a guided conversation to gather industry-specific data and produce ROI analysis."
                : "Client fills out a standard questionnaire form."}
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {isEdit ? "Save Changes" : "Add Client"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
