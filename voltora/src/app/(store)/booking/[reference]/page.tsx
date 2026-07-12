import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock3, Download, Headphones, MapPin, TicketCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/auth";
import { safeBookingAccessToken } from "@/lib/tickets";
import { formatMoney } from "@/lib/utils";

type Props = { params: Promise<{ reference: string }>; searchParams: Promise<{ token?: string }> };

export default async function BookingPage({ params, searchParams }: Props) {
  const [{ reference }, query, user] = await Promise.all([params, searchParams, getCurrentCustomer()]);
  const booking = await prisma.booking.findUnique({
    where: { reference },
    include: { match: { include: { venue: true } }, items: true, payments: { orderBy: { createdAt: "desc" } }, deliveries: true },
  });
  if (!booking) notFound();
  const tokenValid = query.token && booking.accessTokenHash === safeBookingAccessToken(query.token);
  if (booking.userId ? booking.userId !== user?.id && !tokenValid : !tokenValid) notFound();
  const paid = booking.paymentStatus === "PAID";
  const item = booking.items[0];

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-[32px] bg-[#081f16] p-8 text-center text-white sm:p-12">
          {paid ? <CheckCircle2 className="mx-auto h-14 w-14 text-[var(--brand)]" /> : <Clock3 className="mx-auto h-14 w-14 text-[#e4b95c]" />}
          <p className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-white/45">{paid ? "Payment verified" : "Order created"}</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold">{paid ? "You’re going to the match." : "Your booking is in progress."}</h1>
          <p className="mt-3 text-sm text-white/55">{paid ? "We’ll notify you as soon as your tickets are ready." : `Current payment status: ${booking.paymentStatus.replaceAll("_", " ").toLowerCase()}.`}</p>
          <div className="mx-auto mt-7 inline-flex rounded-full border border-white/15 px-5 py-2 font-mono text-sm">{booking.reference}</div>
        </div>
        <div className="mt-6 rounded-[28px] border border-[#dce8e2] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#17845f]">{booking.match.round}</p>
          <h2 className="mt-3 font-display text-2xl font-bold">{booking.match.homeTeam} vs {booking.match.awayTeam}</h2>
          <p className="mt-3 flex items-center gap-2 text-sm text-[#61786d]"><MapPin className="h-4 w-4" /> {booking.match.venue.name}, {booking.match.venue.city}</p>
          <div className="my-7 h-px bg-[#e5ede9]" />
          <div className="grid gap-5 sm:grid-cols-2">
            <Detail label="Tickets" value={`${item.quantity} × ${item.category}`} />
            <Detail label="Section / row" value={`${item.section}${item.row ? ` · Row ${item.row}` : ""}`} />
            <Detail label="Delivery" value={booking.deliveryMethod} />
            <Detail label="Amount" value={formatMoney(booking.total, booking.currency)} />
            <Detail label="Payment method" value={booking.paymentMethod?.replaceAll("_", " ") || "Not selected"} />
            <Detail label="Delivery status" value={booking.deliveries[0]?.status || "Pending payment"} />
          </div>
          {["READY", "DELIVERED"].includes(booking.deliveries[0]?.status || "") && booking.deliveries[0].secureFileKey ? <a href={`/api/bookings/${booking.reference}/ticket?token=${encodeURIComponent(query.token || "")}`} className="btn btn-primary mt-7"><Download className="h-4 w-4" /> Secure ticket download</a> : null}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link href="/account" className="rounded-2xl border border-[#dce8e2] bg-white p-5"><TicketCheck className="h-5 w-5 text-[#17845f]" /><p className="mt-3 font-display font-bold">View my tickets</p><p className="mt-1 text-xs text-[var(--ink-muted)]">Track payment and delivery status.</p></Link>
          <Link href={`/support?booking=${booking.reference}`} className="rounded-2xl border border-[#dce8e2] bg-white p-5"><Headphones className="h-5 w-5 text-[#17845f]" /><p className="mt-3 font-display font-bold">Contact support</p><p className="mt-1 text-xs text-[var(--ink-muted)]">Your booking context stays attached.</p></Link>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-wider text-[#84978e]">{label}</p><p className="mt-1.5 text-sm font-semibold capitalize">{value}</p></div>;
}
