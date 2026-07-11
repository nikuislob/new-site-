import Link from "next/link";
import { prisma } from "@/lib/db";
import { getOrCreateCart, cartTotals, applyCoupon } from "@/lib/cart";
import { getSettings } from "@/lib/settings";
import { getCurrentCustomer } from "@/lib/auth";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ShoppingBag } from "lucide-react";

export const metadata = {
  title: "Checkout",
  description: "Complete your Voltora order.",
};

export default async function CheckoutPage() {
  const user = await getCurrentCustomer();
  const cart = await getOrCreateCart(user?.id);

  if (cart.items.length === 0) {
    return (
      <div className="container-page py-8 sm:py-12">
        <EmptyState
          icon={ShoppingBag}
          title="Nothing to checkout"
          description="Add items to your cart before checking out."
          action={
            <Link href="/products">
              <Button>Browse products</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const settings = await getSettings(["free_shipping_threshold", "flat_shipping_rate"]);
  const freeThreshold = Number(settings.free_shipping_threshold || 75);
  const flatRate = Number(settings.flat_shipping_rate || 6.99);

  let discountAmount = 0;
  if (cart.couponCode) {
    try {
      const { discount } = await applyCoupon(cart.couponCode, cartTotals(cart.items).subtotal);
      discountAmount = discount;
    } catch {
      /* ignore invalid coupon at checkout */
    }
  }

  const subtotalResult = cartTotals(cart.items);
  const shippingAmount = subtotalResult.subtotal - discountAmount >= freeThreshold ? 0 : flatRate;
  const totals = cartTotals(cart.items, discountAmount, shippingAmount);

  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { isActive: true },
    orderBy: { slot: "asc" },
  });

  const summary = {
    items: cart.items.map((item) => {
      const unitPrice = item.product.sellingPrice + (item.variant?.priceModifier || 0);
      return {
        productName: item.product.name,
        variantName: item.variant?.name,
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
        imageUrl: item.product.mainImage,
      };
    }),
    totals: {
      subtotal: totals.subtotal,
      discount: totals.discount,
      shippingAmount: totals.shippingAmount,
      total: totals.total,
    },
  };

  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="mb-8 font-display text-3xl font-bold animate-fade-up">Checkout</h1>
      <CheckoutForm
        cart={summary}
        paymentMethods={paymentMethods.map((m) => ({
          id: m.id,
          slot: m.slot,
          name: m.name,
          iconUrl: m.iconUrl,
          paymentUrl: m.paymentUrl,
          buttonText: m.buttonText,
          instructions: m.instructions,
        }))}
        defaultEmail={user?.email || ""}
        defaultName={user ? `${user.firstName} ${user.lastName}` : ""}
        defaultPhone={user?.phone || ""}
      />
    </div>
  );
}
