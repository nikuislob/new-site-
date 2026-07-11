"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/providers/AppProviders";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast("Passwords do not match", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      setDone(true);
      toast("Password updated", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Reset failed", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="card-surface mx-auto max-w-md p-6 text-center">
        <p className="text-[var(--danger)]">Invalid or missing reset token.</p>
        <Link href="/account/forgot-password" className="mt-4 inline-block text-sm font-semibold text-[var(--brand-deep)]">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card-surface mx-auto max-w-md space-y-4 p-6 animate-fade-up">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">Reset password</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">Choose a new password for your account</p>
      </div>
      {done ? (
        <p className="rounded-xl bg-[var(--brand-soft)] p-4 text-sm text-[#067260]">
          Your password has been updated.{" "}
          <Link href="/account/login" className="font-semibold underline">
            Sign in
          </Link>
        </p>
      ) : (
        <>
          <Input
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <Button type="submit" fullWidth loading={loading}>
            Update password
          </Button>
        </>
      )}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
