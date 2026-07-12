"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [q, setQ] = useState("");

  const load = async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/tickets?${params}`);
    const data = await res.json();
    setTickets(data.tickets || []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-white">Tickets</h1>
      <div className="flex gap-3">
        <Input placeholder="Search ticket / holder / order" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button onClick={load}>Search</Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-white/50">
            <tr>
              <th className="px-3 py-3">Ticket</th>
              <th className="px-3 py-3">Order</th>
              <th className="px-3 py-3">Holder</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Checked in</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} className="border-t border-white/5">
                <td className="px-3 py-3 font-mono">{t.ticketNumber}</td>
                <td className="px-3 py-3">{t.order?.orderNumber}</td>
                <td className="px-3 py-3">{t.holderName}</td>
                <td className="px-3 py-3">{t.categoryName}</td>
                <td className="px-3 py-3">{t.status}</td>
                <td className="px-3 py-3">{t.checkedInAt ? new Date(t.checkedInAt).toLocaleString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
