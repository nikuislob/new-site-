"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { DataTable } from "@/components/admin/DataTable";

type Brand = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isActive: boolean;
  _count?: { products: number };
};

const emptyForm = { name: "", logoUrl: "", isActive: true };

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ brands: Brand[] }>("/api/admin/brands");
      setBrands(data.brands);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load brands");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit(brand: Brand) {
    setEditId(brand.id);
    setForm({ name: brand.name, logoUrl: brand.logoUrl || "", isActive: brand.isActive });
    setShowForm(true);
  }

  function resetForm() {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, logoUrl: form.logoUrl || null };
      if (editId) {
        await adminFetch(`/api/admin/brands/${editId}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await adminFetch("/api/admin/brands", { method: "POST", body: JSON.stringify(payload) });
      }
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(brand: Brand) {
    if (!confirm(`Delete brand "${brand.name}"?`)) return;
    try {
      await adminFetch(`/api/admin/brands/${brand.id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  const inputClass = "w-full rounded-lg border border-[#1e2d45] bg-[#0b1220] px-3 py-2 text-sm text-white focus:border-[#00c2a8] focus:outline-none";
  const labelClass = "mb-1 block text-sm font-medium text-[#c5d0e0]";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Brands</h1>
          <p className="mt-1 text-sm text-[#8b9cb8]">Manage product brands</p>
        </div>
        <button type="button" onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-lg bg-[#00c2a8] px-4 py-2 text-sm font-semibold text-[#0b1220]">
          <Plus className="h-4 w-4" /> Add brand
        </button>
      </div>

      {error ? <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">{error}</div> : null}

      {showForm ? (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[#1e2d45] bg-[#121a2b] p-5">
          <h2 className="mb-4 font-display text-lg font-semibold text-white">{editId ? "Edit" : "New"} brand</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="brand-name" className={labelClass}>Name *</label>
              <input id="brand-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label htmlFor="brand-logo" className={labelClass}>Logo URL</label>
              <input id="brand-logo" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} className={inputClass} />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#c5d0e0]">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-[#00c2a8]" />
              Active
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-[#00c2a8] px-4 py-2 text-sm font-semibold text-[#0b1220] disabled:opacity-60">{saving ? "Saving…" : "Save"}</button>
            <button type="button" onClick={resetForm} className="rounded-lg border border-[#1e2d45] px-4 py-2 text-sm text-[#c5d0e0]">Cancel</button>
          </div>
        </form>
      ) : null}

      <DataTable
        loading={loading}
        data={brands}
        keyExtractor={(b) => b.id}
        columns={[
          {
            key: "name",
            header: "Name",
            cell: (b) => (
              <div className="flex items-center gap-2">
                {b.logoUrl ? <img src={b.logoUrl} alt="" className="h-6 w-6 rounded object-contain" /> : null}
                {b.name}
              </div>
            ),
          },
          { key: "slug", header: "Slug", cell: (b) => <span className="font-mono text-xs">{b.slug}</span> },
          { key: "products", header: "Products", cell: (b) => b._count?.products ?? 0 },
          { key: "active", header: "Active", cell: (b) => (b.isActive ? "Yes" : "No") },
          {
            key: "actions",
            header: "Actions",
            cell: (b) => (
              <div className="flex gap-1">
                <button type="button" onClick={() => startEdit(b)} className="rounded p-1.5 text-[#8b9cb8] hover:text-white"><Pencil className="h-4 w-4" /></button>
                <button type="button" onClick={() => remove(b)} className="rounded p-1.5 text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
