"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function AdminLoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("admin@arenanights.example");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push(search.get("redirect") || "/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050b14] px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0a1422] p-6 shadow-2xl"
      >
        <div className="font-display text-3xl tracking-[0.12em] text-white">ARENA NIGHTS</div>
        <p className="mt-1 text-sm text-white/55">Admin sign in</p>
        <div className="mt-6 space-y-3">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
        <Button className="mt-5" fullWidth loading={loading} type="submit">
          Sign In
        </Button>
      </form>
    </div>
  );
}
