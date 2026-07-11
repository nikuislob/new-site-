"use client";

import { useEffect, useState, type FormEvent } from "react";
import { adminFetch } from "@/lib/admin-fetch";

type PaymentMethod = {
  slot: number;
  name: string;
  iconUrl: string | null;
  paymentUrl: string;
  buttonText: string;
  instructions: string | null;
  isActive: boolean;
};

const emptySlot = (slot: number): PaymentMethod => ({
  slot,
  name: "",
  iconUrl: "",
  paymentUrl: "",
  buttonText: "Pay Now",
  instructions: "",
  isActive: false,
});

export default function PaymentsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([
    emptySlot(1), emptySlot(2), emptySlot(3), emptySlot(4),
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await adminFetch<{ paymentMethods: PaymentMethod[] }>("/api/admin/payments");
        setMethods(data.paymentMethods.map((m) => ({
          ...m,
          iconUrl: m.iconUrl || "",
          instructions: m.instructions || "",
        })));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load payment methods");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function updateSlot(slot: number, patch: Partial<PaymentMethod>) {
    setMethods((prev) => prev.map((m) => (m.slot === slot ? { ...m, ...patch } : m)));
  }

  async function saveSlot(slot: number, e: FormEvent) {
    e.preventDefault();
    const method = methods.find((m) => m.slot === slot);
    if (!method) return;

    setSaving(slot);
    setError("");
    setSuccess("");

    try {
      await adminFetch("/api/admin/payments", {
        method: "PUT",
        body: JSON.stringify({
          slot: method.slot,
          name: method.name,
          iconUrl: method.iconUrl || null,
          paymentUrl: method.paymentUrl,
          buttonText: method.buttonText,
          instructions: method.instructions || null,
          isActive: method.isActive,
        }),
      });
      setSuccess(`Payment slot ${slot} saved.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(null);
    }
  }

  const inputClass = "w-full rounded-lg border border-[#1e2d45] bg-[#0b1220] px-3 py-2 text-sm text-white focus:border-[#00c2a8] focus:outline-none";
  const labelClass = "mb-1 block text-sm font-medium text-[#c5d0e0]";

  if (loading) return <p className="text-[#8b9cb8]">Loading payment methods…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Payment methods</h1>
        <p className="mt-1 text-sm text-[#8b9cb8]">Configure exactly 4 checkout payment slots</p>
      </div>

      {error ? <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">{error}</div> : null}
      {success ? <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-sm text-teal-300" role="status">{success}</div> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {methods.map((method) => (
          <form
            key={method.slot}
            onSubmit={(e) => saveSlot(method.slot, e)}
            className="rounded-xl border border-[#1e2d45] bg-[#121a2b] p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-white">Slot {method.slot}</h2>
              <label className="flex items-center gap-2 text-sm text-[#c5d0e0]">
                <input
                  type="checkbox"
                  checked={method.isActive}
                  onChange={(e) => updateSlot(method.slot, { isActive: e.target.checked })}
                  className="accent-[#00c2a8]"
                />
                Active
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor={`name-${method.slot}`} className={labelClass}>Name *</label>
                <input id={`name-${method.slot}`} required value={method.name} onChange={(e) => updateSlot(method.slot, { name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label htmlFor={`icon-${method.slot}`} className={labelClass}>Icon URL</label>
                <input id={`icon-${method.slot}`} value={method.iconUrl || ""} onChange={(e) => updateSlot(method.slot, { iconUrl: e.target.value })} className={inputClass} placeholder="https://…" />
              </div>
              <div>
                <label htmlFor={`url-${method.slot}`} className={labelClass}>Payment URL (HTTPS) *</label>
                <input id={`url-${method.slot}`} type="url" required value={method.paymentUrl} onChange={(e) => updateSlot(method.slot, { paymentUrl: e.target.value })} className={inputClass} placeholder="https://pay.example.com/…" />
              </div>
              <div>
                <label htmlFor={`btn-${method.slot}`} className={labelClass}>Button text *</label>
                <input id={`btn-${method.slot}`} required value={method.buttonText} onChange={(e) => updateSlot(method.slot, { buttonText: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label htmlFor={`instr-${method.slot}`} className={labelClass}>Instructions</label>
                <textarea id={`instr-${method.slot}`} rows={3} value={method.instructions || ""} onChange={(e) => updateSlot(method.slot, { instructions: e.target.value })} className={inputClass} />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving === method.slot}
              className="mt-4 w-full rounded-lg bg-[#00c2a8] px-4 py-2.5 text-sm font-semibold text-[#0b1220] hover:bg-[#00d4b8] disabled:opacity-60"
            >
              {saving === method.slot ? "Saving…" : `Save slot ${method.slot}`}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
