import { NextRequest } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { getOrCreateCart, cartTotals, applyCoupon } from "@/lib/cart";
import { prisma } from "@/lib/db";
import { safeJson, errorJson } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({ code: z.string().min(1).max(40) });

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentCustomer();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return errorJson("Coupon code required", 400);

    const cart = await getOrCreateCart(user?.id);
    const totals = cartTotals(cart.items);
    const result = await applyCoupon(parsed.data.code, totals.subtotal);

    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponCode: result.coupon?.code || null },
    });

    return safeJson({ coupon: result.coupon, discount: result.discount });
  } catch (e) {
    return errorJson(e instanceof Error ? e.message : "Invalid coupon", 400);
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentCustomer();
    const cart = await getOrCreateCart(user?.id);
    await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
    return safeJson({ success: true });
  } catch {
    return errorJson("Failed to remove coupon", 500);
  }
}
