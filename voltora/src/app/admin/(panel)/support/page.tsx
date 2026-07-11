"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";

type Conversation = {
  id: string;
  subject: string | null;
  status: string;
  guestName: string | null;
  guestEmail: string | null;
  lastMessageAt: string;
  unreadAdmin: number;
  user?: { email: string; firstName?: string; lastName?: string } | null;
  assignedTo?: { name: string } | null;
  order?: { orderNumber: string } | null;
};

export default function SupportPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (status) params.set("status", status);
      const data = await adminFetch<{ conversations: Conversation[] }>(`/api/admin/support?${params}`);
      setConversations(data.conversations);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Support inbox</h1>
        <p className="mt-1 text-sm text-[#8b9cb8]">Customer conversations and tickets</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <form className="flex flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); setSearch(q); }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7d9a]" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, subject…"
              className="w-full rounded-lg border border-[#1e2d45] bg-[#121a2b] py-2.5 pl-10 pr-3 text-sm text-white focus:border-[#00c2a8] focus:outline-none"
            />
          </div>
          <button type="submit" className="rounded-lg border border-[#1e2d45] bg-[#182338] px-4 py-2 text-sm text-white">Search</button>
        </form>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-[#1e2d45] bg-[#121a2b] px-3 py-2 text-sm text-white">
          <option value="">All</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {error ? <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">{error}</div> : null}

      <DataTable
        loading={loading}
        data={conversations}
        keyExtractor={(c) => c.id}
        columns={[
          {
            key: "subject",
            header: "Subject",
            cell: (c) => (
              <Link href={`/admin/support/${c.id}`} className="font-medium text-[#00c2a8] hover:underline">
                {c.subject || "No subject"}
                {c.unreadAdmin > 0 ? (
                  <span className="ml-2 rounded-full bg-[#00c2a8] px-1.5 py-0.5 text-xs text-[#0b1220]">{c.unreadAdmin}</span>
                ) : null}
              </Link>
            ),
          },
          {
            key: "from",
            header: "From",
            cell: (c) => {
              if (c.user) {
                const name = [c.user.firstName, c.user.lastName].filter(Boolean).join(" ");
                return name || c.user.email;
              }
              return c.guestName || c.guestEmail || "—";
            },
          },
          { key: "status", header: "Status", cell: (c) => <StatusBadge status={c.status} variant="conversation" /> },
          { key: "assigned", header: "Assigned", cell: (c) => c.assignedTo?.name || "—" },
          { key: "order", header: "Order", cell: (c) => c.order?.orderNumber || "—" },
          { key: "updated", header: "Updated", cell: (c) => format(new Date(c.lastMessageAt), "MMM d, h:mm a") },
        ]}
      />
    </div>
  );
}
