"use client";

import { useEffect, useState, type FormEvent } from "react";
import { adminFetch } from "@/lib/admin-fetch";

const STORE_KEYS = [
  { key: "store_name", label: "Store name", type: "text" },
  { key: "store_tagline", label: "Store tagline", type: "text" },
  { key: "contact_email", label: "Contact email", type: "email" },
  { key: "contact_phone", label: "Contact phone", type: "text" },
  { key: "free_shipping_threshold", label: "Free shipping threshold ($)", type: "number" },
  { key: "flat_shipping_rate", label: "Flat shipping rate ($)", type: "number" },
  { key: "global_delivery_estimate", label: "Global delivery estimate", type: "text" },
  { key: "return_policy", label: "Return policy", type: "textarea" },
  { key: "shipping_policy", label: "Shipping policy", type: "textarea" },
] as const;

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await adminFetch<{ settings: Record<string, string> }>("/api/admin/settings");
        setSettings(data.settings);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function update(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload: Record<string, string> = {};
      for (const field of STORE_KEYS) {
        payload[field.key] = settings[field.key] ?? "";
      }
      const data = await adminFetch<{ settings: Record<string, string> }>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setSettings(data.settings);
      setSuccess("Store settings saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-lg border border-[#1e2d45] bg-[#0b1220] px-3 py-2 text-sm text-white focus:border-[#00c2a8] focus:outline-none";
  const labelClass = "mb-1 block text-sm font-medium text-[#c5d0e0]";

  if (loading) return <p className="text-[#8b9cb8]">Loading store settings…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Store settings</h1>
        <p className="mt-1 text-sm text-[#8b9cb8]">Shipping rates, contact info, and policies</p>
      </div>

      {error ? <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">{error}</div> : null}
      {success ? <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-sm text-teal-300" role="status">{success}</div> : null}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4 rounded-xl border border-[#1e2d45] bg-[#121a2b] p-5">
        {STORE_KEYS.map((field) => (
          <div key={field.key}>
            <label htmlFor={field.key} className={labelClass}>{field.label}</label>
            {field.type === "textarea" ? (
              <textarea
                id={field.key}
                rows={4}
                value={settings[field.key] ?? ""}
                onChange={(e) => update(field.key, e.target.value)}
                className={inputClass}
              />
            ) : (
              <input
                id={field.key}
                type={field.type}
                value={settings[field.key] ?? ""}
                onChange={(e) => update(field.key, e.target.value)}
                className={inputClass}
              />
            )}
          </div>
        ))}

        <button type="submit" disabled={saving} className="rounded-lg bg-[#00c2a8] px-6 py-2.5 text-sm font-semibold text-[#0b1220] hover:bg-[#00d4b8] disabled:opacity-60">
          {saving ? "Saving…" : "Save settings"}
        </button>
      </form>
    </div>
  );
}
