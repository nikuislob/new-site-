"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

const STORAGE_CONVERSATION = "voltora_support_conversation_id";
const STORAGE_GUEST_NAME = "voltora_support_guest_name";
const STORAGE_GUEST_EMAIL = "voltora_support_guest_email";
const INIT_MESSAGE = "\u200b";

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

function visibleMessages(messages: ChatMessage[]) {
  return messages.filter((m) => m.body !== INIT_MESSAGE);
}

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [body, setBody] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestInfoCollected, setGuestInfoCollected] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [user, setUser] = useState<{ firstName: string; lastName?: string; email: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedId = localStorage.getItem(STORAGE_CONVERSATION);
    const storedName = localStorage.getItem(STORAGE_GUEST_NAME);
    const storedEmail = localStorage.getItem(STORAGE_GUEST_EMAIL);
    if (storedId) setConversationId(storedId);
    if (storedName) {
      setGuestName(storedName);
      setGuestInfoCollected(true);
    }
    if (storedEmail) setGuestEmail(storedEmail);
  }, []);

  const guestEmailParam = user?.email || guestEmail.trim().toLowerCase();

  const loadConversation = useCallback(
    async (id: string) => {
      const params = new URLSearchParams();
      if (!user && guestEmailParam) params.set("email", guestEmailParam);
      const qs = params.toString();
      const res = await fetch(`/api/support/${id}${qs ? `?${qs}` : ""}`);
      if (!res.ok) return null;
      const data = await res.json();
      const conv = data.conversation as {
        messages: ChatMessage[];
        unreadCustomer?: number;
      };
      setMessages(conv.messages || []);
      if (!open) {
        setUnreadCount(conv.unreadCustomer ?? 0);
      } else {
        setUnreadCount(0);
      }
      return conv;
    },
    [guestEmailParam, open, user]
  );

  const ensureConversation = useCallback(async () => {
    if (conversationId) return conversationId;
    if (!user && (!guestName.trim() || !guestEmail.trim())) return null;

    setInitLoading(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: INIT_MESSAGE,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
          orderId: orderId || undefined,
          subject: "Store support",
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const id = data.conversationId as string;
      setConversationId(id);
      localStorage.setItem(STORAGE_CONVERSATION, id);
      if (data.message) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === data.message.id);
          return exists ? prev : [...prev, data.message];
        });
      }
      return id;
    } catch {
      return null;
    } finally {
      setInitLoading(false);
    }
  }, [conversationId, guestEmail, guestName, orderId, user]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    (async () => {
      let resolvedUser = user;
      try {
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const me = await meRes.json();
          if (me.user && !cancelled) {
            resolvedUser = me.user;
            setUser(me.user);
            setGuestName(`${me.user.firstName} ${me.user.lastName || ""}`.trim());
            setGuestEmail(me.user.email);
            setGuestInfoCollected(true);
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

      if (cancelled) return;

      if (conversationId) {
        await loadConversation(conversationId);
        return;
      }

      const canInit = resolvedUser || guestInfoCollected;
      if (!canInit) return;

      const listUrl = resolvedUser
        ? "/api/support"
        : guestEmail.trim()
          ? `/api/support?email=${encodeURIComponent(guestEmail.trim().toLowerCase())}`
          : null;

      if (listUrl) {
        const listRes = await fetch(listUrl);
        if (listRes.ok) {
          const listData = await listRes.json();
          const latest = listData.conversations?.[0];
          if (latest?.id) {
            setConversationId(latest.id);
            localStorage.setItem(STORAGE_CONVERSATION, latest.id);
            await loadConversation(latest.id);
            return;
          }
        }
      }

      await ensureConversation();
    })();

    return () => {
      cancelled = true;
    };
  }, [open, guestInfoCollected]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!conversationId || !open) return;

    const poll = async () => {
      await loadConversation(conversationId);
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [conversationId, loadConversation, open]);

  useEffect(() => {
    if (!conversationId || open) return;

    const pollUnread = async () => {
      const params = new URLSearchParams();
      if (!user && guestEmailParam) params.set("email", guestEmailParam);
      const qs = params.toString();
      const res = await fetch(`/api/support/${conversationId}${qs ? `?${qs}` : ""}`);
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.conversation?.unreadCustomer ?? 0);
    };

    pollUnread();
    const interval = setInterval(pollUnread, 10000);
    return () => clearInterval(interval);
  }, [conversationId, open, guestEmailParam, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const handleGuestContinue = async () => {
    if (!guestName.trim() || !guestEmail.trim()) return;
    localStorage.setItem(STORAGE_GUEST_NAME, guestName.trim());
    localStorage.setItem(STORAGE_GUEST_EMAIL, guestEmail.trim());
    setGuestInfoCollected(true);
    if (open && !conversationId) {
      await ensureConversation();
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    if (!user && !guestInfoCollected) return;

    setLoading(true);
    try {
      let activeId = conversationId;
      if (!activeId) {
        activeId = await ensureConversation();
      }

      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body.trim(),
          conversationId: activeId || undefined,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
          orderId: orderId || undefined,
          subject: "Store support",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setConversationId(data.conversationId);
      localStorage.setItem(STORAGE_CONVERSATION, data.conversationId);
      if (data.message) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === data.message.id);
          return exists ? prev : [...prev, data.message];
        });
      }
      setBody("");
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setUnreadCount(0);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const displayMessages = visibleMessages(messages);
  const canChat = user || guestInfoCollected;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[var(--bg)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(11,18,32,0.35)] transition hover:scale-105",
          open && "pointer-events-none opacity-0"
        )}
        aria-label="Open support chat"
      >
        <MessageCircle className="h-5 w-5 text-[var(--brand)]" />
        <span>Chat Now</span>
        {unreadCount > 0 ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand)] px-1.5 text-xs font-bold text-[#04241f]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed bottom-5 right-5 z-50 flex h-[min(560px,80vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-white shadow-2xl animate-fade-up">
          <div className="flex items-center justify-between bg-[var(--bg)] px-4 py-3 text-white">
            <div>
              <p className="font-display font-semibold">Voltora Support</p>
              <p className="text-xs text-[#9fb0cb]">US-based help · typically under 5 min</p>
            </div>
            <button type="button" onClick={handleClose} aria-label="Close chat" className="rounded-full p-1.5 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>

          {!user && !guestInfoCollected ? (
            <div className="grid gap-2 border-b border-[var(--line)] p-3">
              <Input label="Your name" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="text-sm" />
              <Input label="Email" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className="text-sm" />
              <Button type="button" onClick={handleGuestContinue} disabled={!guestName.trim() || !guestEmail.trim()} className="w-full text-sm">
                Continue
              </Button>
            </div>
          ) : !user && guestInfoCollected ? null : orders.length > 0 ? (
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
            {initLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="sm" />
              </div>
            ) : displayMessages.length === 0 ? (
              <p className="text-center text-sm text-[var(--ink-muted)]">
                Hi! Ask about orders, products, or delivery — we&apos;re here to help.
              </p>
            ) : (
              displayMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                    msg.senderType === "customer"
                      ? "ml-auto bg-[var(--brand-soft)] text-[#067260]"
                      : "bg-[var(--surface)] text-[var(--ink)]"
                  )}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                    {msg.senderName} · {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                  </p>
                  <p className="mt-0.5">{msg.body}</p>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {canChat ? (
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
          ) : null}
        </div>
      ) : null}
    </>
  );
}
