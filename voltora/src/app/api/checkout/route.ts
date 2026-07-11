import { NextRequest } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { getOrCreateCart, cartTotals, applyCoupon } from "@/lib/cart";
import { prisma } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { checkoutSchema } from "@/lib/validators";
import { generateOrderNumber, safeJson, errorJson } from "@/lib/utils";
import { guestOrderToken } from "@/lib/payments/providers";

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
    const shippingAmount =
      baseTotals.subtotal - discountAmount >= freeThreshold ? 0 : flatRate;
    const totals = cartTotals(cart.items, discountAmount, shippingAmount);

    const orderNumber = generateOrderNumber();
    const data = parsed.data;
    const email = data.customerEmail.toLowerCase();

    const order = await prisma.$transaction(async (tx) => {
      // Re-check stock inside transaction (no decrement yet — happens on payment confirm)
      for (const item of cart.items) {
        if (item.variantId) {
          const v = await tx.productVariant.findUnique({ where: { id: item.variantId } });
          if (!v || !v.isActive || v.stockQuantity < item.quantity) {
            throw new Error(`Insufficient stock for ${item.product.name}`);
          }
        } else {
          const p = await tx.product.findUnique({ where: { id: item.productId } });
          if (!p || !p.isActive || p.stockQuantity < item.quantity) {
            throw new Error(`Insufficient stock for ${item.product.name}`);
          }
        }
      }

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: user?.id || null,
          guestEmail: user ? null : email,
          status: "PAYMENT_PENDING",
          paymentStatus: "PENDING",
          subtotal: totals.subtotal,
          discountAmount: totals.discount,
          shippingAmount: totals.shippingAmount,
          taxAmount: 0,
          total: totals.total,
          couponCode,
          customerName: data.customerName,
          customerEmail: email,
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

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({ where: { id: cart.id }, data: { couponCode: null } });

      return created;
    });

    const accessToken = guestOrderToken(order.orderNumber, email);

    return safeJson(
      {
        order,
        accessToken,
        // Client must not trust prices — these are server-calculated
        totals: {
          subtotal: order.subtotal,
          discount: order.discountAmount,
          shipping: order.shippingAmount,
          tax: order.taxAmount,
          total: order.total,
        },
      },
      201
    );
  } catch (e) {
    return errorJson(e instanceof Error ? e.message : "Checkout failed", 500);
  }
}
