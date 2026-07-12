"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Tags,
  Map,
  ShoppingBag,
  CreditCard,
  Link2,
  Ticket,
  QrCode,
  MessageSquare,
  Settings,
  ScrollText,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { adminCan, type AdminRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", permission: "dashboard", icon: LayoutDashboard },
  { href: "/admin/matches", label: "Matches", permission: "matches", icon: CalendarDays },
  { href: "/admin/categories", label: "Ticket Categories", permission: "categories", icon: Tags },
  { href: "/admin/zones", label: "Stadium Zones", permission: "zones", icon: Map },
  { href: "/admin/orders", label: "Orders", permission: "orders", icon: ShoppingBag },
  { href: "/admin/users", label: "Users", permission: "users", icon: Users },
  { href: "/admin/payments", label: "Payments", permission: "payments", icon: CreditCard },
  { href: "/admin/payment-links", label: "Payment Links", permission: "payment_links", icon: Link2 },
  { href: "/admin/tickets", label: "Tickets", permission: "tickets", icon: Ticket },
  { href: "/admin/qr", label: "QR Management", permission: "tickets", icon: QrCode },
  { href: "/admin/support", label: "Live Chat", permission: "support", icon: MessageSquare },
  { href: "/admin/settings", label: "Settings", permission: "settings", icon: Settings },
  { href: "/admin/audit-logs", label: "Audit Logs", permission: "*", icon: ScrollText, superOnly: true },
];

export function AdminShell({
  admin,
  children,
}: {
  admin: { name: string; email: string; role: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const items = NAV.filter((item) => {
    if (item.superOnly) return admin.role === "SUPER_ADMIN";
    if (item.permission === "*") return admin.role === "SUPER_ADMIN";
    return adminCan(admin.role as AdminRole, item.permission) || adminCan(admin.role as AdminRole, `${item.permission}:read`);
  });

  const logout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const Nav = (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
              active ? "bg-[var(--brand-soft)] text-[var(--brand)]" : "text-white/70 hover:bg-white/5 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="admin-shell flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#050d14] lg:block">
        <div className="border-b border-white/10 px-4 py-5">
          <div className="font-display text-2xl tracking-[0.12em] text-white">ARENA NIGHTS</div>
          <div className="mt-1 text-xs text-white/45">Admin Control</div>
        </div>
        {Nav}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-white/10 p-2 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <div className="text-sm font-semibold text-white">{admin.name}</div>
              <div className="text-xs text-white/45">{admin.role}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-white/70 hover:bg-white/5"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/60" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-[#050d14]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div className="font-display text-xl text-white">MENU</div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            {Nav}
          </div>
        </div>
      ) : null}
    </div>
  );
}
