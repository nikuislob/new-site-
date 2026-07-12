"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useChat } from "@/components/providers/ChatProvider";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import type { StadiumZoneView } from "./InteractiveStadium";

type Props = {
  selectedZone: StadiumZoneView | null;
  quantity: number;
  maxQuantity: number;
  onQuantityChange: (qty: number) => void;
  onContinue: () => void;
  sticky?: boolean;
};

export function BookingPanel({
  selectedZone,
  quantity,
  maxQuantity,
  onQuantityChange,
  onContinue,
  sticky,
}: Props) {
  const { openWithContext } = useChat();
  const [groupOpen, setGroupOpen] = useState(false);

  const tryIncrease = () => {
    if (quantity >= maxQuantity) {
      setGroupOpen(true);
      return;
    }
    onQuantityChange(quantity + 1);
  };

  return (
    <>
      <aside
        className={
          sticky
            ? "fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#07111d]/95 p-4 backdrop-blur-xl md:static md:rounded-2xl md:border md:bg-[var(--glass)] md:p-5"
            : "glass-panel p-5"
        }
      >
        <div className="font-display text-2xl tracking-[0.08em] text-white">Your Booking</div>
        {selectedZone ? (
          <div className="mt-4 space-y-4">
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-white/45">Category</div>
              <div className="text-lg font-bold text-white">{selectedZone.categoryName}</div>
              <div className="text-sm text-white/60">{selectedZone.name}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-white/45">Price</div>
              <div className="font-display text-3xl text-[var(--brand)]">
                {formatCurrency(selectedZone.priceCents)}
                <span className="ml-2 text-sm text-white/50">/ ticket</span>
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs uppercase tracking-[0.14em] text-white/45">Quantity</div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/30"
                  aria-label="Decrease quantity"
                  onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-8 text-center text-xl font-bold" aria-live="polite">
                  {quantity}
                </span>
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/30"
                  aria-label="Increase quantity"
                  onClick={tryIncrease}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-sm text-white/60">Subtotal</span>
              <span className="text-lg font-bold text-white">
                {formatCurrency(selectedZone.priceCents * quantity)}
              </span>
            </div>
            <Button
              fullWidth
              onClick={onContinue}
              disabled={selectedZone.available < quantity}
            >
              {selectedZone.available < quantity ? "Not enough inventory" : "Continue to Checkout"}
            </Button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-white/60">Select a stadium section to continue.</p>
        )}
      </aside>

      <Modal open={groupOpen} onClose={() => setGroupOpen(false)} title="Planning for a group?">
        <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
          For more than {maxQuantity} tickets, our ticket support team can assist with group and bulk
          bookings.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button
            fullWidth
            onClick={() => {
              setGroupOpen(false);
              openWithContext({
                tag: "BULK_TICKET_REQUEST",
                subject: "Bulk ticket request",
                message:
                  "Customer is interested in purchasing more than 2 tickets.",
              });
            }}
          >
            Chat Now
          </Button>
          <Button fullWidth variant="secondary" onClick={() => setGroupOpen(false)}>
            Keep {maxQuantity} tickets
          </Button>
        </div>
      </Modal>
    </>
  );
}
