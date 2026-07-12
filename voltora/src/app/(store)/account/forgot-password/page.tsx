"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [demoUrl, setDemoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setDemoUrl(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setMessage(data.message);
      if (data.demoResetUrl) setDemoUrl(data.demoResetUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset Access"
      subtitle="We'll prepare a secure password reset link"
      footer={
        <Link href="/account/login" className="font-semibold text-[var(--accent)]">
          Back to login
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        {message ? <p className="text-sm text-[var(--brand)]">{message}</p> : null}
        {demoUrl ? (
          <p className="break-all rounded-xl bg-black/30 p-3 text-xs text-white/70">
            Demo reset link:{" "}
            <Link href={demoUrl} className="text-[var(--accent)] underline">
              {demoUrl}
            </Link>
          </p>
        ) : null}
        <Button type="submit" fullWidth loading={loading} className="btn-glow">
          Send Reset Link
        </Button>
      </form>
    </AuthShell>
  );
}
