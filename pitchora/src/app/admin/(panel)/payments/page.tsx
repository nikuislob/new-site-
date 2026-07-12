"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Notify } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";

type PaySettings = {
  upperApplePayUrl: string;
  upperCashAppUrl: string;
  closerApplePayUrl: string;
  closerCashAppUrl: string;
};

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<PaySettings | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) =>
        setSettings({
          upperApplePayUrl: d.settings.upperApplePayUrl,
          upperCashAppUrl: d.settings.upperCashAppUrl,
          closerApplePayUrl: d.settings.closerApplePayUrl,
          closerCashAppUrl: d.settings.closerCashAppUrl,
        })
      )
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Failed");
      return;
    }
    setMessage("Payment links updated instantly");
  }

  if (loading || !settings) return <Spinner />;

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="font-display text-5xl">Payment Settings</h1>
        <p className="text-[var(--ink-muted)]">Apple Pay and Cash App links by seat category.</p>
      </div>
      {message ? <Notify tone="success">{message}</Notify> : null}
      <form onSubmit={onSubmit} className="glass grid max-w-2xl gap-4 rounded-2xl p-5">
        <h2 className="font-display text-2xl text-[var(--gold)]">Upper Seats</h2>
        <Input
          id="upperApple"
          label="Apple Pay URL"
          value={settings.upperApplePayUrl}
          onChange={(e) => setSettings({ ...settings, upperApplePayUrl: e.target.value })}
        />
        <Input
          id="upperCash"
          label="Cash App URL"
          value={settings.upperCashAppUrl}
          onChange={(e) => setSettings({ ...settings, upperCashAppUrl: e.target.value })}
        />
        <h2 className="mt-4 font-display text-2xl text-[var(--gold)]">Closer Seats</h2>
        <Input
          id="closerApple"
          label="Apple Pay URL"
          value={settings.closerApplePayUrl}
          onChange={(e) => setSettings({ ...settings, closerApplePayUrl: e.target.value })}
        />
        <Input
          id="closerCash"
          label="Cash App URL"
          value={settings.closerCashAppUrl}
          onChange={(e) => setSettings({ ...settings, closerCashAppUrl: e.target.value })}
        />
        <Button type="submit" variant="gold">
          Save Payment Links
        </Button>
      </form>
    </div>
  );
}
