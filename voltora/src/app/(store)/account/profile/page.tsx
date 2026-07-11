"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/providers/AppProviders";

interface ProfileData {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    emailVerified: boolean;
  };
  addresses: Array<{
    id: string;
    label: string;
    fullName: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    zipCode: string;
    isDefault: boolean;
  }>;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.status === 401) {
          window.location.href = "/account/login?next=/account/profile";
          return;
        }
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setProfile(data);
        setForm({
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          phone: data.user.phone || "",
        });
      } catch {
        toast("Could not load profile", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      toast("Profile updated", "success");
    } catch {
      toast("Could not update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="container-page flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="mb-8 font-display text-3xl font-bold">Profile</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="card-surface space-y-4 p-5">
          <h2 className="font-display text-lg font-semibold">Personal details</h2>
          <Input label="Email" value={profile.user.email} disabled />
          {!profile.user.emailVerified ? (
            <p className="text-xs font-semibold text-[var(--warning)]">Email not verified</p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            />
            <Input
              label="Last name"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            />
          </div>
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
          <Button type="button" variant="ghost" onClick={logout}>
            Sign out
          </Button>
        </form>

        <div className="card-surface p-5">
          <h2 className="font-display text-lg font-semibold">Saved addresses</h2>
          {profile.addresses.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--ink-muted)]">No addresses saved yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {profile.addresses.map((addr) => (
                <li key={addr.id} className="rounded-xl border border-[var(--line)] p-4 text-sm">
                  <p className="font-semibold">
                    {addr.label} {addr.isDefault ? <span className="text-[var(--brand-deep)]">· Default</span> : null}
                  </p>
                  <p className="mt-1 text-[var(--ink-muted)]">
                    {addr.fullName}<br />
                    {addr.line1}<br />
                    {addr.city}, {addr.state} {addr.zipCode}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
