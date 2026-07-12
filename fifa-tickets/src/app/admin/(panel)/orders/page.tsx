import { prisma } from "@/lib/db";
import { OrdersAdmin } from "@/components/admin/OrdersAdmin";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      match: true,
      category: true,
      items: { include: { seat: true } },
    },
    take: 200,
  });

  return (
    <OrdersAdmin
      initial={orders.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
      }))}
    />
  );
}
