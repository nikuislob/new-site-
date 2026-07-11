import { requireCustomer, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJson, errorJson } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireCustomer();
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: { items: true, paymentMethod: true },
      orderBy: { createdAt: "desc" },
    });

    return safeJson({ orders });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to fetch orders", 500);
  }
}
