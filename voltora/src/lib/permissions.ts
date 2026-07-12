export type AdminRole = "SUPER_ADMIN" | "TICKET_MANAGER" | "SUPPORT_AGENT";

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  SUPER_ADMIN: ["*"],
  TICKET_MANAGER: [
    "dashboard",
    "matches",
    "categories",
    "zones",
    "orders",
    "payments",
    "payment_links",
    "tickets",
    "users",
    "settings",
  ],
  SUPPORT_AGENT: ["dashboard", "support", "orders:read", "tickets:read", "users:read"],
};

export function adminCan(role: AdminRole | string, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role as AdminRole] || [];
  if (perms.includes("*")) return true;
  if (perms.includes(permission)) return true;
  const base = permission.split(":")[0];
  return perms.includes(base);
}
