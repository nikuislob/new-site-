import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/format";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const user = await getCurrentCustomer();
  if (!user) redirect("/account/login");

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
    include: { items: true, paymentMethod: true },
  });
  if (!order) notFound();

  return (
    <div className="container-page py-8 sm:py-12">
      <Link href="/account/orders" className="text-sm font-semibold text-[var(--brand-deep)] hover:underline">
        ← Back to orders
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="font-display text-3xl font-bold">{order.orderNumber}</h1>
          <p className="mt-1 text-[var(--ink-muted)]">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl bg-[#fffbeb] px-4 py-2 text-sm font-semibold text-[var(--warning)]">
          Payment: {order.paymentStatus}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {order.items.map((item: (typeof order.items)[number]) => (
            <article key={item.id} className="card-surface flex gap-4 p-4">
              {item.imageUrl ? (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                  <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="64px" />
                </div>
              ) : null}
              <div className="flex-1">
                <p className="font-semibold">{item.productName}</p>
                {item.variantName ? <p className="text-sm text-[var(--ink-muted)]">{item.variantName}</p> : null}
                <p className="mt-1 text-sm">Qty {item.quantity} × {formatCurrency(item.unitPrice)}</p>
              </div>
              <p className="font-semibold">{formatCurrency(item.lineTotal)}</p>
            </article>
          ))}
        </div>

        <aside className="card-surface h-fit p-5">
          <h2 className="font-display font-semibold">Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatCurrency(order.subtotal)}</dd></div>
            {order.discountAmount > 0 ? (
              <div className="flex justify-between text-[var(--success)]"><dt>Discount</dt><dd>-{formatCurrency(order.discountAmount)}</dd></div>
            ) : null}
            <div className="flex justify-between"><dt>Shipping</dt><dd>{formatCurrency(order.shippingAmount)}</dd></div>
            <div className="flex justify-between border-t border-[var(--line)] pt-2 font-bold">
              <dt>Total</dt><dd>{formatCurrency(order.total)}</dd>
            </div>
          </dl>
          <div className="mt-5 text-sm text-[var(--ink-muted)]">
            <p className="font-semibold text-[var(--ink)]">Ship to</p>
            <p className="mt-1">
              {order.customerName}<br />
              {order.shippingLine1}<br />
              {order.shippingCity}, {order.shippingState} {order.shippingZip}
            </p>
          </div>
          {order.paymentMethod ? (
            <p className="mt-4 text-xs text-[var(--ink-muted)]">
              Payment method: {order.paymentMethodName || order.paymentMethod.name}
            </p>
          ) : null}
          <Link
            href={`/order/${order.orderNumber}`}
            className="mt-4 block text-sm font-semibold text-[var(--brand-deep)] hover:underline"
          >
            Public tracking link
          </Link>
        </aside>
      </div>
    </div>
  );
}
