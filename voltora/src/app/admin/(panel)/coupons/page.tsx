"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { format } from "date-fns";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { DataTable } from "@/components/admin/DataTable";
import { formatCurrency } from "@/lib/utils";

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
};

const emptyForm = {
  code: "",
  description: "",
  discountType: "percent" as "percent" | "fixed",
  discountValue: 10,
  minOrderAmount: 0,
  maxUses: "" as string | number,
  isActive: true,
  expiresAt: "",
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ coupons: Coupon[] }>("/api/admin/coupons");
      setCoupons(data.coupons);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit(coupon: Coupon) {
    setEditId(coupon.id);
    setForm({
      code: coupon.code,
      description: coupon.description || "",
      discountType: coupon.discountType as "percent" | "fixed",
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      maxUses: coupon.maxUses ?? "",
      isActive: coupon.isActive,
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : "",
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
      const payload = {
        code: form.code,
        description: form.description || null,
        discountType: form.discountType,
        discountValue: form.discountValue,
        minOrderAmount: form.minOrderAmount,
        maxUses: form.maxUses === "" ? null : Number(form.maxUses),
        isActive: form.isActive,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      };
      if (editId) {
        await adminFetch(`/api/admin/coupons/${editId}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await adminFetch("/api/admin/coupons", { method: "POST", body: JSON.stringify(payload) });
      }
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(coupon: Coupon) {
    if (!confirm(`Delete coupon "${coupon.code}"?`)) return;
    try {
      await adminFetch(`/api/admin/coupons/${coupon.id}`, { method: "DELETE" });
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
          <h1 className="font-display text-2xl font-bold text-white">Coupons</h1>
          <p className="mt-1 text-sm text-[#8b9cb8]">Discount codes for checkout</p>
        </div>
        <button type="button" onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-lg bg-[#00c2a8] px-4 py-2 text-sm font-semibold text-[#0b1220]">
          <Plus className="h-4 w-4" /> Add coupon
        </button>
      </div>

      {error ? <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">{error}</div> : null}

      {showForm ? (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[#1e2d45] bg-[#121a2b] p-5">
          <h2 className="mb-4 font-display text-lg font-semibold text-white">{editId ? "Edit" : "New"} coupon</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="coupon-code" className={labelClass}>Code *</label>
              <input id="coupon-code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className={inputClass} />
            </div>
            <div>
              <label htmlFor="coupon-type" className={labelClass}>Discount type</label>
              <select id="coupon-type" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as "percent" | "fixed" })} className={inputClass}>
                <option value="percent">Percent</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </div>
            <div>
              <label htmlFor="coupon-value" className={labelClass}>Discount value *</label>
              <input id="coupon-value" type="number" min="0.01" step="0.01" required value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: parseFloat(e.target.value) || 0 })} className={inputClass} />
            </div>
            <div>
              <label htmlFor="coupon-min" className={labelClass}>Min order amount</label>
              <input id="coupon-min" type="number" min="0" step="0.01" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: parseFloat(e.target.value) || 0 })} className={inputClass} />
            </div>
            <div>
              <label htmlFor="coupon-max" className={labelClass}>Max uses (blank = unlimited)</label>
              <input id="coupon-max" type="number" min="1" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label htmlFor="coupon-expires" className={labelClass}>Expires at</label>
              <input id="coupon-expires" type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="coupon-desc" className={labelClass}>Description</label>
              <input id="coupon-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
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
        data={coupons}
        keyExtractor={(c) => c.id}
        columns={[
          { key: "code", header: "Code", cell: (c) => <span className="font-mono font-medium text-[#00c2a8]">{c.code}</span> },
          {
            key: "discount",
            header: "Discount",
            cell: (c) => c.discountType === "percent" ? `${c.discountValue}%` : formatCurrency(c.discountValue),
          },
          { key: "min", header: "Min order", cell: (c) => formatCurrency(c.minOrderAmount) },
          { key: "uses", header: "Uses", cell: (c) => `${c.usedCount}${c.maxUses ? ` / ${c.maxUses}` : ""}` },
          { key: "active", header: "Active", cell: (c) => (c.isActive ? "Yes" : "No") },
          { key: "expires", header: "Expires", cell: (c) => c.expiresAt ? format(new Date(c.expiresAt), "MMM d, yyyy") : "—" },
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
