"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, CircleDollarSign, Clock3, MessageCircle, Ticket, Trophy } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { formatMoney } from "@/lib/utils";

type Data = { stats: { upcomingMatches: number; activeListings: number; openSupport: number; pendingOrders: number; paidOrders: number; revenue: number }; recentBookings: { id: string; reference: string; customerFirstName: string; customerLastName: string; total: number; currency: string; status: string; paymentStatus: string; match: { homeTeam: string; awayTeam: string } }[] };

export default function DashboardPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { adminFetch<Data>("/api/admin/dashboard").then(setData).catch((cause) => setError(cause.message)); }, []);
  if (!data) return <p className="text-[#8b9cb8]">{error || "Loading dashboard…"}</p>;
  const stats = [
    [CalendarDays, "Upcoming matches", data.stats.upcomingMatches],
    [Ticket, "Active listings", data.stats.activeListings],
    [Clock3, "Awaiting payment", data.stats.pendingOrders],
    [Trophy, "Paid orders", data.stats.paidOrders],
    [CircleDollarSign, "Verified revenue", formatMoney(data.stats.revenue)],
    [MessageCircle, "Open conversations", data.stats.openSupport],
  ] as const;
  return <div className="space-y-8">
    <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#35e89b]">Operations</p><h1 className="mt-2 font-display text-3xl font-bold text-white">PitchPass dashboard</h1><p className="mt-1 text-sm text-[#8b9cb8]">Live inventory, orders, payments, and customer support.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{stats.map(([Icon,label,value]) => <div key={label} className="rounded-xl border border-[#20352d] bg-[#0f251d] p-5"><Icon className="h-5 w-5 text-[#35e89b]" /><p className="mt-5 text-xs uppercase tracking-wider text-[#81958d]">{label}</p><p className="mt-1 font-display text-3xl font-bold">{value}</p></div>)}</div>
    <section><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-lg font-bold">Recent orders</h2><Link href="/admin/bookings" className="text-sm text-[#35e89b]">View all</Link></div><div className="overflow-x-auto rounded-xl border border-[#20352d]"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#102b20] text-xs uppercase text-[#82978f]"><tr>{["Reference","Customer","Match","Total","Payment","Status"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr></thead><tbody>{data.recentBookings.map((booking) => <tr key={booking.id} className="border-t border-[#20352d] bg-[#0c2119]"><td className="px-4 py-3"><Link href={`/admin/bookings/${booking.id}`} className="font-mono text-xs text-[#35e89b]">{booking.reference}</Link></td><td className="px-4 py-3">{booking.customerFirstName} {booking.customerLastName}</td><td className="px-4 py-3">{booking.match.homeTeam} vs {booking.match.awayTeam}</td><td className="px-4 py-3">{formatMoney(booking.total, booking.currency)}</td><td className="px-4 py-3 text-xs">{booking.paymentStatus}</td><td className="px-4 py-3 text-xs">{booking.status}</td></tr>)}</tbody></table></div></section>
  </div>;
}
