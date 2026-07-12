"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function AdminSupportPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [q, setQ] = useState("");

  const load = async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/support?${params}`);
    const data = await res.json();
    setConversations(data.conversations || []);
  };

  useEffect(() => {
    load();
    const id = window.setInterval(load, 5000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-white">Live Chat</h1>
      <div className="flex gap-3">
        <Input placeholder="Search name/email/tag" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button onClick={load}>Search</Button>
      </div>
      <div className="space-y-2">
        {conversations.map((c) => (
          <Link
            key={c.id}
            href={`/admin/support/${c.id}`}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0a1420] px-4 py-3 hover:border-white/25"
          >
            <div>
              <div className="font-semibold text-white">
                {c.guestName || "Guest"} {c.unreadAdmin ? `(${c.unreadAdmin})` : ""}
              </div>
              <div className="text-sm text-white/50">
                {c.guestEmail} · {c.subject} {c.tag ? `· ${c.tag}` : ""}
              </div>
            </div>
            <div className="text-xs text-white/40">{c.status}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
