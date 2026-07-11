export type AdminRole =
  | "SUPER_ADMIN"
  | "PRODUCT_MANAGER"
  | "ORDER_MANAGER"
  | "PAYMENT_MANAGER"
  | "SUPPORT_AGENT";

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  SUPER_ADMIN: ["*"],
  PRODUCT_MANAGER: ["products", "categories", "brands", "coupons", "content", "dashboard"],
  ORDER_MANAGER: ["orders", "payments", "dashboard"],
  PAYMENT_MANAGER: ["payments", "orders", "dashboard", "support:read"],
  SUPPORT_AGENT: ["support", "orders:read", "dashboard"],
};

export function adminCan(role: AdminRole | string, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role as AdminRole] || [];
  if (perms.includes("*")) return true;
  if (perms.includes(permission)) return true;

  if (permission.endsWith(":read")) {
    const base = permission.slice(0, -":read".length);
    if (perms.includes(base)) return true;
  }

  return false;
}

export function adminCanAssistPayment(role: AdminRole | string): boolean {
  return adminCan(role, "payments") || adminCan(role, "orders");
}
