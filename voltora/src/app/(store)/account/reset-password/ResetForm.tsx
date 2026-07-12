"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ResetForm() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      router.push("/account/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="New Password"
      subtitle="Choose a strong password for your account"
      footer={
        <Link href="/account/login" className="font-semibold text-[var(--accent)]">
          Back to login
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3">
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
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        <Button type="submit" fullWidth loading={loading} disabled={!token} className="btn-glow">
          Update Password
        </Button>
      </form>
    </AuthShell>
  );
}
