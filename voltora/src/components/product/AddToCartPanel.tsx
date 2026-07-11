"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrency, discountPercent } from "@/lib/format";
import { useToast } from "@/components/providers/AppProviders";
import { cn } from "@/lib/utils";

interface Variant {
  id: string;
  name: string;
  color?: string | null;
  storage?: string | null;
  priceModifier: number;
  stockQuantity: number;
  inStock: boolean;
  imageUrl?: string | null;
}

interface AddToCartPanelProps {
  productId: string;
  productSlug: string;
  name: string;
  sellingPrice: number;
  originalPrice: number;
  stockQuantity: number;
  inStock: boolean;
  variants?: Variant[];
  deliveryEstimate?: string;
}

export function AddToCartPanel({
  productId,
  productSlug,
  name,
  sellingPrice,
  originalPrice,
  stockQuantity,
  inStock,
  variants = [],
  deliveryEstimate,
}: AddToCartPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants.find((v) => v.inStock)?.id || variants[0]?.id || null
  );
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState<"cart" | "buy" | "wishlist" | null>(null);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const unitPrice = sellingPrice + (selectedVariant?.priceModifier || 0);
  const availableStock = selectedVariant ? selectedVariant.stockQuantity : stockQuantity;
  const canPurchase = inStock && availableStock > 0;
  const discount = discountPercent(originalPrice, unitPrice);

  const variantGroups = useMemo(() => {
    const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))] as string[];
    const storages = [...new Set(variants.map((v) => v.storage).filter(Boolean))] as string[];
    return { colors, storages };
  }, [variants]);

  const addToCart = async (redirectToCheckout = false) => {
    if (!canPurchase) return;
    setLoading(redirectToCheckout ? "buy" : "cart");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          variantId: selectedVariantId,
          quantity: Math.min(qty, availableStock),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      window.dispatchEvent(new Event("voltora:cart-updated"));
      toast(redirectToCheckout ? "Proceeding to checkout" : "Added to cart", "success");
      if (redirectToCheckout) router.push("/checkout");
    } catch {
      toast("Could not update cart", "error");
    } finally {
      setLoading(null);
    }
  };

  const toggleWishlist = async () => {
    setLoading("wishlist");
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.status === 401) {
        router.push(`/account/login?next=/products/${productSlug}`);
        return;
      }
      if (!res.ok) throw new Error("Failed");
      toast("Saved to wishlist", "success");
    } catch {
      toast("Could not update wishlist", "error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="card-surface p-5 sm:p-6 animate-fade-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-end gap-2">
            <span className="font-display text-3xl font-bold">{formatCurrency(unitPrice)}</span>
            {discount > 0 ? (
              <span className="text-base text-[var(--ink-muted)] line-through">
                {formatCurrency(originalPrice + (selectedVariant?.priceModifier || 0))}
              </span>
            ) : null}
          </div>
          {discount > 0 ? (
            <p className="mt-1 text-sm font-semibold text-[var(--accent)]">Save {discount}% today</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={toggleWishlist}
          disabled={loading === "wishlist"}
          className="rounded-full border border-[var(--line)] p-2.5 text-[var(--ink-muted)] transition hover:border-[var(--brand)] hover:text-[var(--brand-deep)]"
          aria-label="Add to wishlist"
        >
          <Heart className="h-5 w-5" />
        </button>
      </div>

      {variants.length > 0 ? (
        <div className="mt-5 space-y-4">
          {variantGroups.colors.length > 0 ? (
            <div>
              <p className="label">Color</p>
              <div className="flex flex-wrap gap-2">
                {variantGroups.colors.map((color) => {
                  const variant = variants.find((v) => v.color === color && v.inStock) || variants.find((v) => v.color === color);
                  return (
                    <button
                      key={color}
                      type="button"
                      disabled={!variant?.inStock}
                      onClick={() => variant && setSelectedVariantId(variant.id)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                        selectedVariant?.color === color
                          ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[#067260]"
                          : "border-[var(--line)] text-[var(--ink-muted)] hover:border-[#b8c7db]",
                        !variant?.inStock && "opacity-40"
                      )}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {variantGroups.storages.length > 0 ? (
            <div>
              <p className="label">Storage</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    disabled={!v.inStock}
                    onClick={() => setSelectedVariantId(v.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                      selectedVariantId === v.id
                        ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[#067260]"
                        : "border-[var(--line)] text-[var(--ink-muted)] hover:border-[#b8c7db]",
                      !v.inStock && "opacity-40"
                    )}
                  >
                    {v.storage || v.name}
                    {v.priceModifier > 0 ? ` (+${formatCurrency(v.priceModifier)})` : ""}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5">
        <p className="label">Quantity</p>
        <div className="inline-flex items-center rounded-full border border-[var(--line)] bg-white">
          <button
            type="button"
            className="rounded-full p-2.5 text-[var(--ink-muted)] hover:text-[var(--ink)]"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-10 text-center font-semibold">{qty}</span>
          <button
            type="button"
            className="rounded-full p-2.5 text-[var(--ink-muted)] hover:text-[var(--ink)]"
            onClick={() => setQty((q) => Math.min(availableStock, q + 1))}
            aria-label="Increase quantity"
            disabled={qty >= availableStock}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--ink-muted)]">
          {canPurchase ? `${availableStock} available` : "Currently unavailable"}
          {deliveryEstimate ? ` · Ships in ${deliveryEstimate}` : ""}
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <Button fullWidth loading={loading === "cart"} disabled={!canPurchase} onClick={() => addToCart(false)}>
          <ShoppingBag className="h-4 w-4" />
          Add to cart
        </Button>
        <Button
          variant="dark"
          fullWidth
          loading={loading === "buy"}
          disabled={!canPurchase}
          onClick={() => addToCart(true)}
        >
          <Zap className="h-4 w-4" />
          Buy now
        </Button>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-[var(--ink-muted)]">
        Secure checkout · {name} ships from US inventory when in stock
      </p>
    </div>
  );
}
