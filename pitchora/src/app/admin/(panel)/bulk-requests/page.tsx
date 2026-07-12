"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Spinner } from "@/components/ui/Spinner";
import { Notify } from "@/components/ui/PageHeader";

type Bulk = {
  id: string;
  name: string;
  email: string;
  phone: string;
  quantity: number;
  message: string | null;
  status: string;
  adminReply: string | null;
  matchLabel: string | null;
  createdAt: string;
};

export default function AdminBulkRequestsPage() {
  const [requests, setRequests] = useState<Bulk[]>([]);
  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/bulk-requests");
    const data = await res.json();
    setRequests(data.requests || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function update(id: string, payload: { status?: string; adminReply?: string }) {
    const res = await fetch(`/api/admin/bulk-requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setMessage("Updated");
      load();
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this request?")) return;
    await fetch(`/api/admin/bulk-requests/${id}`, { method: "DELETE" });
    load();
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="font-display text-5xl">Bulk Requests</h1>
        <p className="text-[var(--ink-muted)]">Customers requesting 3+ tickets.</p>
      </div>
      {message ? <Notify tone="success">{message}</Notify> : null}
      <div className="space-y-4">
        {requests.map((r) => (
          <div key={r.id} className="glass space-y-3 rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {r.name} · {r.quantity} tickets
                </p>
                <p className="text-sm text-[var(--ink-muted)]">
                  {r.email} · {r.phone} · {r.matchLabel || "No match selected"}
                </p>
                <p className="mt-2 text-sm">{r.message}</p>
                <p className="mt-1 text-xs text-[var(--gold)]">Status: {r.status}</p>
                {r.adminReply ? <p className="mt-2 text-sm text-[var(--emerald)]">Reply: {r.adminReply}</p> : null}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => update(r.id, { status: "COMPLETED" })}>
                  Mark Completed
                </Button>
                <Button size="sm" variant="danger" onClick={() => remove(r.id)}>
                  Delete
                </Button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <Textarea
                id={`reply-${r.id}`}
                label="Reply"
                value={replies[r.id] ?? r.adminReply ?? ""}
                onChange={(e) => setReplies({ ...replies, [r.id]: e.target.value })}
              />
              <div className="flex items-end">
                <Button
                  variant="gold"
                  onClick={() => update(r.id, { adminReply: replies[r.id] ?? "", status: "REPLIED" })}
                >
                  Send Reply
                </Button>
              </div>
            </div>
          </div>
        ))}
        {requests.length === 0 ? <p className="text-[var(--ink-muted)]">No bulk requests yet.</p> : null}
      </div>
    </div>
  );
}
