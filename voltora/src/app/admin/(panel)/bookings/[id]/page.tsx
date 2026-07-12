"use client";

import { use, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { formatMoney } from "@/lib/utils";

type Booking = { id: string; reference: string; customerFirstName: string; customerLastName: string; customerEmail: string; customerPhone: string; customerCountry: string; status: string; paymentStatus: string; paymentMethod: string | null; total: number; currency: string; createdAt: string; match: { homeTeam: string; awayTeam: string; kickoffAt: string; venue: { name: string; city: string } }; items: { quantity: number; category: string; section: string; row: string | null; seats: string | null }[]; payments: { provider: string; providerReference: string | null; status: string; amount: number; createdAt: string; errorMessage: string | null }[]; deliveries: { status: string; deliveryNotes: string | null; mobileInstructions: string | null }[] };

export default function AdminBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("PENDING");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [ticketFile, setTicketFile] = useState<File | null>(null);
  async function load() { const data = await adminFetch<{ booking: Booking }>(`/api/admin/bookings/${id}`); setBooking(data.booking); setStatus(data.booking.status); setPaymentStatus(data.booking.paymentStatus); setDeliveryStatus(data.booking.deliveries[0]?.status || "PENDING"); setDeliveryNotes(data.booking.deliveries[0]?.deliveryNotes || ""); }
  useEffect(() => { void load().catch((cause) => setError(cause.message)); }, [id]);
  async function save() { setNotice(""); setError(""); try { await adminFetch(`/api/admin/bookings/${id}`, { method: "PATCH", body: JSON.stringify({ status, paymentStatus, deliveryStatus, deliveryNotes }) }); setNotice("Order updated and audit logged."); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Update failed"); } }
  async function uploadTicket() {
    if (!ticketFile) return;
    setError(""); setNotice("");
    try {
      const body = new FormData();
      body.append("file", ticketFile);
      await adminFetch(`/api/admin/bookings/${id}/ticket-file`, { method: "POST", body });
      setNotice("Secure ticket PDF assigned. It is not publicly accessible.");
      setTicketFile(null);
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Ticket upload failed"); }
  }
  if (!booking) return <p className="text-[#8b9cb8]">{error || "Loading order…"}</p>;
  const item = booking.items[0];
  return <div className="space-y-6">
    <div><p className="font-mono text-xs text-[#35e89b]">{booking.reference}</p><h1 className="mt-1 font-display text-2xl font-bold">Manage order</h1><p className="mt-1 text-sm text-[#8b9cb8]">{booking.match.homeTeam} vs {booking.match.awayTeam}</p></div>
    <div className="grid gap-5 xl:grid-cols-3">
      <section className="rounded-xl border border-[#20352d] bg-[#0f251d] p-5 xl:col-span-2"><h2 className="font-display text-lg font-bold">Order context</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><Detail label="Customer" value={`${booking.customerFirstName} ${booking.customerLastName}`} /><Detail label="Contact" value={`${booking.customerEmail} · ${booking.customerPhone}`} /><Detail label="Match / venue" value={`${booking.match.homeTeam} vs ${booking.match.awayTeam} · ${booking.match.venue.name}`} /><Detail label="Ticket" value={`${item.quantity} × ${item.category} · ${item.section}${item.row ? ` · Row ${item.row}` : ""}`} /><Detail label="Amount" value={formatMoney(booking.total, booking.currency)} /><Detail label="Payment method" value={booking.paymentMethod?.replaceAll("_"," ") || "Not selected"} /></div></section>
      <section className="rounded-xl border border-[#20352d] bg-[#0f251d] p-5"><h2 className="font-display text-lg font-bold">Operations</h2><label className="mt-4 block text-xs text-[#82978f]">Order status<select className="admin-field" value={status} onChange={(e) => setStatus(e.target.value)}>{["AWAITING_PAYMENT","PAYMENT_PROCESSING","AWAITING_PAYMENT_CONFIRMATION","PAID","CONFIRMED","TICKET_DELIVERY_PENDING","TICKET_DELIVERED","CANCELLED","REFUNDED"].map((value) => <option key={value}>{value}</option>)}</select></label><label className="mt-4 block text-xs text-[#82978f]">Payment status<select className="admin-field" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>{["PENDING","PROCESSING","PAID","FAILED","CANCELLED","REFUNDED"].map((value) => <option key={value}>{value}</option>)}</select></label><label className="mt-4 block text-xs text-[#82978f]">Delivery status<select className="admin-field" value={deliveryStatus} onChange={(e) => setDeliveryStatus(e.target.value)}>{["PENDING","READY","DELIVERED"].map((value) => <option key={value}>{value}</option>)}</select></label><label className="mt-4 block text-xs text-[#82978f]">Delivery notes<textarea className="admin-field min-h-20" value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} /></label>{notice ? <p className="mt-3 text-xs text-emerald-300">{notice}</p> : null}{error ? <p className="mt-3 text-xs text-red-300">{error}</p> : null}<button onClick={save} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#35e89b] px-4 py-2.5 text-sm font-bold text-[#062017]"><Save className="h-4 w-4" /> Save changes</button></section>
    </div>
    <section className="rounded-xl border border-[#20352d] bg-[#0f251d] p-5"><h2 className="font-display text-lg font-bold">Secure ticket delivery</h2><p className="mt-1 text-xs text-[#84988f]">PDF files are stored outside the public directory and require verified order access.</p><div className="mt-4 flex flex-wrap items-center gap-3"><input type="file" accept="application/pdf" onChange={(e) => setTicketFile(e.target.files?.[0] || null)} className="text-sm text-[#a6b8b0] file:mr-3 file:rounded-lg file:border-0 file:bg-[#19382c] file:px-3 file:py-2 file:text-[#dce8e2]" /><button onClick={uploadTicket} disabled={!ticketFile || booking.paymentStatus !== "PAID"} className="rounded-lg bg-[#35e89b] px-4 py-2 text-sm font-bold text-[#062017] disabled:opacity-40">Assign PDF</button></div></section>
    <section className="rounded-xl border border-[#20352d] bg-[#0f251d] p-5"><h2 className="font-display text-lg font-bold">Payment attempts</h2><div className="mt-4 space-y-3">{booking.payments.length ? booking.payments.map((payment) => <div key={payment.providerReference || payment.createdAt} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#081b14] p-4 text-sm"><div><p className="font-semibold">{payment.provider.replaceAll("_"," ")}</p><p className="mt-1 font-mono text-xs text-[#748b81]">{payment.providerReference || "No provider reference"}</p></div><div className="text-right"><p>{payment.status}</p><p className="mt-1 text-xs text-[#748b81]">{new Date(payment.createdAt).toLocaleString()}</p></div>{payment.errorMessage ? <p className="w-full text-xs text-red-300">{payment.errorMessage}</p> : null}</div>) : <p className="text-sm text-[#84988f]">No payment attempts yet.</p>}</div></section>
    <style jsx>{`.admin-field{display:block;width:100%;margin-top:.35rem;border:1px solid #294139;background:#071b13;border-radius:8px;padding:.6rem .7rem;color:white;font-size:.8rem}`}</style>
  </div>;
}
function Detail({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] font-bold uppercase tracking-wider text-[#778d84]">{label}</p><p className="mt-1.5 text-sm text-[#dbe5e1]">{value}</p></div>; }
