export type AdminRole = "SUPER_ADMIN" | "MATCH_MANAGER" | "ORDER_MANAGER" | "SUPPORT_AGENT";

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  SUPER_ADMIN: ["*"],
  MATCH_MANAGER: ["matches", "dashboard"],
  ORDER_MANAGER: ["orders", "payments", "dashboard"],
  SUPPORT_AGENT: ["support", "orders:read", "dashboard"],
};

export function adminCan(role: AdminRole | string, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role as AdminRole] || [];
  if (perms.includes("*")) return true;
  if (perms.includes(permission)) return true;
  const base = permission.split(":")[0];
  return perms.includes(base);
}
