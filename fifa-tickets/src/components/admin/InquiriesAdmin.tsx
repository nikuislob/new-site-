"use client";

import { useState } from "react";

type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  matchId: string | null;
  quantity: number | null;
  message: string;
  status: string;
  createdAt: string;
};

export function InquiriesAdmin({ initial }: { initial: Inquiry[] }) {
  const [items, setItems] = useState(initial);

  async function setStatus(id: string, status: string) {
    const res = await fetch("/api/admin/inquiries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = await res.json();
    if (res.ok) {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: data.inquiry.status } : i)));
    }
  }

  return (
    <div>
      <h1 className="font-display text-4xl tracking-[0.06em] text-[var(--pitch-deep)]">Bulk Inquiries</h1>
      <p className="text-sm text-[var(--ink-muted)]">Chat Now / contact form submissions for 3+ tickets</p>

      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {item.name} · {item.email}
                </p>
                <p className="text-xs text-[var(--ink-muted)]">
                  {new Date(item.createdAt).toLocaleString()}
                  {item.quantity ? ` · Qty ${item.quantity}` : ""}
                  {item.phone ? ` · ${item.phone}` : ""}
                </p>
              </div>
              <span className="badge bg-[var(--gold-soft)] text-[#6b5208]">{item.status}</span>
            </div>
            <p className="mt-3 text-sm whitespace-pre-wrap">{item.message}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn btn-outline !py-1.5 !px-3 text-xs" onClick={() => setStatus(item.id, "CONTACTED")}>
                Mark Contacted
              </button>
              <button type="button" className="btn btn-outline !py-1.5 !px-3 text-xs" onClick={() => setStatus(item.id, "CLOSED")}>
                Close
              </button>
              <button type="button" className="btn btn-outline !py-1.5 !px-3 text-xs" onClick={() => setStatus(item.id, "NEW")}>
                Reopen
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-[var(--ink-muted)]">No inquiries yet.</p>}
      </div>
    </div>
  );
}
