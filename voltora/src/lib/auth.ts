import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "./db";
import type { AdminUser, User } from "@prisma/client";

export type AdminRole = "SUPER_ADMIN" | "PRODUCT_MANAGER" | "ORDER_MANAGER" | "SUPPORT_AGENT";

const CUSTOMER_COOKIE = "pitchpass_session";
const ADMIN_COOKIE = "pitchpass_admin_session";

function customerSecret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret");
}

function adminSecret() {
  return new TextEncoder().encode(process.env.ADMIN_AUTH_SECRET || "dev-admin-secret");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createCustomerToken(userId: string): Promise<string> {
  const maxAge = Number(process.env.CUSTOMER_SESSION_MAX_AGE || 604800);
  return new SignJWT({ sub: userId, typ: "customer" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(customerSecret());
}

export async function createAdminToken(adminId: string, role: AdminRole): Promise<string> {
  const maxAge = Number(process.env.ADMIN_SESSION_MAX_AGE || 28800);
  return new SignJWT({ sub: adminId, typ: "admin", role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(adminSecret());
}

export async function setCustomerSession(userId: string) {
  const token = await createCustomerToken(userId);
  const maxAge = Number(process.env.CUSTOMER_SESSION_MAX_AGE || 604800);
  const jar = await cookies();
  jar.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function setAdminSession(adminId: string, role: AdminRole | string) {
  const adminRole = role as AdminRole;
  const token = await createAdminToken(adminId, adminRole);
  const maxAge = Number(process.env.ADMIN_SESSION_MAX_AGE || 28800);
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function clearCustomerSession() {
  const jar = await cookies();
  jar.delete(CUSTOMER_COOKIE);
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}

export async function getCustomerFromToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, customerSecret());
    if (payload.typ !== "customer" || typeof payload.sub !== "string") return null;
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

export async function getAdminFromToken(token: string): Promise<AdminUser | null> {
  try {
    const { payload } = await jwtVerify(token, adminSecret());
    if (payload.typ !== "admin" || typeof payload.sub !== "string") return null;
    const admin = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!admin || !admin.isActive) return null;
    return admin;
  } catch {
    return null;
  }
}

export async function getCurrentCustomer(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  return getCustomerFromToken(token);
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return getAdminFromToken(token);
}

export function getTokenFromRequest(req: NextRequest, kind: "customer" | "admin"): string | null {
  const name = kind === "customer" ? CUSTOMER_COOKIE : ADMIN_COOKIE;
  return req.cookies.get(name)?.value || null;
}

export async function requireCustomer(): Promise<User> {
  const user = await getCurrentCustomer();
  if (!user) throw new AuthError("Unauthorized", 401);
  return user;
}

export async function requireAdmin(roles?: (AdminRole | string)[]): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new AuthError("Unauthorized", 401);
  if (roles && roles.length > 0 && !roles.includes(admin.role) && admin.role !== "SUPER_ADMIN") {
    throw new AuthError("Forbidden", 403);
  }
  return admin;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function checkLoginRateLimit(
  email: string,
  context: "customer" | "admin",
  ip?: string | null
): Promise<{ allowed: boolean; retryAfterMinutes?: number }> {
  const maxAttempts = Number(process.env.LOGIN_MAX_ATTEMPTS || 5);
  const lockoutMinutes = Number(process.env.LOGIN_LOCKOUT_MINUTES || 15);
  const since = new Date(Date.now() - lockoutMinutes * 60 * 1000);

  const recentFails = await prisma.loginAttempt.count({
    where: {
      email: email.toLowerCase(),
      context,
      success: false,
      createdAt: { gte: since },
    },
  });

  if (recentFails >= maxAttempts) {
    return { allowed: false, retryAfterMinutes: lockoutMinutes };
  }

  void ip;
  return { allowed: true };
}

export async function recordLoginAttempt(
  email: string,
  success: boolean,
  context: "customer" | "admin",
  ip?: string | null
) {
  await prisma.loginAttempt.create({
    data: {
      email: email.toLowerCase(),
      success,
      context,
      ipAddress: ip || null,
    },
  });
}

export async function logAdminActivity(
  adminId: string,
  action: string,
  entity?: string,
  entityId?: string,
  details?: string,
  ipAddress?: string | null
) {
  await prisma.adminActivityLog.create({
    data: {
      adminId,
      action,
      entity,
      entityId,
      details,
      ipAddress: ipAddress || null,
    },
  });
}

export function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    createdAt: user.createdAt,
  };
}

export function publicAdmin(admin: AdminUser) {
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    totpEnabled: admin.totpEnabled,
    lastLoginAt: admin.lastLoginAt,
  };
}

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  SUPER_ADMIN: ["*"],
  PRODUCT_MANAGER: ["matches", "tickets", "content", "dashboard"],
  ORDER_MANAGER: ["bookings", "payments", "deliveries", "dashboard"],
  SUPPORT_AGENT: ["support", "orders:read", "dashboard"],
};

export function adminCan(role: AdminRole | string, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role as AdminRole] || [];
  if (perms.includes("*")) return true;
  if (perms.includes(permission)) return true;
  const base = permission.split(":")[0];
  return perms.includes(base);
}
