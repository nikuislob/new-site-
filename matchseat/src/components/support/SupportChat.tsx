"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  body: string;
  senderName: string | null;
  senderType: string;
  createdAt: string;
}

const STORAGE_KEY = "pitchpass_support_chat";

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ firstName: string; lastName?: string; email: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          conversationId?: string;
          guestName?: string;
          guestEmail?: string;
        };
        if (saved.conversationId) setConversationId(saved.conversationId);
        if (saved.guestName) setGuestName(saved.guestName);
        if (saved.guestEmail) setGuestEmail(saved.guestEmail);
      }
    } catch {
      /* ignore */
    }
  }, []);

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
          }
        }
      } catch {
        /* guest */
      }
    })();
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (!open || !conversationId) return;

    const load = async () => {
      try {
        const qs = new URLSearchParams({ conversationId });
        if (guestEmail) qs.set("guestEmail", guestEmail);
        const res = await fetch(`/api/support?${qs.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.conversation?.messages) setMessages(data.conversation.messages);
      } catch {
        /* ignore poll errors */
      }
    };

    load();
    const timer = window.setInterval(load, 4000);
    return () => window.clearInterval(timer);
  }, [open, conversationId, guestEmail]);

  const persist = (nextId: string, name: string, email: string) => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ conversationId: nextId, guestName: name, guestEmail: email })
      );
    } catch {
      /* ignore */
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    if (!user && (!guestName.trim() || !guestEmail.trim())) {
      setError("Enter your name and email to chat.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body.trim(),
          conversationId: conversationId || undefined,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      const nextId = data.conversation?.id || data.conversationId;
      if (nextId) {
        setConversationId(nextId);
        persist(nextId, guestName.trim(), guestEmail.trim().toLowerCase());
      }
      setMessages(data.conversation?.messages || data.messages || []);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
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
          "fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[var(--bg)] px-4 py-3 text-white shadow-[0_16px_40px_rgba(7,20,15,0.35)] transition hover:scale-[1.03]",
          open && "pointer-events-none opacity-0"
        )}
        aria-label="Chat now"
      >
        <MessageCircle className="h-5 w-5 text-[var(--accent)]" />
        <span className="text-sm font-bold">Chat Now</span>
      </button>

      {open ? (
        <div className="fixed bottom-5 right-5 z-50 flex h-[min(560px,80vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-white shadow-2xl animate-fade-up">
          <div className="flex items-center justify-between bg-[var(--bg)] px-4 py-3 text-white">
            <div>
              <p className="font-display text-xl font-bold tracking-wide">Chat Now</p>
              <p className="text-xs text-[#9fb8aa]">PitchPass support · US fans</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-full p-1.5 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>

          {!user ? (
            <div className="grid gap-2 border-b border-[var(--line)] p-3">
              <Input label="Your name" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
              <Input label="Email" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
            </div>
          ) : null}

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <p className="text-center text-sm text-[var(--ink-muted)]">
                Ask about matches, seating, or your order — we&apos;re here to help.
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                    msg.senderType === "CUSTOMER" || msg.senderType === "GUEST"
                      ? "ml-auto bg-[var(--brand-soft)] text-[var(--ink)]"
                      : "bg-[var(--bg-elevated)] text-white"
                  )}
                >
                  <p className="mb-1 text-[10px] font-semibold uppercase opacity-70">
                    {msg.senderName || msg.senderType}
                  </p>
                  <p>{msg.body}</p>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={sendMessage} className="border-t border-[var(--line)] p-3">
            {error ? <p className="mb-2 text-xs text-[var(--danger)]">{error}</p> : null}
            <div className="flex gap-2">
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 rounded-full border border-[var(--line)] px-4 py-2 text-sm outline-none focus:border-[var(--brand)]"
              />
              <Button type="submit" loading={loading} aria-label="Send">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
