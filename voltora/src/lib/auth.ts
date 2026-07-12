import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

export const ADMIN_COOKIE = "pitchpass_admin";

function adminSecret() {
  return new TextEncoder().encode(
    process.env.ADMIN_AUTH_SECRET || "dev-admin-secret-pitchpass"
  );
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function setAdminSession(adminId: string) {
  const maxAge = Number(process.env.ADMIN_SESSION_MAX_AGE || 28800);
  const token = await new SignJWT({ sub: adminId, typ: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(adminSecret());

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && !(process.env.NEXT_PUBLIC_APP_URL || "").startsWith("http://"),
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}

export async function requireAdmin() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) throw new AuthError("Unauthorized", 401);

  try {
    const { payload } = await jwtVerify(token, adminSecret());
    if (payload.typ !== "admin" || typeof payload.sub !== "string") {
      throw new AuthError("Unauthorized", 401);
    }
    const admin = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!admin) throw new AuthError("Unauthorized", 401);
    return admin;
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw new AuthError("Unauthorized", 401);
  }
}
