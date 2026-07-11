"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/providers/AppProviders";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed");
      setSent(true);
      toast("If an account exists, reset instructions were sent.", "success");
    } catch {
      toast("Could not process request", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page py-10 sm:py-14">
      <form onSubmit={onSubmit} className="card-surface mx-auto max-w-md space-y-4 p-6 animate-fade-up">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold">Forgot password</h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Enter your email and we&apos;ll send reset instructions
          </p>
        </div>
        {sent ? (
          <p className="rounded-xl bg-[var(--brand-soft)] p-4 text-sm text-[#067260]">
            Check your email for a password reset link.
          </p>
        ) : (
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        )}
        {!sent ? (
          <Button type="submit" fullWidth loading={loading}>
            Send reset link
          </Button>
        ) : null}
        <p className="text-center text-sm">
          <Link href="/account/login" className="font-semibold text-[var(--brand-deep)] hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
