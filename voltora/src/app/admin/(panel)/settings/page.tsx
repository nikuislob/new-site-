"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings || {}));
  }, []);

  const save = async () => {
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Failed");
      return;
    }
    setSettings(data.settings);
    setMessage("Settings saved");
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-white">Settings</h1>
      <div className="grid max-w-3xl gap-3">
        {Object.entries(settings).map(([key, value]) =>
          value.length > 80 ? (
            <Textarea
              key={key}
              label={key}
              value={value}
              onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
            />
          ) : (
            <Input
              key={key}
              label={key}
              value={value}
              onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
            />
          )
        )}
      </div>
      {message ? <p className="text-sm text-white/70">{message}</p> : null}
      <Button onClick={save}>Save Settings</Button>
    </div>
  );
}
