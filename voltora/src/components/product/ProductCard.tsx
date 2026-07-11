"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, discountPercent } from "@/lib/format";
import { useToast } from "@/components/providers/AppProviders";

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  mainImage: string;
  originalPrice: number;
  sellingPrice: number;
  brand?: { name: string };
  badges?: string[];
  inStock?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  discountPercent?: number;
}

interface ProductCardProps {
  product: ProductCardData;
  showQuickAdd?: boolean;
  priority?: boolean;
}

export function ProductCard({ product, showQuickAdd = true, priority }: ProductCardProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const discount = product.discountPercent ?? discountPercent(product.originalPrice, product.sellingPrice);
  const inStock = product.inStock !== false;

  const displayBadges = [
    ...(product.isTrending ? ["Trending"] : []),
    ...(product.isBestSeller ? ["Best Seller"] : []),
    ...(product.isNewArrival ? ["New Arrival"] : []),
    ...(product.badges || []),
  ].slice(0, 2);

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      if (!res.ok) throw new Error("Failed to add");
      window.dispatchEvent(new Event("voltora:cart-updated"));
      toast("Added to cart", "success");
    } catch {
      toast("Could not add to cart", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="group card-surface overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(12,20,36,0.14)]">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-[var(--surface)]">
          <Image
            src={product.mainImage}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            priority={priority}
          />
          {displayBadges.length > 0 ? (
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              {displayBadges.map((b) => (
                <Badge key={b}>{b}</Badge>
              ))}
            </div>
          ) : null}
          {discount > 0 ? (
            <span className="absolute right-3 top-3 rounded-full bg-[var(--accent)] px-2 py-1 text-[10px] font-bold text-white">
              -{discount}%
            </span>
          ) : null}
        </div>

        <div className="p-4">
          {product.brand ? (
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-muted)]">
              {product.brand.name}
            </p>
          ) : null}
          <h3 className="mt-1 line-clamp-2 font-display text-base font-semibold leading-snug text-[var(--ink)]">
            {product.name}
          </h3>
          <div className="mt-3 flex items-end gap-2">
            <span className="font-display text-lg font-bold text-[var(--ink)]">
              {formatCurrency(product.sellingPrice)}
            </span>
            {discount > 0 ? (
              <span className="text-sm text-[var(--ink-muted)] line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            ) : null}
          </div>
          {!inStock ? (
            <p className="mt-2 text-xs font-semibold text-[var(--danger)]">Out of stock</p>
          ) : null}
        </div>
      </Link>

      {showQuickAdd && inStock ? (
        <div className="border-t border-[var(--line)] px-4 py-3">
          <Button
            variant="secondary"
            fullWidth
            loading={loading}
            onClick={addToCart}
            className="text-sm"
          >
            <ShoppingBag className="h-4 w-4" />
            Quick add
          </Button>
        </div>
      ) : null}
    </article>
  );
}
