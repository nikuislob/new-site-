"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { useChat } from "@/components/providers/ChatProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

type Message = {
  id: string;
  senderType: string;
  senderName: string;
  body: string;
  createdAt: string;
};

export function SupportChat() {
  const { open, setOpen, prefill } = useChat();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tag, setTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prefill?.message) setBody(prefill.message);
    if (prefill?.tag) setTag(prefill.tag);
  }, [prefill]);

  useEffect(() => {
    if (!open || !conversationId || !email) return;
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/support/${conversationId}?email=${encodeURIComponent(email)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        setMessages(data.conversation?.messages || []);
      } catch {
        /* ignore poll errors */
      }
    };
    poll();
    const id = window.setInterval(poll, 4000);
    return () => window.clearInterval(id);
  }, [open, conversationId, email]);

  const send = async () => {
    setError(null);
    if (!body.trim()) return;
    if (!conversationId && (!name.trim() || !email.trim())) {
      setError("Name and email are required to start chat.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(conversationId ? `/api/support/${conversationId}` : "/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(email ? { "x-guest-email": email } : {}),
        },
        body: JSON.stringify({
          body,
          conversationId,
          guestName: name,
          guestEmail: email,
          subject: prefill?.subject || "Ticket support",
          tag,
          currentPage: typeof window !== "undefined" ? window.location.pathname : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to send");
      setConversationId(data.conversationId || data.conversation?.id);
      setMessages(data.conversation?.messages || []);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-3 font-bold text-[#04150e] shadow-[0_12px_40px_rgba(46,229,157,0.35)] transition hover:scale-[1.02] md:bottom-6 md:right-6"
        aria-label="Chat now"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="text-sm tracking-wide">CHAT NOW</span>
      </button>

      {open ? (
        <div className="fixed inset-x-3 bottom-20 z-50 mx-auto flex max-h-[75vh] w-auto max-w-md flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0a1422]/95 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:right-6 sm:bottom-24 sm:w-[380px]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <div className="font-display text-xl tracking-[0.08em] text-white">Live Support</div>
              <div className="text-xs text-white/50">Tickets · Payments · Bulk bookings</div>
            </div>
            <button
              type="button"
              className="rounded-full p-2 text-white/60 hover:bg-white/5"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <p className="text-sm text-white/55">
                Ask about tickets, payment verification, or group bookings. Never share card numbers
                or passwords here.
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-2xl px-3 py-2 text-sm ${
                    m.senderType === "customer"
                      ? "ml-8 bg-[var(--brand-soft)] text-white"
                      : "mr-8 bg-white/8 text-white/90"
                  }`}
                >
                  <div className="mb-1 text-[10px] uppercase tracking-[0.12em] text-white/45">
                    {m.senderName}
                  </div>
                  {m.body}
                </div>
              ))
            )}
          </div>

          <div className="space-y-2 border-t border-white/10 p-4">
            {!conversationId ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-label="Your name"
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Email"
                />
              </div>
            ) : null}
            <Textarea
              rows={3}
              placeholder="Type your message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              aria-label="Message"
            />
            {error ? <p className="text-xs text-[var(--danger)]">{error}</p> : null}
            <Button fullWidth loading={loading} onClick={send}>
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
