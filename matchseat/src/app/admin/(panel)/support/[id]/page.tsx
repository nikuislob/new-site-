"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { AdminConversation, AdminConversationMessage } from "@/components/admin/types";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Textarea";
import { adminFetch } from "@/lib/admin-fetch";
import { cn } from "@/lib/utils";

const statusOptions = [
  { value: "OPEN", label: "Open" },
  { value: "PENDING", label: "Pending" },
  { value: "CLOSED", label: "Closed" },
];

export default function AdminSupportDetailPage() {
  const params = useParams<{ id: string }>();
  const [conversation, setConversation] = useState<AdminConversation | null>(null);
  const [messages, setMessages] = useState<AdminConversationMessage[]>([]);
  const [status, setStatus] = useState("OPEN");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await adminFetch<{ conversation: AdminConversation; messages: AdminConversationMessage[] }>(
        `/api/admin/support/${params.id}`
      );
      setConversation(data.conversation);
      setMessages(data.messages);
      setStatus(data.conversation.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load conversation.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function updateStatus(nextStatus = status) {
    setSaving(true);
    setError("");
    try {
      const data = await adminFetch<{ conversation: AdminConversation }>(`/api/admin/support/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setConversation(data.conversation);
      setMessages(data.conversation.messages);
      setStatus(data.conversation.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update conversation.");
    } finally {
      setSaving(false);
    }
  }

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reply.trim()) return;
    setSaving(true);
    setError("");
    try {
      const data = await adminFetch<{ conversation: AdminConversation; message: AdminConversationMessage }>(
        `/api/admin/support/${params.id}`,
        {
          method: "POST",
          body: JSON.stringify({ body: reply }),
        }
      );
      setConversation(data.conversation);
      setMessages(data.conversation.messages);
      setStatus(data.conversation.status);
      setReply("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send reply.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!conversation) {
    return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 font-bold text-rose-700">{error}</div>;
  }

  const customerName = conversation.user
    ? `${conversation.user.firstName} ${conversation.user.lastName}`
    : conversation.guestName || "Guest";

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#1f8a4c]">Support desk</p>
          <h1 className="mt-2 font-display text-5xl text-[#0a1628]">{customerName}</h1>
          <p className="mt-2 text-slate-500">{conversation.guestEmail || conversation.user?.email}</p>
        </div>
        <Link className="font-black text-[#1f8a4c] hover:underline" href="/admin/support">
          Back to support
        </Link>
      </div>

      {error ? <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div> : null}

      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto_auto]">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Conversation status</p>
          <div className="mt-2">
            <StatusBadge type="conversation" status={conversation.status} />
          </div>
        </div>
        <Select label="Set status" options={statusOptions} value={status} onChange={(event) => setStatus(event.target.value)} />
        <div className="flex items-end">
          <Button type="button" loading={saving} onClick={() => updateStatus()}>
            Save status
          </Button>
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-3xl text-[#0a1628]">Thread</h2>
        <div className="grid gap-3">
          {messages.map((message) => {
            const agent = message.senderType === "AGENT";
            return (
              <div key={message.id} className={cn("flex", agent ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-3xl rounded-3xl px-4 py-3",
                    agent ? "bg-[#0a1628] text-white" : "bg-slate-100 text-slate-900"
                  )}
                >
                  <div className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-wide opacity-70">
                    <span>{message.senderName || message.senderType}</span>
                    <span>{new Date(message.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                </div>
              </div>
            );
          })}
          {!messages.length ? <p className="rounded-2xl bg-slate-50 p-4 text-slate-500">No messages yet.</p> : null}
        </div>
      </section>

      <form onSubmit={sendReply} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <Textarea
          label="Reply"
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          placeholder="Write a clear, helpful reply. Never ask for passwords or full payment credentials."
          required
        />
        <div>
          <Button type="submit" loading={saving}>
            Send reply
          </Button>
        </div>
      </form>
    </div>
  );
}
