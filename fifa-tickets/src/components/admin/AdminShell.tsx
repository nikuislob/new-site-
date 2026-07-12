"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Armchair,
  CreditCard,
  ShoppingBag,
  Users,
  FileBarChart,
  MessageSquare,
  Tags,
  LogOut,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/matches", label: "Matches", icon: CalendarDays },
  { href: "/admin/seats", label: "Seat Inventory", icon: Armchair },
  { href: "/admin/categories", label: "Ticket Categories", icon: Tags },
  { href: "/admin/payment-links", label: "Payment Links", icon: CreditCard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/inquiries", label: "Bulk Inquiries", icon: MessageSquare },
  { href: "/admin/reports", label: "Sales Reports", icon: FileBarChart },
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
    <div className="admin-shell bg-[#0f1f18] text-white">
      <aside className="border-r border-white/10 bg-[#0b1812] p-4">
        <Link href="/admin" className="mb-8 flex items-center gap-2 px-2">
          <Ticket size={20} className="text-[var(--gold)]" />
          <span className="font-display text-2xl tracking-[0.08em]">ADMIN</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active ? "bg-[var(--pitch)] text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 border-t border-white/10 pt-4">
          <p className="px-2 text-xs text-white/50">{adminName}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/5"
          >
            <LogOut size={16} /> Sign out
          </button>
          <Link href="/" className="mt-1 block px-3 py-2 text-xs text-[var(--gold)]">
            ← View public site
          </Link>
        </div>
      </aside>
      <div className="min-h-screen overflow-auto bg-[var(--surface)] text-[var(--ink)]">
        <div className="p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}
