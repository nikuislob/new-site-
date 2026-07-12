"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

const QUICK = [
  "Thanks for contacting Arena Nights support — how can we help?",
  "We've received your payment details and will verify shortly.",
  "For bulk bookings over 2 tickets, please share your preferred section and quantity.",
];

export default function AdminSupportDetailPage() {
  const params = useParams<{ id: string }>();
  const [conversation, setConversation] = useState<any>(null);
  const [body, setBody] = useState("");

  const load = async () => {
    const res = await fetch(`/api/admin/support/${params.id}`);
    const data = await res.json();
    setConversation(data.conversation);
  };

  useEffect(() => {
    load();
    const id = window.setInterval(load, 4000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const send = async () => {
    if (!body.trim()) return;
    await fetch(`/api/admin/support/${params.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setBody("");
    load();
  };

  const setStatus = async (status: "OPEN" | "CLOSED") => {
    await fetch(`/api/admin/support/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  if (!conversation) return <div className="skeleton h-40 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl text-white">{conversation.guestName}</h1>
          <p className="text-sm text-white/50">
            {conversation.guestEmail} · {conversation.currentPage || "n/a"} · {conversation.tag || "general"}
            {conversation.order ? ` · Order ${conversation.order.orderNumber}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setStatus("CLOSED")}>Close</Button>
          <Button variant="secondary" onClick={() => setStatus("OPEN")}>Reopen</Button>
        </div>
      </div>

      <div className="max-h-[50vh] space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-[#0a1420] p-4">
        {conversation.messages?.map((m: any) => (
          <div
            key={m.id}
            className={`rounded-xl px-3 py-2 text-sm ${
              m.senderType === "admin" ? "bg-[var(--brand-soft)]" : "bg-white/5"
            }`}
          >
            <div className="text-[10px] uppercase tracking-[0.12em] text-white/45">{m.senderName}</div>
            {m.body}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 hover:bg-white/5"
            onClick={() => setBody(q)}
          >
            {q.slice(0, 42)}…
          </button>
        ))}
      </div>

      <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
      <Button onClick={send}>Send Reply</Button>
    </div>
  );
}
