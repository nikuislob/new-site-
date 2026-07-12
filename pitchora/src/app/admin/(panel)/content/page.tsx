"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Notify } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";

type ContentSettings = {
  siteName: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroImageUrl: string | null;
  footerText: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  whatsappUrl: string;
  faqJson: string;
  privacyPolicy: string;
  termsAndConditions: string;
};

export default function ContentPage() {
  const [settings, setSettings] = useState<ContentSettings | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings))
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    try {
      JSON.parse(settings.faqJson || "[]");
    } catch {
      setMessage("FAQ JSON is invalid");
      return;
    }
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
    setMessage("Content updated");
  }

  if (loading || !settings) return <Spinner />;

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="font-display text-5xl">Content Management</h1>
        <p className="text-[var(--ink-muted)]">Hero, footer, contact, FAQ, privacy, and terms.</p>
      </div>
      {message ? <Notify tone="success">{message}</Notify> : null}
      <form onSubmit={onSubmit} className="glass grid max-w-3xl gap-4 rounded-2xl p-5">
        <Input
          id="siteName"
          label="Site name"
          value={settings.siteName}
          onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
        />
        <Input
          id="heroHeadline"
          label="Hero headline"
          value={settings.heroHeadline}
          onChange={(e) => setSettings({ ...settings, heroHeadline: e.target.value })}
        />
        <Textarea
          id="heroSub"
          label="Hero subheadline"
          value={settings.heroSubheadline}
          onChange={(e) => setSettings({ ...settings, heroSubheadline: e.target.value })}
        />
        <Input
          id="heroImage"
          label="Hero image URL"
          value={settings.heroImageUrl || ""}
          onChange={(e) => setSettings({ ...settings, heroImageUrl: e.target.value })}
        />
        <Textarea
          id="footer"
          label="Footer text"
          value={settings.footerText}
          onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
        />
        <Input
          id="email"
          label="Contact email"
          value={settings.contactEmail}
          onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
        />
        <Input
          id="phone"
          label="Contact phone"
          value={settings.contactPhone}
          onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
        />
        <Input
          id="address"
          label="Contact address"
          value={settings.contactAddress}
          onChange={(e) => setSettings({ ...settings, contactAddress: e.target.value })}
        />
        <Input
          id="whatsapp"
          label="WhatsApp URL"
          value={settings.whatsappUrl}
          onChange={(e) => setSettings({ ...settings, whatsappUrl: e.target.value })}
        />
        <Textarea
          id="faq"
          label="FAQ JSON"
          value={settings.faqJson}
          onChange={(e) => setSettings({ ...settings, faqJson: e.target.value })}
        />
        <Textarea
          id="privacy"
          label="Privacy Policy"
          value={settings.privacyPolicy}
          onChange={(e) => setSettings({ ...settings, privacyPolicy: e.target.value })}
        />
        <Textarea
          id="terms"
          label="Terms & Conditions"
          value={settings.termsAndConditions}
          onChange={(e) => setSettings({ ...settings, termsAndConditions: e.target.value })}
        />
        <Button type="submit" variant="gold">
          Save Content
        </Button>
      </form>
    </div>
  );
}
