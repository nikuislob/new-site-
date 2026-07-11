"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/providers/AppProviders";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      toast("Welcome back!", "success");
      router.push(searchParams.get("next") || "/account");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="card-surface mx-auto max-w-md space-y-4 p-6 animate-fade-up">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">Access your Voltora account</p>
      </div>
      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        required
      />
      <Input
        label="Password"
        type="password"
        value={form.password}
        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        required
      />
      <div className="flex justify-end">
        <Link href="/account/forgot-password" className="text-sm text-[var(--brand-deep)] hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" fullWidth loading={loading}>
        Sign in
      </Button>
      <p className="text-center text-sm text-[var(--ink-muted)]">
        New to Voltora?{" "}
        <Link href="/account/register" className="font-semibold text-[var(--brand-deep)] hover:underline">
          Create account
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
