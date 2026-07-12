"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminMatch } from "@/components/admin/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { adminFetch } from "@/lib/admin-fetch";

type MatchFormProps = {
  match?: AdminMatch;
  mode: "create" | "edit";
};

function toLocalInputValue(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

export function MatchForm({ match, mode }: MatchFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    homeTeam: match?.homeTeam || "",
    awayTeam: match?.awayTeam || "",
    homeFlag: match?.homeFlag || "",
    awayFlag: match?.awayFlag || "",
    stage: match?.stage || "",
    groupName: match?.groupName || "",
    kickoffAt: toLocalInputValue(match?.kickoffAt),
    venueName: match?.venueName || "",
    venueCity: match?.venueCity || "",
    venueState: match?.venueState || "",
    venueCapacity: match?.venueCapacity?.toString() || "",
    coverImage: match?.coverImage || "",
    description: match?.description || "",
    basicStock: (match?.basicStock ?? 500).toString(),
    premiumStock: (match?.premiumStock ?? 200).toString(),
    isFeatured: match?.isFeatured ?? false,
    isPublished: match?.isPublished ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      homeTeam: form.homeTeam,
      awayTeam: form.awayTeam,
      homeFlag: form.homeFlag || null,
      awayFlag: form.awayFlag || null,
      stage: form.stage,
      groupName: form.groupName || null,
      kickoffAt: form.kickoffAt,
      venueName: form.venueName,
      venueCity: form.venueCity,
      venueState: form.venueState,
      venueCapacity: form.venueCapacity ? Number(form.venueCapacity) : null,
      coverImage: form.coverImage || null,
      description: form.description || null,
      basicStock: Number(form.basicStock || 0),
      premiumStock: Number(form.premiumStock || 0),
      isFeatured: form.isFeatured,
      isPublished: form.isPublished,
    };

    try {
      const data = await adminFetch<{ match: AdminMatch }>(
        mode === "create" ? "/api/admin/matches" : `/api/admin/matches/${match?.id}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          body: JSON.stringify(payload),
        }
      );
      router.push(mode === "create" ? `/admin/matches/${data.match.id}` : "/admin/matches");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save match.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-2xl text-[#0a1628]">Fixture</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Home team" value={form.homeTeam} onChange={(e) => update("homeTeam", e.target.value)} required />
          <Input label="Away team" value={form.awayTeam} onChange={(e) => update("awayTeam", e.target.value)} required />
          <Input label="Home flag" value={form.homeFlag} onChange={(e) => update("homeFlag", e.target.value)} />
          <Input label="Away flag" value={form.awayFlag} onChange={(e) => update("awayFlag", e.target.value)} />
          <Input label="Stage" value={form.stage} onChange={(e) => update("stage", e.target.value)} required />
          <Input label="Group" value={form.groupName} onChange={(e) => update("groupName", e.target.value)} />
          <Input
            label="Kickoff"
            type="datetime-local"
            value={form.kickoffAt}
            onChange={(e) => update("kickoffAt", e.target.value)}
            required
          />
          <Input label="Cover image URL" value={form.coverImage} onChange={(e) => update("coverImage", e.target.value)} />
        </div>
        <Textarea label="Description" value={form.description} onChange={(e) => update("description", e.target.value)} />
      </section>

      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-2xl text-[#0a1628]">Venue and inventory</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Venue" value={form.venueName} onChange={(e) => update("venueName", e.target.value)} required />
          <Input label="City" value={form.venueCity} onChange={(e) => update("venueCity", e.target.value)} required />
          <Input label="State" value={form.venueState} onChange={(e) => update("venueState", e.target.value)} required />
          <Input
            label="Capacity"
            type="number"
            min="0"
            value={form.venueCapacity}
            onChange={(e) => update("venueCapacity", e.target.value)}
          />
          <Input
            label="Basic stock"
            type="number"
            min="0"
            value={form.basicStock}
            onChange={(e) => update("basicStock", e.target.value)}
          />
          <Input
            label="Premium stock"
            type="number"
            min="0"
            value={form.premiumStock}
            onChange={(e) => update("premiumStock", e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => update("isPublished", e.target.checked)}
              className="h-4 w-4 accent-[#1f8a4c]"
            />
            Published
          </label>
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => update("isFeatured", e.target.checked)}
              className="h-4 w-4 accent-[#1f8a4c]"
            />
            Featured
          </label>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={saving}>
          {mode === "create" ? "Create match" : "Save match"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/matches")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
