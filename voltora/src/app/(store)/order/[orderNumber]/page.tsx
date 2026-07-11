import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { AlertCircle, Package } from "lucide-react";

interface PageProps {
  params: Promise<{ orderNumber: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { orderNumber } = await params;
  return {
    title: `Order ${orderNumber}`,
    description: "Track your Voltora order status.",
  };
}

const STATUS_STEPS = [
  "ORDER_CREATED",
  "PAYMENT_PENDING",
  "PAYMENT_CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export default async function PublicOrderPage({ params }: PageProps) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) notFound();

  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="mx-auto max-w-3xl animate-fade-up">
        <div className="flex items-start gap-3">
          <Package className="h-6 w-6 shrink-0 text-[var(--brand)]" />
          <div>
            <h1 className="font-display text-3xl font-bold">Order {order.orderNumber}</h1>
            <p className="mt-1 text-[var(--ink-muted)]">
              Placed {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-[var(--radius)] border border-[var(--warning)]/30 bg-[#fffbeb] p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-[var(--warning)]" />
          <div className="text-sm">
            <p className="font-semibold text-[var(--ink)]">
              Status: {order.status.replace(/_/g, " ")}
            </p>
            <p className="mt-1 font-semibold text-[var(--warning)]">
              Payment: {order.paymentStatus} — orders remain Payment Pending until manually confirmed by Voltora.
            </p>
          </div>
        </div>

        <div className="mt-8 card-surface p-5">
          <h2 className="font-display font-semibold">Fulfillment progress</h2>
          <ol className="mt-4 space-y-3">
            {STATUS_STEPS.map((step, i) => (
              <li key={step} className="flex items-center gap-3 text-sm">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    i <= currentStep ? "bg-[var(--brand)] text-[#04241f]" : "bg-[var(--surface)] text-[var(--ink-muted)]"
                  }`}
                >
                  {i + 1}
                </span>
                <span className={i <= currentStep ? "font-medium" : "text-[var(--ink-muted)]"}>
                  {step.replace(/_/g, " ")}
                </span>
              </li>
            ))}
          </ol>
          {order.trackingNumber ? (
            <p className="mt-4 text-sm">
              Tracking: <strong>{order.shippingCarrier || "Carrier"}</strong> — {order.trackingNumber}
            </p>
          ) : null}
        </div>

        <div className="mt-6 card-surface p-5">
          <h2 className="font-display font-semibold">Items</h2>
          <ul className="mt-4 space-y-3">
            {order.items.map((item: (typeof order.items)[number]) => (
              <li key={item.id} className="flex gap-3 text-sm">
                {item.imageUrl ? (
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                    <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="48px" />
                  </div>
                ) : null}
                <div className="flex-1">
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-[var(--ink-muted)]">Qty {item.quantity}</p>
                </div>
                <span className="font-semibold">{formatCurrency(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-[var(--line)] pt-4 text-right font-display text-xl font-bold">
            Total: {formatCurrency(order.total)}
          </div>
        </div>

        <div className="mt-6 text-sm text-[var(--ink-muted)]">
          <p className="font-semibold text-[var(--ink)]">Shipping address</p>
          <p className="mt-1">
            {order.customerName}<br />
            {order.shippingLine1}<br />
            {order.shippingCity}, {order.shippingState} {order.shippingZip}
          </p>
        </div>
      </div>
    </div>
  );
}
