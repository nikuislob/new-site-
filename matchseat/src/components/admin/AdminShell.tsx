"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  ReceiptText,
  Shield,
  X,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import type { AdminRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

type AdminShellProps = {
  children: React.ReactNode;
  admin: {
    name: string;
    email: string;
    role: AdminRole | string;
  };
};

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/matches", label: "Matches", icon: CalendarDays },
  { href: "/admin/orders", label: "Orders", icon: ReceiptText },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/support", label: "Support Chat", icon: MessageSquare },
];

export function AdminShell({ children, admin }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await adminFetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-white/10 bg-[#0a1628] text-white shadow-2xl shadow-slate-950/30">
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#1f8a4c] text-white shadow-lg shadow-emerald-950/30">
          <Shield size={22} />
        </div>
        <div>
          <p className="font-display text-2xl leading-none tracking-wide">PitchPass</p>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200/80">
            Admin Ops
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white",
                active && "bg-[#1f8a4c] text-white shadow-lg shadow-emerald-950/30"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-4 rounded-2xl bg-white/[0.06] p-4">
          <p className="truncate text-sm font-bold text-white">{admin.name}</p>
          <p className="truncate text-xs text-slate-300">{admin.email}</p>
          <p className="mt-2 inline-flex rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-200">
            {admin.role.replaceAll("_", " ")}
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/10 disabled:opacity-60"
        >
          <LogOut size={16} />
          {loggingOut ? "Signing out..." : "Logout"}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#eef4ef] text-slate-950">
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">{sidebar}</div>

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-xl border border-slate-200 p-2 text-[#0a1628]"
            aria-label="Open admin navigation"
          >
            <Menu size={22} />
          </button>
          <div className="text-center">
            <p className="font-display text-xl leading-none text-[#0a1628]">PitchPass</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1f8a4c]">Admin</p>
          </div>
          <div className="h-10 w-10" />
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close admin navigation"
            className="absolute inset-0 bg-slate-950/60"
            onClick={() => setOpen(false)}
          />
          <div className="relative h-full w-72">
            {sidebar}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-full bg-white/10 p-2 text-white"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      ) : null}

      <main className="lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
