"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { formatMoney } from "@/lib/utils";

type Booking = { id: string; reference: string; customerFirstName: string; customerLastName: string; customerEmail: string; status: string; paymentStatus: string; paymentMethod: string | null; total: number; currency: string; createdAt: string; match: { homeTeam: string; awayTeam: string }; items: { quantity: number; category: string }[] };

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  async function load(q = "") { try { const data = await adminFetch<{ bookings: Booking[] }>(`/api/admin/bookings${q ? `?q=${encodeURIComponent(q)}` : ""}`); setBookings(data.bookings); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load orders"); } }
  useEffect(() => { void load(); }, []);
  return <div className="space-y-6">
    <div><h1 className="font-display text-2xl font-bold text-white">Orders</h1><p className="mt-1 text-sm text-[#8b9cb8]">Payment, customer, support, and delivery operations.</p></div>
    <form onSubmit={(e) => { e.preventDefault(); void load(query); }} className="flex max-w-lg gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#70877d]" /><input className="w-full rounded-lg border border-[#294139] bg-[#071b13] py-2.5 pl-9 pr-3 text-sm" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Booking reference or email" /></div><button className="rounded-lg bg-[#35e89b] px-4 text-sm font-bold text-[#062017]">Search</button></form>
    {error ? <p className="text-red-300">{error}</p> : null}
    <div className="overflow-x-auto rounded-xl border border-[#20352d]"><table className="w-full min-w-[950px] text-left text-sm"><thead className="bg-[#102b20] text-xs uppercase text-[#82978f]"><tr>{["Reference","Customer","Match","Tickets","Amount","Payment","Status",""].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr></thead><tbody>{bookings.map((booking) => <tr key={booking.id} className="border-t border-[#20352d] bg-[#0c2119]"><td className="px-4 py-3 font-mono text-xs text-[#35e89b]">{booking.reference}</td><td className="px-4 py-3">{booking.customerFirstName} {booking.customerLastName}<br/><span className="text-xs text-[#7e938a]">{booking.customerEmail}</span></td><td className="px-4 py-3">{booking.match.homeTeam} vs {booking.match.awayTeam}</td><td className="px-4 py-3">{booking.items[0]?.quantity} × {booking.items[0]?.category}</td><td className="px-4 py-3 font-semibold">{formatMoney(booking.total, booking.currency)}</td><td className="px-4 py-3"><span className="rounded-full bg-white/5 px-2 py-1 text-xs">{booking.paymentStatus}</span><br/><span className="mt-1 inline-block text-[10px] text-[#7e938a]">{booking.paymentMethod?.replaceAll("_"," ") || "Not selected"}</span></td><td className="px-4 py-3 text-xs">{booking.status}</td><td className="px-4 py-3"><Link href={`/admin/bookings/${booking.id}`} className="font-semibold text-[#35e89b] hover:underline">Manage</Link></td></tr>)}</tbody></table></div>
  </div>;
}
