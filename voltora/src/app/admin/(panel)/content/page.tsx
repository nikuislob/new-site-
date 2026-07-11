"use client";

import { useEffect, useState, type FormEvent } from "react";
import { adminFetch } from "@/lib/admin-fetch";

const CONTENT_KEYS = [
  { key: "announcement_enabled", label: "Show announcement bar", type: "checkbox" },
  { key: "announcement_bar", label: "Announcement text", type: "textarea" },
  { key: "hero_title", label: "Hero title", type: "text" },
  { key: "hero_subtitle", label: "Hero subtitle", type: "textarea" },
  { key: "hero_cta_text", label: "Hero CTA text", type: "text" },
  { key: "hero_cta_link", label: "Hero CTA link", type: "text" },
  { key: "hero_secondary_cta_text", label: "Hero secondary CTA text", type: "text" },
  { key: "hero_secondary_cta_link", label: "Hero secondary CTA link", type: "text" },
  { key: "hero_image", label: "Hero image URL", type: "text" },
  { key: "promo_banner_1_title", label: "Promo banner 1 title", type: "text" },
  { key: "promo_banner_1_text", label: "Promo banner 1 text", type: "textarea" },
  { key: "promo_banner_1_link", label: "Promo banner 1 link", type: "text" },
  { key: "promo_banner_1_image", label: "Promo banner 1 image", type: "text" },
  { key: "promo_banner_2_title", label: "Promo banner 2 title", type: "text" },
  { key: "promo_banner_2_text", label: "Promo banner 2 text", type: "textarea" },
  { key: "promo_banner_2_link", label: "Promo banner 2 link", type: "text" },
  { key: "promo_banner_2_image", label: "Promo banner 2 image", type: "text" },
  { key: "deal_countdown_ends", label: "Deal countdown ends (ISO date)", type: "text" },
  { key: "why_shop_title", label: "Why shop section title", type: "text" },
  { key: "footer_about", label: "Footer about text", type: "textarea" },
  { key: "newsletter_text", label: "Newsletter text", type: "textarea" },
  { key: "delivery_text", label: "Delivery info text", type: "textarea" },
  { key: "support_text", label: "Support info text", type: "textarea" },
] as const;

export default function ContentPage() {
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
      for (const field of CONTENT_KEYS) {
        if (field.type === "checkbox") {
          payload[field.key] = settings[field.key] === "true" ? "true" : "false";
        } else {
          payload[field.key] = settings[field.key] ?? "";
        }
      }
      const data = await adminFetch<{ settings: Record<string, string> }>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setSettings(data.settings);
      setSuccess("Homepage content saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-lg border border-[#1e2d45] bg-[#0b1220] px-3 py-2 text-sm text-white focus:border-[#00c2a8] focus:outline-none";
  const labelClass = "mb-1 block text-sm font-medium text-[#c5d0e0]";

  if (loading) return <p className="text-[#8b9cb8]">Loading content settings…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Homepage content</h1>
        <p className="mt-1 text-sm text-[#8b9cb8]">CMS settings for hero, banners, and footer</p>
      </div>

      {error ? <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">{error}</div> : null}
      {success ? <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-sm text-teal-300" role="status">{success}</div> : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        {CONTENT_KEYS.map((field) => (
          <div key={field.key} className="rounded-xl border border-[#1e2d45] bg-[#121a2b] p-4">
            {field.type === "checkbox" ? (
              <label className="flex items-center gap-3 text-sm text-[#c5d0e0]">
                <input
                  type="checkbox"
                  checked={settings[field.key] === "true"}
                  onChange={(e) => update(field.key, e.target.checked ? "true" : "false")}
                  className="h-4 w-4 accent-[#00c2a8]"
                />
                {field.label}
              </label>
            ) : (
              <>
                <label htmlFor={field.key} className={labelClass}>{field.label}</label>
                {field.type === "textarea" ? (
                  <textarea
                    id={field.key}
                    rows={3}
                    value={settings[field.key] ?? ""}
                    onChange={(e) => update(field.key, e.target.value)}
                    className={inputClass}
                  />
                ) : (
                  <input
                    id={field.key}
                    value={settings[field.key] ?? ""}
                    onChange={(e) => update(field.key, e.target.value)}
                    className={inputClass}
                  />
                )}
              </>
            )}
          </div>
        ))}

        <button type="submit" disabled={saving} className="rounded-lg bg-[#00c2a8] px-6 py-2.5 text-sm font-semibold text-[#0b1220] hover:bg-[#00d4b8] disabled:opacity-60">
          {saving ? "Saving…" : "Save content"}
        </button>
      </form>
    </div>
  );
}
