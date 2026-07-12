import { AuthError, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    const orders = await prisma.order.findMany({
      where: q
        ? {
            OR: [
              { customerName: { contains: q } },
              { customerEmail: { contains: q } },
              { customerPhone: { contains: q } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        createdAt: true,
        paymentAmount: true,
        paymentStatus: true,
        orderNumber: true,
      },
    });

    const map = new Map<
      string,
      {
        name: string;
        email: string;
        phone: string;
        orders: number;
        spent: number;
        lastOrderAt: string;
      }
    >();

    for (const o of orders) {
      const existing = map.get(o.customerEmail);
      if (!existing) {
        map.set(o.customerEmail, {
          name: o.customerName,
          email: o.customerEmail,
          phone: o.customerPhone,
          orders: 1,
          spent: o.paymentStatus === "PAID" ? o.paymentAmount : 0,
          lastOrderAt: o.createdAt.toISOString(),
        });
      } else {
        existing.orders += 1;
        if (o.paymentStatus === "PAID") existing.spent += o.paymentAmount;
      }
    }

    const customers = Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return safeJson({ customers });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to load customers", 500);
  }
}
