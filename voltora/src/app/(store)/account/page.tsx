import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, User, Heart } from "lucide-react";
import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/format";

export const metadata = {
  title: "My Account",
  description: "Manage your Voltora account, orders, and profile.",
};

export default async function AccountDashboardPage() {
  const user = await getCurrentCustomer();
  if (!user) redirect("/account/login?next=/account");

  const [orders, wishlistCount] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.wishlistItem.count({ where: { userId: user.id } }),
  ]);

  const links = [
    { href: "/account/orders", label: "Orders", icon: Package, desc: "Track and view order history" },
    { href: "/account/profile", label: "Profile", icon: User, desc: "Update your details and addresses" },
    { href: "/wishlist", label: "Wishlist", icon: Heart, desc: `${wishlistCount} saved items` },
  ];

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold">
          Welcome back, {user.firstName}
        </h1>
        <p className="mt-2 text-[var(--ink-muted)]">{user.email}</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="card-surface group p-5 transition hover:-translate-y-0.5"
          >
            <link.icon className="h-5 w-5 text-[var(--brand)]" />
            <h2 className="mt-3 font-display font-semibold">{link.label}</h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">{link.desc}</p>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Recent orders</h2>
          <Link href="/account/orders" className="text-sm font-semibold text-[var(--brand-deep)] hover:underline">
            View all
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="card-surface flex flex-wrap items-center justify-between gap-3 p-4 transition hover:border-[var(--brand)]"
              >
                <div>
                  <p className="font-semibold">{order.orderNumber}</p>
                  <p className="text-sm text-[var(--ink-muted)]">
                    {new Date(order.createdAt).toLocaleDateString()} · {order.status.replace(/_/g, " ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold">{formatCurrency(order.total)}</p>
                  <p className="text-xs font-semibold text-[var(--warning)]">{order.paymentStatus}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
