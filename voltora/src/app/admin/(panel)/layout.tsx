"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell, type AdminUser } from "@/components/admin/AdminShell";
import { adminFetch } from "@/lib/admin-fetch";

type AdminContextValue = {
  admin: AdminUser;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminPanelLayout");
  return ctx;
}

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await adminFetch<{ admin: AdminUser }>("/api/admin/auth/me");
        if (!cancelled) setAdmin(data.admin);
      } catch {
        if (!cancelled) router.replace("/admin/login");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1220] text-[#8b9cb8]">
        Loading admin panel…
      </div>
    );
  }

  if (!admin) return null;

  return (
    <AdminContext.Provider value={{ admin }}>
      <AdminShell admin={admin}>{children}</AdminShell>
    </AdminContext.Provider>
  );
}
