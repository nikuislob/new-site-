import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "./db";
import type { AdminUser } from "@prisma/client";

const ADMIN_COOKIE = "pitchora_admin_session";

function adminSecret() {
  return new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || "pitchora-dev-secret");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createAdminToken(adminId: string, role: string): Promise<string> {
  return new SignJWT({ sub: adminId, typ: "admin", role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(adminSecret());
}

export async function setAdminSession(adminId: string, role: string) {
  const token = await createAdminToken(adminId, role);
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
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

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return getAdminFromToken(token);
}

export function getAdminTokenFromRequest(req: NextRequest): string | null {
  return req.cookies.get(ADMIN_COOKIE)?.value || null;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new AuthError("Unauthorized", 401);
  return admin;
}

export function publicAdmin(admin: AdminUser) {
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    lastLoginAt: admin.lastLoginAt,
  };
}
