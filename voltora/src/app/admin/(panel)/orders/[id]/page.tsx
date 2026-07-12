"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { formatCurrency } from "@/lib/utils";

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch(`/api/admin/orders/${params.id}`);
    const data = await res.json();
    setOrder(data.order);
    setNotes(data.order?.adminNotes || "");
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const run = async (payload: Record<string, unknown>) => {
    setMessage(null);
    const res = await fetch(`/api/admin/orders/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, adminNotes: notes }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Failed");
      return;
    }
    setOrder(data.order);
    setConfirmAction(null);
    setMessage("Updated");
  };

  if (!order) return <div className="skeleton h-40 w-full" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-white">{order.orderNumber}</h1>
        <p className="text-sm text-white/50">
          {order.status} · Payment {order.paymentStatus} · Tickets {order.ticketStatus}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#0a1420] p-4 text-sm">
          <div>Customer: {order.customerName}</div>
          <div>Email: {order.customerEmail}</div>
          <div>Phone: {order.customerPhone || "—"}</div>
          <div>Access code: {order.accessCode}</div>
          <div>Method: {order.paymentMethodName}</div>
          <div>Amount: {formatCurrency(order.totalCents)}</div>
          <div>Category: {order.items?.[0]?.categoryName}</div>
          <div>Qty: {order.quantity}</div>
          {order.paymentUrlUsed ? (
            <div className="mt-2 break-all text-white/50">Payment URL used: {order.paymentUrlUsed}</div>
          ) : null}
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0a1420] p-4">
          <Textarea label="Internal notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => setConfirmAction("verify")}>Verify Payment</Button>
            <Button variant="secondary" onClick={() => setConfirmAction("cancel")}>Cancel Order</Button>
            <Button variant="secondary" onClick={() => setConfirmAction("revoke")}>Revoke Tickets</Button>
            <Button variant="secondary" onClick={() => setConfirmAction("reissue")}>Reissue Tickets</Button>
            <Button variant="ghost" onClick={() => run({})}>Save Notes</Button>
          </div>
          {message ? <p className="mt-3 text-sm text-white/70">{message}</p> : null}
        </div>
      </div>

      {confirmAction ? (
        <div className="rounded-2xl border border-[var(--danger)]/40 bg-[rgba(255,92,108,0.08)] p-4">
          <p className="text-sm text-white/80">
            Confirm dangerous action: <strong>{confirmAction}</strong>?
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              onClick={() =>
                run(
                  confirmAction === "verify"
                    ? { verifyPayment: true }
                    : confirmAction === "cancel"
                      ? { cancelOrder: true }
                      : confirmAction === "revoke"
                        ? { revokeTickets: true }
                        : { reissueTickets: true }
                )
              }
            >
              Confirm
            </Button>
            <Button variant="secondary" onClick={() => setConfirmAction(null)}>
              Back
            </Button>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-[#0a1420] p-4">
        <h2 className="font-semibold">Audit trail</h2>
        <ul className="mt-3 space-y-2 text-sm text-white/65">
          {order.statusLogs?.map((log: any) => (
            <li key={log.id}>
              {new Date(log.createdAt).toLocaleString()} — {log.previousStatus || "∅"} → {log.newStatus}
              {log.actor ? ` by ${log.actor.name}` : ""} {log.note ? `(${log.note})` : ""}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
