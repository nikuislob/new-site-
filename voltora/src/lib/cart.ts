import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { prisma } from "./db";

export async function getOrCreateCart(userId?: string | null) {
  if (userId) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: { include: { brand: true, images: true } },
            variant: true,
          },
        },
      },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: { include: { brand: true, images: true } },
              variant: true,
            },
          },
        },
      });
    }
    return cart;
  }

  const jar = await cookies();
  let sessionId = jar.get("voltora_cart")?.value;
  if (!sessionId) {
    sessionId = nanoid();
    jar.set("voltora_cart", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  let cart = await prisma.cart.findUnique({
    where: { sessionId },
    include: {
      items: {
        include: {
          product: { include: { brand: true, images: true } },
          variant: true,
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { sessionId },
      include: {
        items: {
          include: {
            product: { include: { brand: true, images: true } },
            variant: true,
          },
        },
      },
    });
  }

  return cart;
}

export async function mergeGuestCart(userId: string) {
  const jar = await cookies();
  const sessionId = jar.get("voltora_cart")?.value;
  if (!sessionId) return;

  const guestCart = await prisma.cart.findUnique({
    where: { sessionId },
    include: { items: true },
  });
  if (!guestCart || guestCart.items.length === 0) return;

  const userCart = await getOrCreateCart(userId);

  for (const item of guestCart.items) {
    const existing = userCart.items.find(
      (i) => i.productId === item.productId && i.variantId === item.variantId
    );
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + item.quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        },
      });
    }
  }

  await prisma.cart.delete({ where: { id: guestCart.id } });
  jar.delete("voltora_cart");
}

export function cartTotals(
  items: Array<{
    quantity: number;
    product: { sellingPrice: number; stockQuantity: number; isActive: boolean };
    variant?: { priceModifier: number; stockQuantity: number; isActive: boolean } | null;
  }>,
  discountAmount = 0,
  shippingAmount = 0
) {
  const availableItems = items.filter((i) => {
    if (!i.product.isActive) return false;
    if (i.variant && !i.variant.isActive) return false;
    const stock = i.variant ? i.variant.stockQuantity : i.product.stockQuantity;
    return stock > 0;
  });

  const subtotal = availableItems.reduce((sum, i) => {
    const price = i.product.sellingPrice + (i.variant?.priceModifier || 0);
    const stock = i.variant ? i.variant.stockQuantity : i.product.stockQuantity;
    const qty = Math.min(i.quantity, stock);
    return sum + price * qty;
  }, 0);

  const discount = Math.min(discountAmount, subtotal);
  const total = Math.max(0, subtotal - discount + shippingAmount);

  return { subtotal, discount, shippingAmount, total, itemCount: availableItems.reduce((n, i) => n + i.quantity, 0) };
}

export async function applyCoupon(code: string | null | undefined, subtotal: number) {
  if (!code) return { discount: 0, coupon: null as null | { code: string; description: string | null } };
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon || !coupon.isActive) throw new Error("Invalid coupon code");
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new Error("Coupon has expired");
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) throw new Error("Coupon usage limit reached");
  if (subtotal < coupon.minOrderAmount) {
    throw new Error(`Minimum order of $${coupon.minOrderAmount.toFixed(2)} required for this coupon`);
  }

  let discount = 0;
  if (coupon.discountType === "percent") {
    discount = (subtotal * coupon.discountValue) / 100;
  } else {
    discount = coupon.discountValue;
  }
  discount = Math.min(discount, subtotal);

  return {
    discount: Math.round(discount * 100) / 100,
    coupon: { code: coupon.code, description: coupon.description },
  };
}
