"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { CreditCard } from "lucide-react";
import type { AdminPaymentMethod, AdminPaymentOverride } from "@/components/admin/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Textarea";
import { adminFetch } from "@/lib/admin-fetch";
import { formatCurrency } from "@/lib/utils";
import { POSSIBLE_TOTALS_CENTS, resolvePaymentUrl } from "@/lib/tickets";

type MethodFormState = {
  name: string;
  urlTemplate: string;
  buttonText: string;
  instructions: string;
  isActive: boolean;
};

type OverrideFormState = Record<number, { paymentUrl: string; isActive: boolean }>;

function buildOverrideState(method: AdminPaymentMethod): OverrideFormState {
  return Object.fromEntries(
    POSSIBLE_TOTALS_CENTS.map((amountCents) => {
      const override = method.overrides.find((item) => item.amountCents === amountCents);
      return [
        amountCents,
        {
          paymentUrl: override?.paymentUrl || "",
          isActive: override?.isActive || false,
        },
      ];
    })
  ) as OverrideFormState;
}

function PaymentMethodCard({
  method,
  onMethodUpdated,
}: {
  method: AdminPaymentMethod;
  onMethodUpdated: (method: AdminPaymentMethod) => void;
}) {
  const [form, setForm] = useState<MethodFormState>({
    name: method.name,
    urlTemplate: method.urlTemplate,
    buttonText: method.buttonText,
    instructions: method.instructions || "",
    isActive: method.isActive,
  });
  const [overrides, setOverrides] = useState<OverrideFormState>(() => buildOverrideState(method));
  const [savingMethod, setSavingMethod] = useState(false);
  const [savingOverride, setSavingOverride] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateForm<K extends keyof MethodFormState>(key: K, value: MethodFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateOverride(amountCents: number, value: Partial<{ paymentUrl: string; isActive: boolean }>) {
    setOverrides((current) => ({
      ...current,
      [amountCents]: { ...current[amountCents], ...value },
    }));
  }

  async function saveMethod() {
    setSavingMethod(true);
    setError("");
    setMessage("");
    try {
      const data = await adminFetch<{ paymentMethod: AdminPaymentMethod }>("/api/admin/payments", {
        method: "PUT",
        body: JSON.stringify({
          id: method.id,
          name: form.name,
          urlTemplate: form.urlTemplate,
          buttonText: form.buttonText,
          instructions: form.instructions || null,
          isActive: form.isActive,
        }),
      });
      onMethodUpdated(data.paymentMethod);
      setMessage("Payment method saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save payment method.");
    } finally {
      setSavingMethod(false);
    }
  }

  async function saveOverride(amountCents: number) {
    const override = overrides[amountCents];
    const existing = method.overrides.find((item) => item.amountCents === amountCents);
    const paymentUrl = override.paymentUrl || existing?.paymentUrl;

    if (!paymentUrl) {
      setError("Add a fixed URL before saving an override.");
      return;
    }

    setSavingOverride(amountCents);
    setError("");
    setMessage("");
    try {
      const data = await adminFetch<{ override: AdminPaymentOverride }>("/api/admin/payments/overrides", {
        method: "PUT",
        body: JSON.stringify({
          paymentMethodId: method.id,
          amountCents,
          paymentUrl,
          isActive: override.isActive,
        }),
      });
      onMethodUpdated({
        ...method,
        overrides: [
          ...method.overrides.filter((item) => item.amountCents !== amountCents),
          data.override,
        ].sort((a, b) => a.amountCents - b.amountCents),
      });
      setMessage(`${formatCurrency(amountCents)} override saved.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save override.");
    } finally {
      setSavingOverride(null);
    }
  }

  return (
    <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-[#1f8a4c]">
            {method.iconUrl ? <Image src={method.iconUrl} alt="" width={34} height={24} /> : <CreditCard />}
          </div>
          <div>
            <h2 className="font-display text-3xl text-[#0a1628]">{method.name}</h2>
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">{method.code}</p>
          </div>
        </div>
        <label className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => updateForm("isActive", event.target.checked)}
            className="h-4 w-4 accent-[#1f8a4c]"
          />
          Active
        </label>
      </div>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</div> : null}
      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</div> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Input label="Display name" value={form.name} onChange={(event) => updateForm("name", event.target.value)} />
        <Input label="Button text" value={form.buttonText} onChange={(event) => updateForm("buttonText", event.target.value)} />
      </div>
      <Input
        label="URL template"
        value={form.urlTemplate}
        onChange={(event) => updateForm("urlTemplate", event.target.value)}
        placeholder="https://cash.app/$YourCashtag/{amount}"
      />
      <p className="-mt-3 text-sm text-slate-500">
        Use {"{amount}"} for dollar totals, {"{amountCents}"} for cents, or {"{dollars}"} for dollars.
      </p>
      <Textarea
        label="Checkout instructions"
        value={form.instructions}
        onChange={(event) => updateForm("instructions", event.target.value)}
      />
      <div>
        <Button type="button" loading={savingMethod} onClick={saveMethod}>
          Save {method.name}
        </Button>
      </div>

      <div className="grid gap-3 rounded-3xl bg-slate-50 p-4">
        <h3 className="font-display text-2xl text-[#0a1628]">Template preview</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {POSSIBLE_TOTALS_CENTS.map((amountCents) => (
            <div key={amountCents} className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-sm font-black text-slate-900">{formatCurrency(amountCents)}</p>
              <p className="mt-1 break-all text-xs text-slate-500">{resolvePaymentUrl(form.urlTemplate, amountCents)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        <div>
          <h3 className="font-display text-2xl text-[#0a1628]">Amount overrides</h3>
          <p className="text-sm text-slate-500">Optional fixed URLs for 70, 140, 210, and 280 dollar totals. Turn Active off to use the template.</p>
        </div>
        <div className="grid gap-3">
          {POSSIBLE_TOTALS_CENTS.map((amountCents) => (
            <div key={amountCents} className="grid gap-3 rounded-2xl border border-slate-200 p-3 lg:grid-cols-[7rem_1fr_auto_auto]">
              <div className="flex items-center font-black text-[#0a1628]">{formatCurrency(amountCents)}</div>
              <Input
                aria-label={`${formatCurrency(amountCents)} fixed URL`}
                value={overrides[amountCents]?.paymentUrl || ""}
                onChange={(event) => updateOverride(amountCents, { paymentUrl: event.target.value })}
                placeholder={resolvePaymentUrl(form.urlTemplate, amountCents)}
              />
              <label className="flex items-center gap-2 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={overrides[amountCents]?.isActive || false}
                  onChange={(event) => updateOverride(amountCents, { isActive: event.target.checked })}
                  className="h-4 w-4 accent-[#1f8a4c]"
                />
                Active
              </label>
              <Button type="button" variant="secondary" loading={savingOverride === amountCents} onClick={() => saveOverride(amountCents)}>
                Save
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function AdminPaymentsPage() {
  const [methods, setMethods] = useState<AdminPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    adminFetch<{ paymentMethods: AdminPaymentMethod[] }>("/api/admin/payments")
      .then((data) => {
        if (mounted) setMethods(data.paymentMethods);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to load payment methods.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const targetMethods = useMemo(() => {
    const filtered = methods.filter((method) => ["CASHAPP", "APPLEPAY"].includes(method.code.toUpperCase()));
    return filtered.length ? filtered : methods;
  }, [methods]);

  function updateMethod(updated: AdminPaymentMethod) {
    setMethods((current) => current.map((method) => (method.id === updated.id ? updated : method)));
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.25em] text-[#1f8a4c]">Payment ops</p>
        <h1 className="mt-2 font-display text-5xl text-[#0a1628]">Payments</h1>
        <p className="mt-2 max-w-3xl text-slate-500">
          Manage Cash App and Apple Pay templates, checkout copy, and fixed links for each supported cart total.
        </p>
      </div>

      {loading ? (
        <div className="grid min-h-[45vh] place-items-center rounded-3xl bg-white">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 font-bold text-rose-700">{error}</div>
      ) : (
        <div className="grid gap-6">
          {targetMethods.map((method) => (
            <PaymentMethodCard key={method.id} method={method} onMethodUpdated={updateMethod} />
          ))}
        </div>
      )}
    </div>
  );
}
