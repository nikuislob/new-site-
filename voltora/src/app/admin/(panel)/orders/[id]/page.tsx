"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, AlertTriangle, CreditCard } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { formatCurrency } from "@/lib/utils";
import { containsSensitiveContent } from "@/lib/support";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdmin } from "@/app/admin/(panel)/layout";
import { adminCanAssistPayment } from "@/lib/admin-permissions";

type OrderItem = {
  id: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingLine1: string;
  shippingLine2?: string | null;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paymentMethodName?: string | null;
  trackingNumber: string | null;
  shippingCarrier: string | null;
  adminNotes: string | null;
  createdAt: string;
  items: OrderItem[];
  paymentMethod?: { name: string } | null;
};

const ORDER_STATUSES = [
  "ORDER_CREATED", "PAYMENT_PENDING", "PAYMENT_CONFIRMED", "PROCESSING",
  "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED",
];

const PAYMENT_METHOD_OPTIONS = [
  "Card POS",
  "Virtual Terminal",
  "MOTO",
  "Apple Pay",
  "Google Pay",
  "Other",
] as const;

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { admin } = useAdmin();
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingCarrier, setShippingCarrier] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [paymentMethodLabel, setPaymentMethodLabel] = useState<string>(PAYMENT_METHOD_OPTIONS[0]);
  const [confirmationNote, setConfirmationNote] = useState("");
  const [assistError, setAssistError] = useState("");
  const [assistSuccess, setAssistSuccess] = useState("");
  const [assisting, setAssisting] = useState(false);

  const canAssistPayment = adminCanAssistPayment(admin.role);

  useEffect(() => {
    async function load() {
      try {
        const data = await adminFetch<{ order: Order }>(`/api/admin/orders/${id}`);
        setOrder(data.order);
        setStatus(data.order.status);
        setPaymentStatus(data.order.paymentStatus);
        setTrackingNumber(data.order.trackingNumber || "");
        setShippingCarrier(data.order.shippingCarrier || "");
        setAdminNotes(data.order.adminNotes || "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load order");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const data = await adminFetch<{ order: Order }>(`/api/admin/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          paymentStatus,
          trackingNumber: trackingNumber || null,
          shippingCarrier: shippingCarrier || null,
          adminNotes: adminNotes || null,
        }),
      });
      setOrder(data.order);
      setSuccess("Order updated successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function confirmPayment() {
    if (!confirm("Manually confirm this payment? This action should only be taken after verifying payment was received.")) return;
    setSaving(true);
    setError("");
    try {
      const data = await adminFetch<{ order: Order }>(`/api/admin/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus: "CONFIRMED" }),
      });
      setOrder(data.order);
      setPaymentStatus(data.order.paymentStatus);
      setStatus(data.order.status);
      setSuccess("Payment manually confirmed.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Confirmation failed");
    } finally {
      setSaving(false);
    }
  }

  function looksLikeCardNumber(value: string): boolean {
    return containsSensitiveContent(value);
  }

  async function handleAssistPayment(e: FormEvent) {
    e.preventDefault();
    setAssistError("");
    setAssistSuccess("");

    const ref = transactionReference.trim();
    if (!ref) {
      setAssistError("Transaction reference is required.");
      return;
    }

    const combined = `${ref} ${confirmationNote}`;
    if (looksLikeCardNumber(combined)) {
      setAssistError("Do not enter card numbers, CVV codes, or OTPs. Use only the POS/terminal reference.");
      return;
    }

    setAssisting(true);
    try {
      const data = await adminFetch<{ order: Order }>(`/api/admin/orders/${id}/assist-payment`, {
        method: "POST",
        body: JSON.stringify({
          transactionReference: ref,
          paymentMethodLabel,
          confirmationNote: confirmationNote.trim() || null,
        }),
      });
      setOrder(data.order);
      setPaymentStatus(data.order.paymentStatus);
      setStatus(data.order.status);
      setAdminNotes(data.order.adminNotes || "");
      setTransactionReference("");
      setConfirmationNote("");
      setAssistSuccess("Assisted payment recorded. Payment status updated to confirmed.");
    } catch (e) {
      setAssistError(e instanceof Error ? e.message : "Failed to record assisted payment");
    } finally {
      setAssisting(false);
    }
  }

  const inputClass = "w-full rounded-lg border border-[#1e2d45] bg-[#0b1220] px-3 py-2 text-sm text-white focus:border-[#00c2a8] focus:outline-none";
  const labelClass = "mb-1 block text-sm font-medium text-[#c5d0e0]";

  if (loading) return <p className="text-[#8b9cb8]">Loading order…</p>;
  if (error && !order) return <div className="text-red-300" role="alert">{error}</div>;
  if (!order) return null;

  const shippingAddress = [order.shippingLine1, order.shippingLine2].filter(Boolean).join(", ");
  const paymentLabel = order.paymentMethodName || order.paymentMethod?.name;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/orders" className="mb-3 inline-flex items-center gap-1 text-sm text-[#8b9cb8] hover:text-[#00c2a8]">
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-white">{order.orderNumber}</h1>
          <StatusBadge status={order.status} variant="order" />
          <StatusBadge status={order.paymentStatus} variant="payment" />
        </div>
        <p className="mt-1 text-sm text-[#8b9cb8]">Placed {format(new Date(order.createdAt), "PPpp")}</p>
      </div>

      {error ? <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">{error}</div> : null}
      {success ? <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-sm text-teal-300" role="status">{success}</div> : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="rounded-xl border border-[#1e2d45] bg-[#121a2b] p-5">
            <h2 className="mb-4 font-display text-lg font-semibold text-white">Line items</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e2d45] text-left text-xs text-[#8b9cb8]">
                    <th className="pb-2 pr-4">Product</th>
                    <th className="pb-2 pr-4">SKU</th>
                    <th className="pb-2 pr-4">Qty</th>
                    <th className="pb-2 pr-4">Price</th>
                    <th className="pb-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2d45]">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 pr-4">{item.productName}</td>
                      <td className="py-3 pr-4 font-mono text-xs">{item.productSku}</td>
                      <td className="py-3 pr-4">{item.quantity}</td>
                      <td className="py-3 pr-4">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3">{formatCurrency(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 space-y-1 border-t border-[#1e2d45] pt-4 text-sm">
              <div className="flex justify-between"><span className="text-[#8b9cb8]">Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-[#8b9cb8]">Shipping</span><span>{formatCurrency(order.shippingAmount)}</span></div>
              {order.discountAmount > 0 ? <div className="flex justify-between"><span className="text-[#8b9cb8]">Discount</span><span>-{formatCurrency(order.discountAmount)}</span></div> : null}
              <div className="flex justify-between"><span className="text-[#8b9cb8]">Tax</span><span>{formatCurrency(order.taxAmount)}</span></div>
              <div className="flex justify-between font-semibold text-white"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
            </div>
          </section>

          <section className="rounded-xl border border-[#1e2d45] bg-[#121a2b] p-5">
            <h2 className="mb-4 font-display text-lg font-semibold text-white">Customer & shipping</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-[#8b9cb8]">Name</dt><dd>{order.customerName}</dd></div>
              <div><dt className="text-[#8b9cb8]">Email</dt><dd>{order.customerEmail}</dd></div>
              {order.customerPhone ? <div><dt className="text-[#8b9cb8]">Phone</dt><dd>{order.customerPhone}</dd></div> : null}
              <div className="sm:col-span-2">
                <dt className="text-[#8b9cb8]">Address</dt>
                <dd>{shippingAddress}, {order.shippingCity}, {order.shippingState} {order.shippingZip}</dd>
              </div>
              {paymentLabel ? <div><dt className="text-[#8b9cb8]">Payment method</dt><dd>{paymentLabel}</dd></div> : null}
            </dl>
          </section>
        </div>

        <div className="space-y-6">
          {canAssistPayment && order.paymentStatus !== "CONFIRMED" ? (
            <section className="rounded-xl border border-[#1e2d45] bg-[#121a2b] p-5">
              <div className="mb-4 flex items-start gap-2">
                <CreditCard className="h-5 w-5 shrink-0 text-[#00c2a8]" aria-hidden />
                <div>
                  <h2 className="font-display text-lg font-semibold text-white">Assist with payment</h2>
                  <p className="mt-1 text-xs text-[#8b9cb8]">
                    Order <span className="font-mono text-white">{order.orderNumber}</span> · Server total{" "}
                    <span className="text-white">{formatCurrency(order.total)}</span> · Status{" "}
                    <span className="text-white">{order.paymentStatus}</span>
                  </p>
                </div>
              </div>

              <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-200/90">
                Process payment on your authorized POS or virtual terminal first. Recording here does not charge cards on this site.
                Never enter card numbers, CVV codes, or OTPs in this form.
              </div>

              {assistError ? <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">{assistError}</div> : null}
              {assistSuccess ? <div className="mb-3 rounded-lg border border-teal-500/30 bg-teal-500/10 px-3 py-2 text-sm text-teal-300" role="status">{assistSuccess}</div> : null}

              <form onSubmit={handleAssistPayment} className="space-y-3">
                <div>
                  <label htmlFor="transactionReference" className={labelClass}>Transaction reference *</label>
                  <input
                    id="transactionReference"
                    required
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                    className={inputClass}
                    placeholder="POS approval / auth code"
                  />
                </div>

                <div>
                  <label htmlFor="paymentMethodLabel" className={labelClass}>Payment method</label>
                  <select
                    id="paymentMethodLabel"
                    value={paymentMethodLabel}
                    onChange={(e) => setPaymentMethodLabel(e.target.value)}
                    className={inputClass}
                  >
                    {PAYMENT_METHOD_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="confirmationNote" className={labelClass}>Confirmation note (optional)</label>
                  <textarea
                    id="confirmationNote"
                    rows={2}
                    value={confirmationNote}
                    onChange={(e) => setConfirmationNote(e.target.value)}
                    className={inputClass}
                    placeholder="Staff initials, terminal ID, etc."
                  />
                </div>

                <button
                  type="submit"
                  disabled={assisting}
                  className="w-full rounded-lg bg-[#00c2a8] px-4 py-2.5 text-sm font-semibold text-[#0b1220] hover:bg-[#00d4b8] disabled:opacity-60"
                >
                  {assisting ? "Recording…" : "Record assisted payment"}
                </button>
              </form>
            </section>
          ) : null}

          {order.paymentStatus !== "CONFIRMED" ? (
            <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
              <div className="mb-3 flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" aria-hidden />
                <div>
                  <h2 className="font-display text-lg font-semibold text-amber-200">Manual payment confirmation</h2>
                  <p className="mt-1 text-xs text-amber-200/80">
                    Payments are never auto-confirmed. Verify payment was received before confirming.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={confirmPayment}
                disabled={saving || order.paymentStatus === "CONFIRMED"}
                className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-[#0b1220] hover:bg-amber-400 disabled:opacity-50"
              >
                Confirm payment received
              </button>
            </section>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-[#1e2d45] bg-[#121a2b] p-5">
            <h2 className="font-display text-lg font-semibold text-white">Update order</h2>

            <div>
              <label htmlFor="status" className={labelClass}>Order status</label>
              <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="paymentStatus" className={labelClass}>Payment status</label>
              <select id="paymentStatus" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={inputClass}>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
              <p className="mt-1 text-xs text-[#8b9cb8]">Use the confirm button above for manual verification.</p>
            </div>

            <div>
              <label htmlFor="trackingNumber" className={labelClass}>Tracking number</label>
              <input id="trackingNumber" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className={inputClass} />
            </div>

            <div>
              <label htmlFor="shippingCarrier" className={labelClass}>Shipping carrier</label>
              <input id="shippingCarrier" value={shippingCarrier} onChange={(e) => setShippingCarrier(e.target.value)} className={inputClass} placeholder="USPS, UPS, FedEx…" />
            </div>

            <div>
              <label htmlFor="adminNotes" className={labelClass}>Admin notes</label>
              <textarea id="adminNotes" rows={4} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} className={inputClass} />
            </div>

            <button type="submit" disabled={saving} className="w-full rounded-lg bg-[#00c2a8] px-4 py-2.5 text-sm font-semibold text-[#0b1220] hover:bg-[#00d4b8] disabled:opacity-60">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
