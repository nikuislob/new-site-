"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Notify } from "@/components/ui/PageHeader";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fd.get("email"),
          password: fd.get("password"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="glass w-full max-w-md space-y-4 rounded-[var(--radius)] p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-[var(--gold)]">Admin Access</p>
        <h1 className="font-display text-4xl">Sign in</h1>
      </div>
      {error ? <Notify tone="error">{error}</Notify> : null}
      <Input id="email" name="email" type="email" label="Email" required defaultValue="admin@pitchora.com" />
      <Input id="password" name="password" type="password" label="Password" required defaultValue="Admin123!" />
      <Button type="submit" variant="gold" className="w-full" disabled={loading}>
        {loading ? "Signing in..." : "Login"}
      </Button>
    </form>
  );
}
