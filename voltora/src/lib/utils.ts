import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { NextResponse } from "next/server";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string) {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function safeJson<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorJson(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export const TICKET_PRICES = {
  standard: 85,
  premium: 150,
} as const;

export type TicketType = keyof typeof TICKET_PRICES;
