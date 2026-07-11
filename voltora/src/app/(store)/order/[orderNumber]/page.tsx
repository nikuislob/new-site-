import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/auth";
import { verifyGuestOrderToken } from "@/lib/payments/providers";
import { formatCurrency } from "@/lib/format";
import { AlertCircle, Package } from "lucide-react";

interface PageProps {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ email?: string; token?: string }>;
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

export default async function PublicOrderPage({ params, searchParams }: PageProps) {
  const { orderNumber } = await params;
  const sp = await searchParams;
  const user = await getCurrentCustomer();

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) notFound();

  const email = (sp.email || "").toLowerCase();
  const token = sp.token || "";
  const allowed =
    (user && order.userId === user.id) ||
    (email && token && order.customerEmail === email && verifyGuestOrderToken(order.orderNumber, email, token));

  if (!allowed) {
    return (
      <div className="container-page py-16">
        <div className="mx-auto max-w-lg rounded-[var(--radius)] border border-[var(--line)] bg-white p-8 text-center">
          <h1 className="font-display text-2xl font-bold">Order access required</h1>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            Sign in to the account that placed this order, or open the secure tracking link from your checkout confirmation.
            Order details are not public.
          </p>
          <a href="/account/login" className="btn btn-primary mt-6 inline-flex">
            Sign in
          </a>
        </div>
      </div>
    );
  }

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
              Payment: {order.paymentStatus}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {STATUS_STEPS.map((step, i) => (
            <span
              key={step}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                i <= currentStep ? "bg-[var(--brand-soft)] text-[#067260]" : "bg-[var(--surface)] text-[var(--ink-muted)]"
              }`}
            >
              {step.replace(/_/g, " ")}
            </span>
          ))}
        </div>

        <ul className="mt-8 space-y-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-3 rounded-xl border border-[var(--line)] p-3">
              {item.imageUrl ? (
                <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                  <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="64px" />
                </div>
              ) : null}
              <div className="flex-1">
                <p className="font-medium">{item.productName}</p>
                <p className="text-xs text-[var(--ink-muted)]">
                  {item.variantName || item.productSku} · Qty {item.quantity}
                </p>
              </div>
              <span className="font-semibold">{formatCurrency(item.lineTotal)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--line)] p-4 text-sm">
            <p className="font-semibold">Shipping</p>
            <p className="mt-2 text-[var(--ink-muted)]">
              {order.customerName}
              <br />
              {order.shippingLine1}
              {order.shippingLine2 ? <>, {order.shippingLine2}</> : null}
              <br />
              {order.shippingCity}, {order.shippingState} {order.shippingZip}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--line)] p-4 text-sm">
            <p className="font-semibold">Total paid / due</p>
            <p className="mt-2 font-display text-2xl font-bold">{formatCurrency(order.total)}</p>
            {order.trackingNumber ? (
              <p className="mt-2 text-[var(--ink-muted)]">
                Tracking: {order.shippingCarrier} {order.trackingNumber}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
