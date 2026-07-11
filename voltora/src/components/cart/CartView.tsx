"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/components/providers/AppProviders";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    mainImage: string;
    sellingPrice: number;
    stockQuantity: number;
    isActive: boolean;
  };
  variant?: {
    id: string;
    name: string;
    priceModifier: number;
    stockQuantity: number;
    isActive: boolean;
  } | null;
}

interface CartData {
  items: CartItem[];
  totals: {
    subtotal: number;
    discount: number;
    shippingAmount: number;
    total: number;
    itemCount: number;
  };
  couponCode?: string | null;
}

export function CartView() {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const loadCart = async () => {
    try {
      const res = await fetch("/api/cart");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setCart(data);
      setCoupon(data.couponCode || "");
      window.dispatchEvent(new Event("voltora:cart-updated"));
    } catch {
      toast("Could not load cart", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateItem = async (itemId: string, quantity: number) => {
    setUpdating(itemId);
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setCart(data);
      window.dispatchEvent(new Event("voltora:cart-updated"));
    } catch {
      toast("Could not update item", "error");
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setUpdating(itemId);
    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setCart(data);
      window.dispatchEvent(new Event("voltora:cart-updated"));
      toast("Item removed", "info");
    } catch {
      toast("Could not remove item", "error");
    } finally {
      setUpdating(null);
    }
  };

  const applyCoupon = async () => {
    try {
      const res = await fetch("/api/cart/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: coupon || "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Invalid coupon");
      // Reload full cart totals
      const cartRes = await fetch("/api/cart");
      const cartData = await cartRes.json();
      setCart(cartData);
      toast("Coupon applied", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Invalid coupon", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is empty"
        description="Browse our premium electronics and add something you love."
        action={
          <Link href="/products">
            <Button>Shop products</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {cart.items.map((item) => {
          const price = item.product.sellingPrice + (item.variant?.priceModifier || 0);
          const stock = item.variant?.stockQuantity ?? item.product.stockQuantity;
          const lineTotal = price * item.quantity;

          return (
            <article key={item.id} className="card-surface flex gap-4 p-4 sm:p-5">
              <Link href={`/products/${item.product.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[var(--surface)]">
                <Image src={item.product.mainImage} alt={item.product.name} fill className="object-cover" sizes="96px" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/products/${item.product.slug}`} className="font-display font-semibold hover:text-[var(--brand-deep)]">
                  {item.product.name}
                </Link>
                {item.variant ? (
                  <p className="mt-0.5 text-sm text-[var(--ink-muted)]">{item.variant.name}</p>
                ) : null}
                <p className="mt-2 font-semibold">{formatCurrency(price)}</p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center rounded-full border border-[var(--line)]">
                    <button
                      type="button"
                      className="p-2"
                      disabled={updating === item.id}
                      onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))}
                      aria-label="Decrease"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      type="button"
                      className="p-2"
                      disabled={updating === item.id || item.quantity >= stock}
                      onClick={() => updateItem(item.id, item.quantity + 1)}
                      aria-label="Increase"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-sm text-[var(--danger)]"
                    onClick={() => removeItem(item.id)}
                    disabled={updating === item.id}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                  <span className="ml-auto font-display font-bold">{formatCurrency(lineTotal)}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <aside className="card-surface h-fit p-5 lg:sticky lg:top-24">
        <h2 className="font-display text-xl font-semibold">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--ink-muted)]">Subtotal</dt>
            <dd className="font-medium">{formatCurrency(cart.totals.subtotal)}</dd>
          </div>
          {cart.totals.discount > 0 ? (
            <div className="flex justify-between text-[var(--success)]">
              <dt>Discount</dt>
              <dd>-{formatCurrency(cart.totals.discount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-[var(--ink-muted)]">Shipping</dt>
            <dd className="font-medium">
              {cart.totals.shippingAmount === 0 ? "Free" : formatCurrency(cart.totals.shippingAmount)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-[var(--line)] pt-3 text-base font-display font-bold">
            <dt>Total</dt>
            <dd>{formatCurrency(cart.totals.total)}</dd>
          </div>
        </dl>

        <div className="mt-5 flex gap-2">
          <Input
            placeholder="Coupon code"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
            className="text-sm"
          />
          <Button variant="secondary" onClick={applyCoupon} className="shrink-0">
            Apply
          </Button>
        </div>

        <Link href="/checkout" className="mt-5 block">
          <Button fullWidth>Proceed to checkout</Button>
        </Link>
        <Link href="/products" className="mt-3 block text-center text-sm text-[var(--ink-muted)] hover:text-[var(--ink)]">
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
