"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, MessageCircle, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ChatMessage = { id: string; body: string; senderName: string; senderType: string; createdAt: string };
type PaymentLink = { id: string; label: string; createdAt: string };

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [body, setBody] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversation = useCallback(async (id: string, email: string) => {
    const response = await fetch(`/api/support/${id}?email=${encodeURIComponent(email)}`, { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setMessages(data.conversation.messages || []);
    setPaymentLinks(data.conversation.paymentLinks || []);
    setGuestName(data.conversation.guestName || "");
    setGuestEmail(data.conversation.guestEmail || email);
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const id = query.get("conversation");
    const storedEmail = sessionStorage.getItem("pitchpass_support_email") || "";
    if (id) {
      setConversationId(id);
      setGuestEmail(storedEmail);
      setOpen(true);
      void loadConversation(id, storedEmail);
    }
  }, [loadConversation]);

  useEffect(() => {
    if (!open || !conversationId || !guestEmail) return;
    const timer = window.setInterval(() => void loadConversation(conversationId, guestEmail), 5000);
    return () => window.clearInterval(timer);
  }, [open, conversationId, guestEmail, loadConversation]);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim() || (!conversationId && (!guestName.trim() || !guestEmail.trim()))) return;
    setLoading(true);
    setError("");
    try {
      const response = conversationId
        ? await fetch(`/api/support/${conversationId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-guest-email": guestEmail },
            body: JSON.stringify({ body: body.trim() }),
          })
        : await fetch("/api/support", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ body: body.trim(), guestName, guestEmail, subject: "PitchPass support" }),
          });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Message could not be sent");
      const id = conversationId || data.conversationId;
      setConversationId(id);
      setMessages((current) => [...current, data.message]);
      setBody("");
      sessionStorage.setItem("pitchpass_support_email", guestEmail);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Message could not be sent");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn("fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#09261c] text-white shadow-2xl transition hover:scale-105", open && "pointer-events-none opacity-0")} aria-label="Open PitchPass support">
        <MessageCircle className="h-6 w-6 text-[var(--brand)]" />
      </button>
      {open ? (
        <div className="fixed inset-x-3 bottom-3 z-50 flex h-[min(650px,88vh)] flex-col overflow-hidden rounded-[24px] border border-[#d8e5de] bg-white shadow-2xl sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[400px]">
          <div className="flex items-center justify-between bg-[#082018] px-5 py-4 text-white">
            <div><p className="font-display font-bold">PitchPass Support</p><p className="mt-0.5 text-[11px] text-white/50">Order and payment assistance</p></div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-white/10" aria-label="Close support"><X className="h-4 w-4" /></button>
          </div>
          {!conversationId ? <div className="grid gap-3 border-b border-[#e2ebe6] p-4"><label><span className="label">Your name</span><input className="input text-sm" value={guestName} onChange={(event) => setGuestName(event.target.value)} /></label><label><span className="label">Email address</span><input className="input text-sm" type="email" value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} /></label></div> : null}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {!messages.length ? <div className="py-12 text-center"><MessageCircle className="mx-auto h-8 w-8 text-[#95a9a0]" /><p className="mt-3 text-sm font-semibold">How can we help?</p><p className="mt-1 text-xs text-[#778c83]">Ask about a match, booking, payment, or delivery.</p></div> : messages.map((message) => (
              <div key={message.id} className={cn("max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm", message.senderType === "customer" ? "ml-auto bg-[#dff7ea] text-[#0f5f40]" : message.senderType === "system" ? "border border-[#dce8e2] bg-[#f5f8f6] text-[#526a60]" : "bg-[#0b2a1f] text-white")}>
                <p className="text-[9px] font-bold uppercase tracking-wider opacity-60">{message.senderName}</p><p className="mt-1 whitespace-pre-wrap leading-5">{message.body}</p><p className="mt-1.5 text-[9px] opacity-50">{new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
              </div>
            ))}
            {paymentLinks.map((link) => <a key={link.id} href={`/api/payment-links/${link.id}?email=${encodeURIComponent(guestEmail)}`} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl bg-[#35e89b] p-4 font-display text-sm font-bold text-[#062017]">{link.label}<ExternalLink className="h-4 w-4" /></a>)}
            <div ref={bottomRef} />
          </div>
          {error ? <p className="mx-4 mb-2 text-xs text-red-600">{error}</p> : null}
          <form onSubmit={sendMessage} className="flex gap-2 border-t border-[#e2ebe6] p-3">
            <input className="input flex-1 text-sm" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Type a message…" aria-label="Support message" />
            <button type="submit" disabled={loading || !body.trim()} className="grid h-11 w-11 place-items-center rounded-xl bg-[#09261c] text-[var(--brand)] disabled:opacity-50" aria-label="Send message"><Send className="h-4 w-4" /></button>
          </form>
        </div>
      ) : null}
    </>
  );
}
