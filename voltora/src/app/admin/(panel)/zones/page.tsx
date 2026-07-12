"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function AdminZonesPage() {
  const [zones, setZones] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    matchId: "",
    categoryId: "",
    code: "",
    name: "",
    viewingQuality: "STANDARD",
    svgPathId: "",
  });

  const load = async () => {
    const [z, m, c] = await Promise.all([
      fetch("/api/admin/zones").then((r) => r.json()),
      fetch("/api/admin/matches").then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
    ]);
    setZones(z.zones || []);
    setMatches(m.matches || []);
    setCategories(c.categories || []);
    if (!form.matchId && m.matches?.[0]) {
      setForm((f) => ({
        ...f,
        matchId: m.matches[0].id,
        categoryId: c.categories?.[0]?.id || "",
      }));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async () => {
    await fetch("/api/admin/zones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-white">Stadium Zones</h1>
      <div className="rounded-2xl border border-white/10 bg-[#0a1420] p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="label">Match</label>
            <select className="input" value={form.matchId} onChange={(e) => setForm({ ...form, matchId: e.target.value })}>
              {matches.map((m) => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              {categories.filter((c) => c.matchId === form.matchId).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="SVG path id" value={form.svgPathId} onChange={(e) => setForm({ ...form, svgPathId: e.target.value })} />
          <div>
            <label className="label">Viewing quality</label>
            <select className="input" value={form.viewingQuality} onChange={(e) => setForm({ ...form, viewingQuality: e.target.value })}>
              <option value="STANDARD">STANDARD</option>
              <option value="GOOD">GOOD</option>
              <option value="PREMIUM">PREMIUM</option>
            </select>
          </div>
        </div>
        <Button className="mt-4" onClick={create}>Add Zone</Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-white/50">
            <tr>
              <th className="px-3 py-3">Code</th>
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">Quality</th>
              <th className="px-3 py-3">SVG</th>
              <th className="px-3 py-3">Active</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.id} className="border-t border-white/5">
                <td className="px-3 py-3">{z.code}</td>
                <td className="px-3 py-3">{z.name}</td>
                <td className="px-3 py-3">{z.category?.name}</td>
                <td className="px-3 py-3">{z.viewingQuality}</td>
                <td className="px-3 py-3">{z.svgPathId}</td>
                <td className="px-3 py-3">{z.isActive ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
