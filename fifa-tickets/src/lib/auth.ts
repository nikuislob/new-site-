import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "./db";
import type { AdminUser } from "@prisma/client";

const ADMIN_COOKIE = "fifa_admin_session";

function adminSecret() {
  return new TextEncoder().encode(process.env.ADMIN_AUTH_SECRET || "dev-admin-secret");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createAdminToken(adminId: string, role: string): Promise<string> {
  const maxAge = Number(process.env.ADMIN_SESSION_MAX_AGE || 28800);
  return new SignJWT({ sub: adminId, typ: "admin", role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(adminSecret());
}

export async function setAdminSession(adminId: string, role: string) {
  const token = await createAdminToken(adminId, role);
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

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
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

export async function getAdminSession(): Promise<AdminUser | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return getAdminFromToken(token);
}

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminSession();
  if (!admin) throw new Error("UNAUTHORIZED");
  return admin;
}

export function getAdminTokenFromRequest(req: NextRequest): string | null {
  return req.cookies.get(ADMIN_COOKIE)?.value ?? null;
}

export async function requireAdminFromRequest(req: NextRequest): Promise<AdminUser> {
  const token = getAdminTokenFromRequest(req);
  if (!token) throw new Error("UNAUTHORIZED");
  const admin = await getAdminFromToken(token);
  if (!admin) throw new Error("UNAUTHORIZED");
  return admin;
}

export { ADMIN_COOKIE };
