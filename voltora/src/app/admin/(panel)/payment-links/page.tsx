"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";

export default function AdminPaymentLinksPage() {
  const [links, setLinks] = useState<any[]>([]);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin/payment-links");
    const data = await res.json();
    setLinks(data.links || []);
    const map: Record<string, string> = {};
    for (const link of data.links || []) map[link.id] = link.paymentUrl;
    setEditing(map);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (link: any) => {
    setMessage(null);
    const res = await fetch(`/api/admin/payment-links/${link.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentUrl: editing[link.id] }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Failed");
      return;
    }
    setMessage("Payment link updated");
    load();
  };

  const toggle = async (link: any) => {
    await fetch(`/api/admin/payment-links/${link.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !link.isActive }),
    });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-white">Payment Links</h1>
        <p className="text-sm text-white/50">
          Map every category + quantity + method combination to an external HTTPS destination.
        </p>
      </div>
      {message ? <p className="text-sm text-[var(--brand)]">{message}</p> : null}

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-white/50">
            <tr>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">Qty</th>
              <th className="px-3 py-3">Method</th>
              <th className="px-3 py-3">Amount</th>
              <th className="px-3 py-3">Link</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {links.map((link) => (
              <tr key={link.id} className="border-t border-white/5 align-top">
                <td className="px-3 py-3">{link.ticketCategory?.name}</td>
                <td className="px-3 py-3">{link.quantity}</td>
                <td className="px-3 py-3">{link.paymentMethod?.name}</td>
                <td className="px-3 py-3">{formatCurrency(link.expectedAmountCents)}</td>
                <td className="px-3 py-3 min-w-[280px]">
                  <Input
                    value={editing[link.id] || ""}
                    onChange={(e) => setEditing((m) => ({ ...m, [link.id]: e.target.value }))}
                  />
                </td>
                <td className="px-3 py-3">{link.isActive ? "ACTIVE" : "INACTIVE"}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-2">
                    <Button onClick={() => save(link)}>Save</Button>
                    <Button variant="secondary" onClick={() => toggle(link)}>
                      {link.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <a
                      href={editing[link.id] || link.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost !py-2 text-center"
                    >
                      Test link
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
