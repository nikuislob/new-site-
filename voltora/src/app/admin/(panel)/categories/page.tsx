"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { formatCurrency } from "@/lib/utils";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [form, setForm] = useState({
    matchId: "",
    name: "",
    description: "",
    priceCents: 8900,
    totalInventory: 100,
  });

  const load = async () => {
    const [c, m] = await Promise.all([
      fetch("/api/admin/categories").then((r) => r.json()),
      fetch("/api/admin/matches").then((r) => r.json()),
    ]);
    setCategories(c.categories || []);
    setMatches(m.matches || []);
    if (!form.matchId && m.matches?.[0]) setForm((f) => ({ ...f, matchId: m.matches[0].id }));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async () => {
    await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    load();
  };

  const save = async (cat: any) => {
    await fetch(`/api/admin/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: cat.name,
        description: cat.description,
        priceCents: Number(cat.priceCents),
        totalInventory: Number(cat.totalInventory),
        isActive: cat.isActive,
      }),
    });
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-white">Ticket Categories</h1>

      <div className="rounded-2xl border border-white/10 bg-[#0a1420] p-4">
        <h2 className="font-semibold">Create category</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label className="label">Match</label>
            <select
              className="input"
              value={form.matchId}
              onChange={(e) => setForm({ ...form, matchId: e.target.value })}
            >
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input
            label="Price (cents)"
            type="number"
            value={form.priceCents}
            onChange={(e) => setForm({ ...form, priceCents: Number(e.target.value) })}
          />
          <Input
            label="Total inventory"
            type="number"
            value={form.totalInventory}
            onChange={(e) => setForm({ ...form, totalInventory: Number(e.target.value) })}
          />
          <div className="md:col-span-2">
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>
        <Button className="mt-4" onClick={create}>
          Create
        </Button>
      </div>

      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat.id} className="rounded-2xl border border-white/10 bg-[#0a1420] p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label="Name"
                value={cat.name}
                onChange={(e) =>
                  setCategories((list) =>
                    list.map((c) => (c.id === cat.id ? { ...c, name: e.target.value } : c))
                  )
                }
              />
              <Input
                label="Price (cents)"
                type="number"
                value={cat.priceCents}
                onChange={(e) =>
                  setCategories((list) =>
                    list.map((c) =>
                      c.id === cat.id ? { ...c, priceCents: Number(e.target.value) } : c
                    )
                  )
                }
              />
              <Input
                label="Total inventory"
                type="number"
                value={cat.totalInventory}
                onChange={(e) =>
                  setCategories((list) =>
                    list.map((c) =>
                      c.id === cat.id ? { ...c, totalInventory: Number(e.target.value) } : c
                    )
                  )
                }
              />
              <div className="text-sm text-white/60">
                Reserved: {cat.reservedCount} · Sold: {cat.soldCount} · Available: {cat.available}
                <div>Display: {formatCurrency(cat.priceCents)}</div>
              </div>
              <div className="md:col-span-2">
                <Textarea
                  label="Description"
                  value={cat.description}
                  onChange={(e) =>
                    setCategories((list) =>
                      list.map((c) => (c.id === cat.id ? { ...c, description: e.target.value } : c))
                    )
                  }
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button onClick={() => save(cat)}>Save</Button>
              <Button
                variant="secondary"
                onClick={() => save({ ...cat, isActive: !cat.isActive })}
              >
                {cat.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
