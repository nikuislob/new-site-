"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  body: string;
  senderName: string;
  senderType: string;
  createdAt: string;
}

interface UserOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
}

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [user, setUser] = useState<{ firstName: string; email: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const me = await meRes.json();
          if (me.user) {
            setUser(me.user);
            setGuestName(`${me.user.firstName} ${me.user.lastName || ""}`.trim());
            setGuestEmail(me.user.email);
            const ordersRes = await fetch("/api/orders?mine=1");
            if (ordersRes.ok) {
              const data = await ordersRes.json();
              setOrders(data.orders || []);
            }
          }
        }
      } catch {
        /* guest mode */
      }
    })();
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    if (!user && (!guestName.trim() || !guestEmail.trim())) return;

    setLoading(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body.trim(),
          conversationId: conversationId || undefined,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
          orderId: orderId || undefined,
          subject: "Store support",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setConversationId(data.conversationId);
      setMessages(data.messages || []);
      setBody("");
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg)] text-white shadow-[0_16px_40px_rgba(11,18,32,0.35)] transition hover:scale-105",
          open && "pointer-events-none opacity-0"
        )}
        aria-label="Open support chat"
      >
        <MessageCircle className="h-6 w-6 text-[var(--brand)]" />
      </button>

      {open ? (
        <div className="fixed bottom-5 right-5 z-50 flex h-[min(560px,80vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-white shadow-2xl animate-fade-up">
          <div className="flex items-center justify-between bg-[var(--bg)] px-4 py-3 text-white">
            <div>
              <p className="font-display font-semibold">Voltora Support</p>
              <p className="text-xs text-[#9fb0cb]">US-based help · typically under 5 min</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-full p-1.5 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>

          {!user ? (
            <div className="grid gap-2 border-b border-[var(--line)] p-3">
              <Input label="Your name" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="text-sm" />
              <Input label="Email" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className="text-sm" />
            </div>
          ) : orders.length > 0 ? (
            <div className="border-b border-[var(--line)] p-3">
              <Select
                label="Related order (optional)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                options={orders.map((o) => ({
                  value: o.id,
                  label: `${o.orderNumber} · ${o.status}`,
                }))}
                placeholder="Select an order"
              />
            </div>
          ) : null}

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <p className="text-center text-sm text-[var(--ink-muted)]">
                Hi! Ask about orders, products, or delivery — we&apos;re here to help.
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                    msg.senderType === "customer"
                      ? "ml-auto bg-[var(--brand-soft)] text-[#067260]"
                      : "bg-[var(--surface)] text-[var(--ink)]"
                  )}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{msg.senderName}</p>
                  <p className="mt-0.5">{msg.body}</p>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 border-t border-[var(--line)] p-3">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message..."
              className="input flex-1 text-sm"
              aria-label="Message"
            />
            <Button type="submit" disabled={loading || !body.trim()} className="px-3">
              {loading ? <Spinner size="sm" className="border-[#04241f]" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      ) : null}
    </>
  );
}
