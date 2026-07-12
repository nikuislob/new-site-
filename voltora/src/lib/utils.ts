import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { nanoid } from "nanoid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amountCents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountCents / 100);
}

export function formatCurrencyFromDollars(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function dollarsToCents(amount: number): number {
  return Math.round(amount * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateOrderNumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `AN${y}${m}${d}-${nanoid(8).toUpperCase()}`;
}

export function generateAccessCode(): string {
  return nanoid(12).toUpperCase();
}

export function generateTicketNumber(): string {
  return `TIX-${nanoid(10).toUpperCase()}`;
}

export function generateQrToken(): string {
  return nanoid(32);
}

export function absoluteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function safeJson<T>(data: T, status = 200) {
  return Response.json(data, { status });
}

export function errorJson(message: string, status = 400, extra?: Record<string, unknown>) {
  return Response.json({ error: message, ...extra }, { status });
}

export function isValidHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.hostname === "localhost";
  } catch {
    return false;
  }
}

export function availabilityLabel(available: number, total: number): "AVAILABLE" | "LIMITED AVAILABILITY" | "SOLD OUT" {
  if (available <= 0) return "SOLD OUT";
  if (available <= Math.max(10, Math.floor(total * 0.15))) return "LIMITED AVAILABILITY";
  return "AVAILABLE";
}
