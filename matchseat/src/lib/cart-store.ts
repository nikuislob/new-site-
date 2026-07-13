"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SeatTier } from "@/lib/tickets";
import { MAX_TICKETS_PER_ORDER, calcCartTotals } from "@/lib/tickets";

export type CartItem = {
  matchId: string;
  matchLabel: string;
  venueLabel: string;
  kickoffAt: string;
  seatTier: SeatTier;
  quantity: number;
  unitPriceCents: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => { ok: boolean; error?: string };
  setQuantity: (matchId: string, seatTier: SeatTier, quantity: number) => { ok: boolean; error?: string };
  removeItem: (matchId: string, seatTier: SeatTier) => void;
  clear: () => void;
  ticketCount: () => number;
  totalCents: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      ticketCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
      totalCents: () =>
        calcCartTotals(
          get().items.map((i) => ({
            matchId: i.matchId,
            seatTier: i.seatTier,
            quantity: i.quantity,
          }))
        ).totalCents,
      addItem: (item) => {
        const qty = item.quantity ?? 1;
        const current = get().ticketCount();
        const existing = get().items.find(
          (i) => i.matchId === item.matchId && i.seatTier === item.seatTier
        );
        const otherCount = current - (existing?.quantity || 0);
        const nextQty = (existing?.quantity || 0) + qty;
        if (otherCount + nextQty > MAX_TICKETS_PER_ORDER) {
          return { ok: false, error: `Maximum ${MAX_TICKETS_PER_ORDER} tickets per customer.` };
        }
        set((state) => {
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.matchId === item.matchId && i.seatTier === item.seatTier
                  ? { ...i, quantity: nextQty }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: qty }],
          };
        });
        return { ok: true };
      },
      setQuantity: (matchId, seatTier, quantity) => {
        if (quantity <= 0) {
          get().removeItem(matchId, seatTier);
          return { ok: true };
        }
        const others = get().items.filter(
          (i) => !(i.matchId === matchId && i.seatTier === seatTier)
        );
        const otherCount = others.reduce((s, i) => s + i.quantity, 0);
        if (otherCount + quantity > MAX_TICKETS_PER_ORDER) {
          return { ok: false, error: `Maximum ${MAX_TICKETS_PER_ORDER} tickets per customer.` };
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.matchId === matchId && i.seatTier === seatTier ? { ...i, quantity } : i
          ),
        }));
        return { ok: true };
      },
      removeItem: (matchId, seatTier) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.matchId === matchId && i.seatTier === seatTier)
          ),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "pitchpass-cart" }
  )
);
