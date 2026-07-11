"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { adminFetch, AdminApiError } from "@/lib/admin-fetch";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await adminFetch("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.push("/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b1220] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00c2a8]/15 text-[#00c2a8]">
            <Zap className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Voltora Admin</h1>
          <p className="mt-1 text-sm text-[#8b9cb8]">Sign in to manage your store</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#1e2d45] bg-[#121a2b] p-6 shadow-xl"
          noValidate
        >
          {error ? (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
              {error}
            </div>
          ) : null}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#c5d0e0]">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#1e2d45] bg-[#0b1220] px-3 py-2.5 text-white placeholder:text-[#6b7d9a] focus:border-[#00c2a8] focus:outline-none focus:ring-1 focus:ring-[#00c2a8]"
                placeholder="admin@voltora.example"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#c5d0e0]">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#1e2d45] bg-[#0b1220] px-3 py-2.5 text-white placeholder:text-[#6b7d9a] focus:border-[#00c2a8] focus:outline-none focus:ring-1 focus:ring-[#00c2a8]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-[#00c2a8] px-4 py-2.5 text-sm font-semibold text-[#0b1220] transition-colors hover:bg-[#00d4b8] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 rounded-xl border border-[#1e2d45]/60 bg-[#121a2b]/50 p-4 text-center text-sm text-[#8b9cb8]">
          <p className="font-medium text-[#c5d0e0]">Demo credentials</p>
          <p className="mt-1 font-mono text-xs text-[#00c2a8]">admin@voltora.example</p>
          <p className="font-mono text-xs text-[#00c2a8]">Admin123!</p>
        </div>
      </div>
    </div>
  );
}
