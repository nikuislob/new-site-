"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { adminFetch } from "@/lib/admin-fetch";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@pitchpass.example");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminFetch<{ admin: unknown | null }>("/api/admin/auth/me")
      .then((data) => {
        if (data.admin) router.replace("/admin/dashboard");
      })
      .catch(() => undefined);
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await adminFetch("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.replace("/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#0a1628] px-4 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(31,138,76,0.35),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent_28%)]" />
      <section className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-white p-8 text-slate-950 shadow-2xl shadow-slate-950/40">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#1f8a4c] text-white">
            <ShieldCheck size={28} />
          </div>
          <p className="font-display text-4xl leading-none text-[#0a1628]">PitchPass Admin</p>
          <p className="mt-2 text-sm text-slate-500">Football operations control panel</p>
        </div>

        <form className="grid gap-4" onSubmit={submit}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}
          <Button type="submit" loading={loading} fullWidth>
            Sign in
          </Button>
        </form>

        <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-bold">Demo admin</p>
          <p>admin@pitchpass.example / Admin123!</p>
        </div>
      </section>
    </main>
  );
}
