import { NextRequest } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { getOrCreateCart, cartTotals } from "@/lib/cart";
import { applyCoupon } from "@/lib/cart";
import { prisma } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { safeJson, errorJson } from "@/lib/utils";
import { z } from "zod";

const addSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional().nullable(),
  quantity: z.number().int().min(1).max(99).default(1),
});

const updateSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(0).max(99),
});

export async function GET() {
  try {
    const user = await getCurrentCustomer();
    const cart = await getOrCreateCart(user?.id);
    let discountAmount = 0;

    if (cart.couponCode) {
      const totals = cartTotals(cart.items);
      try {
        const result = await applyCoupon(cart.couponCode, totals.subtotal);
        discountAmount = result.discount;
      } catch {
        await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
      }
    }

    const flatRate = Number(await getSetting("flat_shipping_rate")) || 0;
    const freeThreshold = Number(await getSetting("free_shipping_threshold")) || 0;
    const totals = cartTotals(cart.items, discountAmount, 0);
    const shippingAmount = totals.subtotal >= freeThreshold ? 0 : flatRate;
    const finalTotals = cartTotals(cart.items, discountAmount, shippingAmount);

    return safeJson({
      items: cart.items.map((item) => {
        const unitPrice = item.product.sellingPrice + (item.variant?.priceModifier || 0);
        const stock = item.variant ? item.variant.stockQuantity : item.product.stockQuantity;
        return {
          id: item.id,
          quantity: item.quantity,
          unitPrice,
          lineTotal: unitPrice * item.quantity,
          product: {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            mainImage: item.product.mainImage,
            sellingPrice: item.product.sellingPrice,
            inStock: stock > 0,
            brand: item.product.brand,
          },
          variant: item.variant
            ? {
                id: item.variant.id,
                name: item.variant.name,
                sku: item.variant.sku,
                color: item.variant.color,
                storage: item.variant.storage,
                priceModifier: item.variant.priceModifier,
                stockQuantity: item.variant.stockQuantity,
                inStock: item.variant.stockQuantity > 0,
                imageUrl: item.variant.imageUrl,
              }
            : null,
        };
      }),
      couponCode: cart.couponCode,
      totals: finalTotals,
    });
  } catch {
    return errorJson("Failed to fetch cart", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentCustomer();
    const body = await req.json();
    const parsed = addSchema.safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    const product = await prisma.product.findUnique({
      where: { id: parsed.data.productId },
      include: { variants: true },
    });
    if (!product || !product.isActive) return errorJson("Product not found", 404);

    if (parsed.data.variantId) {
      const variant = product.variants.find((v) => v.id === parsed.data.variantId && v.isActive);
      if (!variant) return errorJson("Variant not found", 404);
      const stock = variant.stockQuantity;
      if (stock < parsed.data.quantity) return errorJson("Insufficient stock", 400);
    } else if (product.stockQuantity < parsed.data.quantity) {
      return errorJson("Insufficient stock", 400);
    }

    const cart = await getOrCreateCart(user?.id);
    const existing = cart.items.find(
      (i) => i.productId === parsed.data.productId && i.variantId === (parsed.data.variantId || null)
    );

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + parsed.data.quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: parsed.data.productId,
          variantId: parsed.data.variantId || null,
          quantity: parsed.data.quantity,
        },
      });
    }

    return safeJson({ success: true }, 201);
  } catch {
    return errorJson("Failed to add to cart", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentCustomer();
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    const cart = await getOrCreateCart(user?.id);
    const item = cart.items.find((i) => i.id === parsed.data.itemId);
    if (!item) return errorJson("Cart item not found", 404);

    if (parsed.data.quantity === 0) {
      await prisma.cartItem.delete({ where: { id: parsed.data.itemId } });
    } else {
      await prisma.cartItem.update({
        where: { id: parsed.data.itemId },
        data: { quantity: parsed.data.quantity },
      });
    }

    return safeJson({ success: true });
  } catch {
    return errorJson("Failed to update cart", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentCustomer();
    const itemId = req.nextUrl.searchParams.get("itemId");
    if (!itemId) return errorJson("itemId required", 400);

    const cart = await getOrCreateCart(user?.id);
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) return errorJson("Cart item not found", 404);

    await prisma.cartItem.delete({ where: { id: itemId } });
    return safeJson({ success: true });
  } catch {
    return errorJson("Failed to remove cart item", 500);
  }
}
