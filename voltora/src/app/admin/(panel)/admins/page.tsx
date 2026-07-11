"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { DataTable } from "@/components/admin/DataTable";

type Admin = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  totpEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

const ROLES = ["SUPER_ADMIN", "PRODUCT_MANAGER", "ORDER_MANAGER", "PAYMENT_MANAGER", "SUPPORT_AGENT"] as const;

const emptyForm = { email: "", password: "", name: "", role: "SUPPORT_AGENT" as (typeof ROLES)[number] };

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminFetch<{ admins: Admin[] }>("/api/admin/admins");
      setAdmins(data.admins);
      setForbidden(false);
    } catch (e) {
      if (e instanceof Error && e.message.includes("Forbidden")) {
        setForbidden(true);
      } else {
        setError(e instanceof Error ? e.message : "Failed to load admins");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await adminFetch("/api/admin/admins", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-lg border border-[#1e2d45] bg-[#0b1220] px-3 py-2 text-sm text-white focus:border-[#00c2a8] focus:outline-none";
  const labelClass = "mb-1 block text-sm font-medium text-[#c5d0e0]";

  if (forbidden) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-bold text-white">Admins</h1>
        <p className="text-[#8b9cb8]">Only super admins can manage admin accounts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Admin users</h1>
          <p className="mt-1 text-sm text-[#8b9cb8]">Manage staff accounts (super admin only)</p>
        </div>
        <button type="button" onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 rounded-lg bg-[#00c2a8] px-4 py-2 text-sm font-semibold text-[#0b1220]">
          <Plus className="h-4 w-4" /> New admin
        </button>
      </div>

      {error ? <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">{error}</div> : null}

      {showForm ? (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[#1e2d45] bg-[#121a2b] p-5">
          <h2 className="mb-4 font-display text-lg font-semibold text-white">Create admin</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="admin-name" className={labelClass}>Name *</label>
              <input id="admin-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label htmlFor="admin-email" className={labelClass}>Email *</label>
              <input id="admin-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label htmlFor="admin-password" className={labelClass}>Password *</label>
              <input id="admin-password" type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} />
              <p className="mt-1 text-xs text-[#8b9cb8]">Min 8 chars, must include letter and number</p>
            </div>
            <div>
              <label htmlFor="admin-role" className={labelClass}>Role *</label>
              <select id="admin-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as typeof form.role })} className={inputClass}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-[#00c2a8] px-4 py-2 text-sm font-semibold text-[#0b1220] disabled:opacity-60">{saving ? "Creating…" : "Create"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-[#1e2d45] px-4 py-2 text-sm text-[#c5d0e0]">Cancel</button>
          </div>
        </form>
      ) : null}

      <DataTable
        loading={loading}
        data={admins}
        keyExtractor={(a) => a.id}
        columns={[
          { key: "name", header: "Name", cell: (a) => a.name },
          { key: "email", header: "Email", cell: (a) => a.email },
          { key: "role", header: "Role", cell: (a) => a.role.replace(/_/g, " ") },
          { key: "active", header: "Active", cell: (a) => (a.isActive ? "Yes" : "No") },
          { key: "2fa", header: "2FA", cell: (a) => (a.totpEnabled ? "On" : "Off") },
          { key: "lastLogin", header: "Last login", cell: (a) => a.lastLoginAt ? format(new Date(a.lastLoginAt), "MMM d, yyyy") : "—" },
          { key: "created", header: "Created", cell: (a) => format(new Date(a.createdAt), "MMM d, yyyy") },
        ]}
      />
    </div>
  );
}
