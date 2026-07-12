"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Notify } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";

type Settings = {
  upperSeatPrice: number;
  closerSeatPrice: number;
  maxTicketsPerOrder: number;
  serviceFeeEnabled: boolean;
  serviceFeePercent: number;
  taxEnabled: boolean;
  taxPercent: number;
  uniquePaymentEnabled: boolean;
};

export default function TicketSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings))
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!settings) return;
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...settings,
        maxTicketsPerOrder: Math.min(2, settings.maxTicketsPerOrder),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Failed");
      return;
    }
    setSettings(data.settings);
    setMessage("Ticket settings saved");
  }

  if (loading || !settings) return <Spinner />;

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="font-display text-5xl">Ticket Settings</h1>
        <p className="text-[var(--ink-muted)]">Prices, limits, fees, and unique payment verification.</p>
      </div>
      {message ? <Notify tone="success">{message}</Notify> : null}
      <form onSubmit={onSubmit} className="glass grid max-w-2xl gap-4 rounded-2xl p-5 md:grid-cols-2">
        <Input
          id="upper"
          label="Upper Seat Price (USD)"
          type="number"
          step="0.01"
          value={settings.upperSeatPrice}
          onChange={(e) => setSettings({ ...settings, upperSeatPrice: Number(e.target.value) })}
        />
        <Input
          id="closer"
          label="Closer Seat Price (USD)"
          type="number"
          step="0.01"
          value={settings.closerSeatPrice}
          onChange={(e) => setSettings({ ...settings, closerSeatPrice: Number(e.target.value) })}
        />
        <Input
          id="max"
          label="Max tickets per booking"
          type="number"
          min={1}
          max={2}
          value={settings.maxTicketsPerOrder}
          onChange={(e) => setSettings({ ...settings, maxTicketsPerOrder: Number(e.target.value) })}
        />
        <Input
          id="feePct"
          label="Service fee %"
          type="number"
          step="0.01"
          value={settings.serviceFeePercent}
          onChange={(e) => setSettings({ ...settings, serviceFeePercent: Number(e.target.value) })}
        />
        <Input
          id="taxPct"
          label="Tax %"
          type="number"
          step="0.01"
          value={settings.taxPercent}
          onChange={(e) => setSettings({ ...settings, taxPercent: Number(e.target.value) })}
        />
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input
            type="checkbox"
            checked={settings.serviceFeeEnabled}
            onChange={(e) => setSettings({ ...settings, serviceFeeEnabled: e.target.checked })}
          />
          Enable service fee
        </label>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input
            type="checkbox"
            checked={settings.taxEnabled}
            onChange={(e) => setSettings({ ...settings, taxEnabled: e.target.checked })}
          />
          Enable taxes
        </label>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input
            type="checkbox"
            checked={settings.uniquePaymentEnabled}
            onChange={(e) => setSettings({ ...settings, uniquePaymentEnabled: e.target.checked })}
          />
          Enable unique payment verification amount (&lt; $3)
        </label>
        <div className="md:col-span-2">
          <Button type="submit" variant="gold">
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
