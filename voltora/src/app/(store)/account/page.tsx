import Link from "next/link";
import { redirect } from "next/navigation";
import { Headphones, MapPin, Settings, TicketCheck } from "lucide-react";
import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";

export const metadata = { title: "My tickets" };

export default async function AccountPage() {
  const user = await getCurrentCustomer();
  if (!user) redirect("/account/login?next=/account");
  const [bookings, conversations] = await Promise.all([
    prisma.booking.findMany({ where: { userId: user.id }, include: { match: { include: { venue: true } }, items: true, deliveries: true }, orderBy: { createdAt: "desc" } }),
    prisma.conversation.count({ where: { userId: user.id, status: "OPEN" } }),
  ]);
  const upcoming = bookings.filter((booking) => booking.match.kickoffAt > new Date());
  const past = bookings.filter((booking) => booking.match.kickoffAt <= new Date());
  return <div className="container-page py-12">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#17845f]">Your PitchPass</p><h1 className="mt-2 font-display text-4xl font-extrabold">Welcome back, {user.firstName}.</h1><p className="mt-2 text-sm text-[var(--ink-muted)]">{user.email}</p></div><div className="flex gap-2"><Link href="/support" className="btn btn-secondary text-sm"><Headphones className="h-4 w-4" /> Support {conversations ? `(${conversations})` : ""}</Link><Link href="/account/profile" className="btn btn-dark text-sm"><Settings className="h-4 w-4" /> Profile</Link></div></div>
    <section className="mt-10"><h2 className="font-display text-2xl font-bold">Upcoming tickets</h2>{upcoming.length ? <div className="mt-5 grid gap-4 lg:grid-cols-2">{upcoming.map((booking) => <BookingCard key={booking.id} booking={booking} />)}</div> : <div className="mt-5 rounded-[24px] border border-dashed border-[#b9cec3] bg-white p-10 text-center"><TicketCheck className="mx-auto h-7 w-7 text-[#799187]" /><p className="mt-3 font-semibold">No upcoming tickets</p><Link href="/#matches" className="mt-3 inline-block text-sm font-bold text-[#17845f]">Explore matches</Link></div>}</section>
    {past.length ? <section className="mt-12"><h2 className="font-display text-2xl font-bold">Past orders</h2><div className="mt-5 grid gap-4 lg:grid-cols-2">{past.map((booking) => <BookingCard key={booking.id} booking={booking} />)}</div></section> : null}
  </div>;
}

type BookingCardProps = { booking: Awaited<ReturnType<typeof prisma.booking.findFirst>> & { match: { homeTeam: string; awayTeam: string; kickoffAt: Date; venue: { name: string; city: string } }; items: { quantity: number; category: string }[]; deliveries: { status: string }[] } };
function BookingCard({ booking }: BookingCardProps) {
  return <div className="rounded-[24px] border border-[#dce8e2] bg-white p-6 shadow-sm"><div className="flex justify-between gap-3"><div><p className="font-mono text-xs text-[#17845f]">{booking.reference}</p><h3 className="mt-2 font-display text-xl font-bold">{booking.match.homeTeam} vs {booking.match.awayTeam}</h3></div><span className="h-fit rounded-full bg-[#edf6f1] px-3 py-1 text-[10px] font-bold uppercase text-[#41705c]">{booking.paymentStatus}</span></div><p className="mt-4 flex items-center gap-2 text-xs text-[#647a71]"><MapPin className="h-3.5 w-3.5" /> {booking.match.venue.name}, {booking.match.venue.city}</p><div className="mt-5 flex items-end justify-between border-t border-[#e7efeb] pt-4"><div><p className="text-xs text-[#758a82]">{booking.items[0]?.quantity} × {booking.items[0]?.category} · Delivery {booking.deliveries[0]?.status || "pending"}</p><p className="mt-1 font-display font-bold">{formatMoney(booking.total, booking.currency)}</p></div><span className="text-xs font-semibold text-[#61786d]">{booking.status.replaceAll("_"," ")}</span></div></div>;
}
