import { NextRequest } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { getOrCreateCart, cartTotals, applyCoupon } from "@/lib/cart";
import { prisma } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { checkoutSchema } from "@/lib/validators";
import { generateOrderNumber, safeJson, errorJson } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    const user = await getCurrentCustomer();
    const cart = await getOrCreateCart(user?.id);

    if (cart.items.length === 0) return errorJson("Cart is empty", 400);

    for (const item of cart.items) {
      if (!item.product.isActive) {
        return errorJson(`${item.product.name} is no longer available`, 400);
      }
      const stock = item.variant ? item.variant.stockQuantity : item.product.stockQuantity;
      if (item.variant && !item.variant.isActive) {
        return errorJson(`${item.product.name} variant is unavailable`, 400);
      }
      if (stock < item.quantity) {
        return errorJson(`Insufficient stock for ${item.product.name}`, 400);
      }
    }

    const baseTotals = cartTotals(cart.items);
    let discountAmount = 0;
    let couponCode: string | null = null;

    const code = parsed.data.couponCode || cart.couponCode;
    if (code) {
      const couponResult = await applyCoupon(code, baseTotals.subtotal);
      discountAmount = couponResult.discount;
      couponCode = couponResult.coupon?.code || null;
    }

    const flatRate = Number(await getSetting("flat_shipping_rate")) || 0;
    const freeThreshold = Number(await getSetting("free_shipping_threshold")) || 0;
    const shippingAmount = baseTotals.subtotal >= freeThreshold ? 0 : flatRate;
    const totals = cartTotals(cart.items, discountAmount, shippingAmount);

    const orderNumber = generateOrderNumber();
    const data = parsed.data;

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: user?.id || null,
          guestEmail: user ? null : data.customerEmail.toLowerCase(),
          status: "ORDER_CREATED",
          paymentStatus: "PENDING",
          subtotal: totals.subtotal,
          discountAmount: totals.discount,
          shippingAmount: totals.shippingAmount,
          taxAmount: 0,
          total: totals.total,
          couponCode,
          customerName: data.customerName,
          customerEmail: data.customerEmail.toLowerCase(),
          customerPhone: data.customerPhone || null,
          shippingLine1: data.shippingLine1,
          shippingLine2: data.shippingLine2 || null,
          shippingCity: data.shippingCity,
          shippingState: data.shippingState,
          shippingZip: data.shippingZip,
          shippingCountry: data.shippingCountry,
          customerNotes: data.customerNotes || null,
          items: {
            create: cart.items.map((item) => {
              const unitPrice = item.product.sellingPrice + (item.variant?.priceModifier || 0);
              return {
                productId: item.productId,
                variantId: item.variantId,
                productName: item.product.name,
                productSku: item.variant?.sku || item.product.sku,
                variantName: item.variant?.name || null,
                imageUrl: item.variant?.imageUrl || item.product.mainImage,
                unitPrice,
                quantity: item.quantity,
                lineTotal: unitPrice * item.quantity,
              };
            }),
          },
        },
        include: { items: true },
      });

      await tx.order.update({
        where: { id: created.id },
        data: { status: "PAYMENT_PENDING" },
      });

      for (const item of cart.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: { decrement: item.quantity },
              salesCount: { increment: item.quantity },
            },
          });
        }
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({ where: { id: cart.id }, data: { couponCode: null } });

      if (couponCode) {
        await tx.coupon.update({
          where: { code: couponCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      return { ...created, status: "PAYMENT_PENDING" as const };
    });

    return safeJson({ order }, 201);
  } catch (e) {
    return errorJson(e instanceof Error ? e.message : "Checkout failed", 500);
  }
}
