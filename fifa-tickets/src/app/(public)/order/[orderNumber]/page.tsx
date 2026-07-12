import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney, formatMatchDate } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ orderNumber: string }> };

export default async function OrderPage({ params }: Props) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      match: true,
      customer: true,
      category: true,
      items: { include: { seat: true } },
    },
  });

  if (!order) notFound();

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-[var(--shadow)]">
        <div className="flex items-center gap-3 text-[var(--success)]">
          <CheckCircle2 size={28} />
          <h1 className="font-display text-4xl tracking-[0.05em] text-[var(--pitch-deep)]">Order Recorded</h1>
        </div>
        <p className="mt-3 text-[var(--ink-muted)]">
          Order <strong>{order.orderNumber}</strong> · Payment status: <strong>{order.paymentStatus}</strong>
        </p>
        <div className="mt-6 space-y-2 text-sm">
          <p>
            <strong>Match:</strong> {order.match.homeTeam} vs {order.match.opponent}
          </p>
          <p>
            <strong>Date:</strong> {formatMatchDate(order.match.matchDate)} · {order.match.matchTime}
          </p>
          <p>
            <strong>Venue:</strong> {order.match.stadiumName}, {order.match.venue}
          </p>
          <p>
            <strong>Category:</strong> {order.category.name} × {order.quantity}
          </p>
          <p>
            <strong>Seats:</strong> {order.items.map((i) => i.seat.label).join(", ")}
          </p>
          <p>
            <strong>Total:</strong> {formatMoney(order.totalAmount)}
          </p>
          {order.paymentUrl && (
            <p>
              <strong>Payment link:</strong>{" "}
              <a className="text-[var(--pitch)] underline" href={order.paymentUrl} target="_blank" rel="noreferrer">
                Open payment page
              </a>
            </p>
          )}
        </div>
        <Link href="/matches" className="btn btn-primary mt-8">
          Browse more matches
        </Link>
      </div>
    </div>
  );
}
