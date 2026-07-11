"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  CreditCard,
  MessageSquare,
  FolderTree,
  Tag,
  Ticket,
  FileText,
  Settings,
  Users,
  LogOut,
  Menu,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { adminFetch } from "@/lib/admin-fetch";
import { adminCan, type AdminRole } from "@/lib/admin-permissions";

export type { AdminRole };

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  totpEnabled?: boolean;
  lastLoginAt?: string | null;
};

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard" },
  { href: "/admin/products", label: "Products", icon: Package, permission: "products" },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, permission: "orders:read" },
  { href: "/admin/payments", label: "Payments", icon: CreditCard, permission: "payments" },
  { href: "/admin/support", label: "Support", icon: MessageSquare, permission: "support:read" },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, permission: "categories" },
  { href: "/admin/brands", label: "Brands", icon: Tag, permission: "brands" },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket, permission: "coupons" },
  { href: "/admin/content", label: "Content", icon: FileText, permission: "content" },
  { href: "/admin/settings", label: "Settings", icon: Settings, permission: "content" },
  { href: "/admin/admins", label: "Admins", icon: Users, superOnly: true },
] as const;

type AdminShellProps = {
  admin: AdminUser;
  children: React.ReactNode;
};

export function AdminShell({ admin, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const visibleNav = NAV_ITEMS.filter((item) => {
    if ("superOnly" in item && item.superOnly) return admin.role === "SUPER_ADMIN";
    if ("permission" in item) return adminCan(admin.role, item.permission);
    return true;
  });

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await adminFetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    } finally {
      setLoggingOut(false);
    }
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-[#1e2d45] px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00c2a8]/15 text-[#00c2a8]">
          <Zap className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="font-display text-lg font-bold text-white">Voltora</p>
          <p className="text-xs text-[#8b9cb8]">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Admin navigation">
        {visibleNav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[#00c2a8]/15 text-[#00c2a8]"
                  : "text-[#c5d0e0] hover:bg-[#182338] hover:text-white"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#1e2d45] p-4">
        <p className="truncate text-sm font-medium text-white">{admin.name}</p>
        <p className="truncate text-xs text-[#8b9cb8]">{admin.email}</p>
        <p className="mt-0.5 text-xs text-[#00c2a8]">{admin.role.replace(/_/g, " ")}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b1220] text-[#e8edf5]">
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-[#1e2d45] bg-[#0b1220] transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          type="button"
          className="absolute right-3 top-4 rounded-lg p-1 text-[#8b9cb8] hover:text-white lg:hidden"
          aria-label="Close sidebar"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
        {sidebar}
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#1e2d45] bg-[#0b1220]/95 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-[#8b9cb8] hover:bg-[#182338] hover:text-white lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-[#8b9cb8] sm:inline">
              Signed in as <span className="text-white">{admin.name}</span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 rounded-lg border border-[#1e2d45] bg-[#121a2b] px-3 py-2 text-sm font-medium text-[#c5d0e0] transition-colors hover:border-[#00c2a8]/40 hover:text-[#00c2a8] disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              {loggingOut ? "Signing out…" : "Logout"}
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
