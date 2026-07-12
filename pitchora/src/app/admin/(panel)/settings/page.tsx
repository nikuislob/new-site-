"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Notify } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminSettingsPage() {
  const [liveChatEnabled, setLiveChatEnabled] = useState(true);
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        setLiveChatEnabled(d.settings.liveChatEnabled);
        setWhatsappUrl(d.settings.whatsappUrl);
      })
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ liveChatEnabled, whatsappUrl }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Failed");
      return;
    }
    setMessage("Settings saved");
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="font-display text-5xl">Settings</h1>
        <p className="text-[var(--ink-muted)]">Support channel preferences.</p>
      </div>
      {message ? <Notify tone="success">{message}</Notify> : null}
      <form onSubmit={onSubmit} className="glass max-w-xl space-y-4 rounded-2xl p-5">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={liveChatEnabled} onChange={(e) => setLiveChatEnabled(e.target.checked)} />
          Live chat enabled
        </label>
        <Input id="wa" label="WhatsApp URL" value={whatsappUrl} onChange={(e) => setWhatsappUrl(e.target.value)} />
        <Button type="submit" variant="gold">
          Save
        </Button>
      </form>
    </div>
  );
}
