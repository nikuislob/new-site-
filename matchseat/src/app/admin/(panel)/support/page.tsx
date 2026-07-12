"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { AdminConversation } from "@/components/admin/types";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { adminFetch } from "@/lib/admin-fetch";

const statusOptions = [
  { value: "OPEN", label: "Open" },
  { value: "PENDING", label: "Pending" },
  { value: "CLOSED", label: "Closed" },
];

const columns: DataTableColumn<AdminConversation>[] = [
  {
    key: "guestName",
    header: "Conversation",
    cell: (conversation) => {
      const customerName = conversation.user
        ? `${conversation.user.firstName} ${conversation.user.lastName}`
        : conversation.guestName || "Guest";
      const lastMessage = conversation.messages[0]?.body;
      return (
        <div>
          <Link className="font-black text-[#0a1628] hover:text-[#1f8a4c]" href={`/admin/support/${conversation.id}`}>
            {customerName}
          </Link>
          <p className="text-xs text-slate-500">{conversation.guestEmail || conversation.user?.email}</p>
          {lastMessage ? <p className="mt-1 line-clamp-1 text-sm text-slate-600">{lastMessage}</p> : null}
        </div>
      );
    },
  },
  { key: "status", header: "Status", cell: (conversation) => <StatusBadge type="conversation" status={conversation.status} /> },
  {
    key: "assignedTo",
    header: "Assigned",
    cell: (conversation) => conversation.assignedTo?.name || "Unassigned",
  },
  {
    key: "lastMessageAt",
    header: "Last message",
    cell: (conversation) => new Date(conversation.lastMessageAt).toLocaleString(),
  },
  {
    key: "id",
    header: "",
    cell: (conversation) => (
      <Link className="font-black text-[#1f8a4c] hover:underline" href={`/admin/support/${conversation.id}`}>
        Open
      </Link>
    ),
  },
];

export default function AdminSupportPage() {
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    adminFetch<{ conversations: AdminConversation[] }>(`/api/admin/support${status ? `?status=${status}` : ""}`)
      .then((data) => {
        if (mounted) setConversations(data.conversations);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to load support conversations.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [status]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#1f8a4c]">Support desk</p>
          <h1 className="mt-2 font-display text-5xl text-[#0a1628]">Support Chat</h1>
        </div>
        <div className="w-full sm:w-56">
          <Select label="Status" placeholder="All conversations" options={statusOptions} value={status} onChange={(e) => setStatus(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="grid min-h-[45vh] place-items-center rounded-3xl bg-white">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 font-bold text-rose-700">{error}</div>
      ) : (
        <DataTable columns={columns} rows={conversations} rowKey={(conversation) => conversation.id} emptyState="No conversations found." />
      )}
    </div>
  );
}
