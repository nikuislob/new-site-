"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { DataTable } from "@/components/admin/DataTable";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
};

const emptyForm = { name: "", description: "", imageUrl: "", sortOrder: 0, isActive: true };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ categories: Category[] }>("/api/admin/categories");
      setCategories(data.categories);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit(cat: Category) {
    setEditId(cat.id);
    setForm({
      name: cat.name,
      description: cat.description || "",
      imageUrl: cat.imageUrl || "",
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
    });
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
      if (editId) {
        await adminFetch(`/api/admin/categories/${editId}`, {
          method: "PATCH",
          body: JSON.stringify({
            ...form,
            description: form.description || null,
            imageUrl: form.imageUrl || null,
          }),
        });
      } else {
        await adminFetch("/api/admin/categories", {
          method: "POST",
          body: JSON.stringify({
            ...form,
            description: form.description || null,
            imageUrl: form.imageUrl || null,
          }),
        });
      }
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(cat: Category) {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await adminFetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
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
          <h1 className="font-display text-2xl font-bold text-white">Categories</h1>
          <p className="mt-1 text-sm text-[#8b9cb8]">Organize product catalog</p>
        </div>
        <button type="button" onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-lg bg-[#00c2a8] px-4 py-2 text-sm font-semibold text-[#0b1220]">
          <Plus className="h-4 w-4" /> Add category
        </button>
      </div>

      {error ? <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">{error}</div> : null}

      {showForm ? (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[#1e2d45] bg-[#121a2b] p-5">
          <h2 className="mb-4 font-display text-lg font-semibold text-white">{editId ? "Edit" : "New"} category</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cat-name" className={labelClass}>Name *</label>
              <input id="cat-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label htmlFor="cat-sort" className={labelClass}>Sort order</label>
              <input id="cat-sort" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value, 10) || 0 })} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="cat-desc" className={labelClass}>Description</label>
              <textarea id="cat-desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="cat-img" className={labelClass}>Image URL</label>
              <input id="cat-img" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className={inputClass} />
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
        data={categories}
        keyExtractor={(c) => c.id}
        columns={[
          { key: "name", header: "Name", cell: (c) => c.name },
          { key: "slug", header: "Slug", cell: (c) => <span className="font-mono text-xs">{c.slug}</span> },
          { key: "products", header: "Products", cell: (c) => c._count?.products ?? 0 },
          { key: "sort", header: "Order", cell: (c) => c.sortOrder },
          { key: "active", header: "Active", cell: (c) => (c.isActive ? "Yes" : "No") },
          {
            key: "actions",
            header: "Actions",
            cell: (c) => (
              <div className="flex gap-1">
                <button type="button" onClick={() => startEdit(c)} className="rounded p-1.5 text-[#8b9cb8] hover:text-white"><Pencil className="h-4 w-4" /></button>
                <button type="button" onClick={() => remove(c)} className="rounded p-1.5 text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
