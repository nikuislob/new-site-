"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Ticket,
  CreditCard,
  ShoppingBag,
  Users,
  MessagesSquare,
  FileText,
  LogOut,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/matches", label: "Matches", icon: CalendarDays },
  { href: "/admin/ticket-settings", label: "Ticket Settings", icon: Ticket },
  { href: "/admin/payments", label: "Payment Settings", icon: CreditCard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/bulk-requests", label: "Bulk Requests", icon: MessagesSquare },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings2 },
];

export function AdminShell({ children, adminName }: { children: React.ReactNode; adminName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-white">
      <div className="mx-auto grid min-h-screen max-w-[1400px] lg:grid-cols-[240px_1fr]">
        <aside className="border-b border-[var(--line)] bg-black/50 lg:border-b-0 lg:border-r">
          <div className="px-5 py-6">
            <Link href="/admin" className="font-display text-3xl gold-text">
              PITCHORA
            </Link>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">Admin · {adminName}</p>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:flex-col">
            {nav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm transition",
                    active
                      ? "bg-[var(--gold-soft)] text-[var(--gold)]"
                      : "text-[var(--ink-muted)] hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={logout}
              className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-[var(--ink-muted)] hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </nav>
        </aside>
        <main className="p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
