import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/format";

export const metadata = {
  title: "My Orders",
};

export default async function OrdersPage() {
  const user = await getCurrentCustomer();
  if (!user) redirect("/account/login?next=/account/orders");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Orders</h1>
        <Link href="/account" className="text-sm font-semibold text-[var(--brand-deep)] hover:underline">
          Back to account
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="text-[var(--ink-muted)]">You haven&apos;t placed any orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="card-surface block p-5 transition hover:border-[var(--brand)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display text-lg font-semibold">{order.orderNumber}</p>
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">
                    Placed {new Date(order.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-2 text-sm">
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""} · {order.status.replace(/_/g, " ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl font-bold">{formatCurrency(order.total)}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[var(--warning)]">
                    Payment: {order.paymentStatus}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
