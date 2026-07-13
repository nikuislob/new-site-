import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentCustomer();
  if (!user) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="container-page py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-bold">My account</h1>
          <p className="mt-2 text-[var(--ink-muted)]">
            {user.firstName} {user.lastName} · {user.email}
          </p>
        </div>
        <LogoutButton />
      </div>

      <h2 className="mt-10 font-display text-3xl font-bold">Orders</h2>
      {orders.length === 0 ? (
        <div className="card-quiet mt-4 p-8 text-center">
          <p className="text-[var(--ink-muted)]">No orders yet.</p>
          <Link href="/matches" className="btn btn-primary mt-4 inline-flex">
            Browse matches
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/order/${order.orderNumber}`}
              className="card-quiet flex flex-wrap items-center justify-between gap-3 p-5 transition hover:border-[var(--brand)]"
            >
              <div>
                <p className="font-semibold">{order.orderNumber}</p>
                <p className="text-sm text-[var(--ink-muted)]">
                  {order.ticketCount} ticket(s) · {order.status.replaceAll("_", " ")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-bold">{formatCurrency(order.totalCents)}</p>
                <p className="text-xs font-semibold uppercase text-[var(--warning)]">
                  Payment {order.paymentStatus}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
