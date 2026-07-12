"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, ExternalLink, Send } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { StatusBadge } from "@/components/admin/StatusBadge";

type Message = {
  id: string;
  body: string;
  senderType: string;
  senderName: string | null;
  createdAt: string;
};

type Conversation = {
  id: string;
  subject: string | null;
  status: string;
  guestName: string | null;
  guestEmail: string | null;
  assignedToId: string | null;
  messages: Message[];
  user?: { email: string; firstName?: string; lastName?: string } | null;
  assignedTo?: { id: string; name: string } | null;
  order?: { id: string; orderNumber: string } | null;
  booking?: {
    id: string;
    reference: string;
    total: number;
    currency: string;
    paymentMethod: string | null;
    match: { homeTeam: string; awayTeam: string };
    items: { category: string; section: string; quantity: number }[];
  } | null;
  paymentLinks: { id: string; url: string; label: string; clickedAt: string | null; createdAt: string; sentBy: { name: string } }[];
};

type Admin = { id: string; name: string; email: string };

export default function SupportDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [linkSending, setLinkSending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchConversation() {
      try {
        const data = await adminFetch<{ conversation: Conversation }>(`/api/admin/support/${id}`);
        if (!cancelled) setConversation(data.conversation);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load conversation");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchConversation();
    adminFetch<{ admins: Admin[] }>("/api/admin/admins")
      .then((d) => { if (!cancelled) setAdmins(d.admins); })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [id]);

  async function reload() {
    const data = await adminFetch<{ conversation: Conversation }>(`/api/admin/support/${id}`);
    setConversation(data.conversation);
  }

  async function handleReply(e: FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    setError("");
    try {
      await adminFetch(`/api/admin/support/${id}`, {
        method: "POST",
        body: JSON.stringify({ body: reply.trim() }),
      });
      setReply("");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  async function updateConversation(patch: { status?: string; assignedToId?: string | null }) {
    setError("");
    try {
      const data = await adminFetch<{ conversation: Conversation }>(`/api/admin/support/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setConversation(data.conversation);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function sendPaymentLink(e: FormEvent) {
    e.preventDefault();
    if (!paymentUrl.trim()) return;
    setLinkSending(true);
    setError("");
    try {
      await adminFetch(`/api/admin/support/${id}/payment-link`, {
        method: "POST",
        body: JSON.stringify({ url: paymentUrl.trim(), label: "Complete Payment" }),
      });
      setPaymentUrl("");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment link could not be sent");
    } finally {
      setLinkSending(false);
    }
  }

  if (loading) return <p className="text-[#8b9cb8]">Loading conversation…</p>;
  if (error && !conversation) return <div className="text-red-300" role="alert">{error}</div>;
  if (!conversation) return null;

  const customerName = conversation.user
    ? [conversation.user.firstName, conversation.user.lastName].filter(Boolean).join(" ") || conversation.user.email
    : conversation.guestName || conversation.guestEmail || "Guest";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/support" className="mb-3 inline-flex items-center gap-1 text-sm text-[#8b9cb8] hover:text-[#00c2a8]">
          <ArrowLeft className="h-4 w-4" /> Back to inbox
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-white">{conversation.subject || "No subject"}</h1>
          <StatusBadge status={conversation.status} variant="conversation" />
        </div>
        <p className="mt-1 text-sm text-[#8b9cb8]">From {customerName}</p>
        {conversation.order ? (
          <p className="text-sm text-[#8b9cb8]">
            Related order:{" "}
            <Link href={`/admin/orders/${conversation.order.id}`} className="text-[#00c2a8] hover:underline">
              {conversation.order.orderNumber}
            </Link>
          </p>
        ) : null}
        {conversation.booking ? (
          <div className="mt-3 rounded-xl border border-[#294139] bg-[#0f251d] p-4 text-sm">
            <p className="font-mono text-xs text-[#35e89b]">{conversation.booking.reference}</p>
            <p className="mt-2 font-semibold">{conversation.booking.match.homeTeam} vs {conversation.booking.match.awayTeam}</p>
            <p className="mt-1 text-xs text-[#8b9cb8]">{conversation.booking.items[0]?.quantity} × {conversation.booking.items[0]?.category} · {conversation.booking.items[0]?.section} · {conversation.booking.currency} {conversation.booking.total.toFixed(2)} · {conversation.booking.paymentMethod?.replaceAll("_", " ")}</p>
            <Link href={`/admin/bookings/${conversation.booking.id}`} className="mt-2 inline-block text-xs font-semibold text-[#35e89b]">Open order</Link>
          </div>
        ) : null}
      </div>

      {conversation.booking ? (
        <form onSubmit={sendPaymentLink} className="rounded-xl border border-[#294139] bg-[#0f251d] p-5">
          <label htmlFor="payment-url" className="text-sm font-semibold">Send approved external payment link</label>
          <p className="mt-1 text-xs text-[#8b9cb8]">HTTPS URL must match the configured domain allowlist. Sending and clicking are audit logged and never mark the order paid.</p>
          <div className="mt-3 flex gap-2">
            <input id="payment-url" type="url" required value={paymentUrl} onChange={(e) => setPaymentUrl(e.target.value)} placeholder="https://approved-provider.example/…" className="min-w-0 flex-1 rounded-lg border border-[#294139] bg-[#071b13] px-3 py-2 text-sm" />
            <button disabled={linkSending} className="inline-flex items-center gap-2 rounded-lg bg-[#35e89b] px-4 py-2 text-sm font-bold text-[#062017]"><ExternalLink className="h-4 w-4" /> Send link</button>
          </div>
          {conversation.paymentLinks.length ? <div className="mt-4 space-y-2">{conversation.paymentLinks.map((link) => <div key={link.id} className="flex justify-between rounded-lg bg-[#071b13] p-3 text-xs"><span>{link.label} · sent by {link.sentBy.name}</span><span className={link.clickedAt ? "text-amber-300" : "text-[#7f958c]"}>{link.clickedAt ? "Opened — awaiting verification" : "Not opened"}</span></div>)}</div> : null}
        </form>
      ) : null}

      {error ? <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">{error}</div> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => updateConversation({ status: conversation.status === "OPEN" ? "CLOSED" : "OPEN" })}
          className="rounded-lg border border-[#1e2d45] bg-[#121a2b] px-4 py-2 text-sm text-[#c5d0e0] hover:border-[#00c2a8]/40"
        >
          {conversation.status === "OPEN" ? "Close conversation" : "Reopen conversation"}
        </button>
        {admins.length > 0 ? (
          <select
            value={conversation.assignedToId || ""}
            onChange={(e) => updateConversation({ assignedToId: e.target.value || null })}
            className="rounded-lg border border-[#1e2d45] bg-[#121a2b] px-3 py-2 text-sm text-white"
            aria-label="Assign to admin"
          >
            <option value="">Unassigned</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="space-y-4 rounded-xl border border-[#1e2d45] bg-[#121a2b] p-5">
        {conversation.messages.map((msg) => {
          const isAdmin = msg.senderType === "admin";
          return (
            <div
              key={msg.id}
              className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                  isAdmin
                    ? "bg-[#00c2a8]/15 text-[#e8edf5]"
                    : "bg-[#0b1220] text-[#c5d0e0]"
                }`}
              >
                <p className="mb-1 text-xs font-medium text-[#8b9cb8]">
                  {msg.senderName || (isAdmin ? "Admin" : customerName)} · {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                </p>
                <p className="whitespace-pre-wrap">{msg.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      {conversation.status === "OPEN" ? (
        <form onSubmit={handleReply} className="rounded-xl border border-[#1e2d45] bg-[#121a2b] p-5">
          <label htmlFor="reply" className="mb-2 block text-sm font-medium text-[#c5d0e0]">Reply</label>
          <textarea
            id="reply"
            rows={4}
            required
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            className="w-full rounded-lg border border-[#1e2d45] bg-[#0b1220] px-3 py-2 text-sm text-white focus:border-[#00c2a8] focus:outline-none"
            placeholder="Type your reply…"
          />
          <button
            type="submit"
            disabled={sending || !reply.trim()}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#00c2a8] px-4 py-2.5 text-sm font-semibold text-[#0b1220] hover:bg-[#00d4b8] disabled:opacity-60"
          >
            <Send className="h-4 w-4" /> {sending ? "Sending…" : "Send reply"}
          </button>
        </form>
      ) : (
        <p className="text-sm text-[#8b9cb8]">This conversation is closed. Reopen to reply.</p>
      )}
    </div>
  );
}
