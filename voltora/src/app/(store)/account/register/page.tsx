"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/providers/AppProviders";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      toast("Account created! Check your email to verify.", "success");
      router.push("/account/verify");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page py-10 sm:py-14">
      <form onSubmit={onSubmit} className="card-surface mx-auto max-w-md space-y-4 p-6 animate-fade-up">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold">Create account</h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">Join PitchPass for ticket tracking and delivery updates</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            required
          />
          <Input
            label="Last name"
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            required
          />
        </div>
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
        />
        <Input
          label="Phone (optional)"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          hint="At least 8 characters with a letter and number"
          required
        />
        <Button type="submit" fullWidth loading={loading}>
          Create account
        </Button>
        <p className="text-center text-sm text-[var(--ink-muted)]">
          Already have an account?{" "}
          <Link href="/account/login" className="font-semibold text-[var(--brand-deep)] hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
