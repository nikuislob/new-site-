"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, discountPercent } from "@/lib/format";
import { useToast } from "@/components/providers/AppProviders";
import { cn } from "@/lib/utils";

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
  stockQuantity?: number;
  isTrending?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  discountPercent?: number;
}

interface ProductCardProps {
  product: ProductCardData;
  showQuickAdd?: boolean;
  priority?: boolean;
  dense?: boolean;
}

function stockHint(inStock: boolean, qty?: number): string | null {
  if (!inStock) return "Out of stock";
  if (qty != null && qty > 0 && qty <= 5) return `Only ${qty} left`;
  if (inStock) return "In stock";
  return null;
}

export function ProductCard({
  product,
  showQuickAdd = true,
  priority,
  dense = true,
}: ProductCardProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const discount = product.discountPercent ?? discountPercent(product.originalPrice, product.sellingPrice);
  const inStock = product.inStock !== false;
  const hint = stockHint(inStock, product.stockQuantity);

  const displayBadges = [
    ...(discount >= 15 ? ["Hot Deal"] : []),
    ...(product.isTrending ? ["Trending"] : []),
    ...(product.isBestSeller ? ["Best Seller"] : []),
    ...(product.isNewArrival ? ["New"] : []),
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
    <article
      className={cn(
        "product-card group overflow-hidden rounded-md border border-[var(--line)] bg-white transition hover:border-[var(--brand)]/30 hover:shadow-md",
        dense && "product-card--dense"
      )}
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-[var(--surface)]">
          <Image
            src={product.mainImage}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 20vw"
            className="object-contain p-2 transition duration-300 group-hover:scale-[1.02]"
            priority={priority}
          />
          {displayBadges.length > 0 ? (
            <div className="absolute left-1.5 top-1.5 flex flex-wrap gap-1">
              {displayBadges.map((b) => (
                <Badge key={b} className="!px-1.5 !py-0.5 !text-[9px]">
                  {b}
                </Badge>
              ))}
            </div>
          ) : null}
          {discount > 0 ? (
            <span className="absolute right-1.5 top-1.5 rounded bg-[var(--accent)] px-1.5 py-0.5 text-[9px] font-bold text-white">
              -{discount}%
            </span>
          ) : null}
        </div>

        <div className="p-2.5">
          {product.brand ? (
            <p className="truncate text-[10px] font-medium uppercase tracking-wide text-[var(--ink-muted)]">
              {product.brand.name}
            </p>
          ) : null}
          <h3 className="mt-0.5 line-clamp-2 min-h-[2.4em] text-xs font-semibold leading-snug text-[var(--ink)] sm:text-[13px]">
            {product.name}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-1.5">
            <span className="font-display text-sm font-bold text-[var(--ink)] sm:text-base">
              {formatCurrency(product.sellingPrice)}
            </span>
            {discount > 0 ? (
              <>
                <span className="text-[11px] text-[var(--ink-muted)] line-through">
                  {formatCurrency(product.originalPrice)}
                </span>
                <span className="text-[10px] font-bold text-[var(--accent)]">-{discount}%</span>
              </>
            ) : null}
          </div>
          {hint ? (
            <p
              className={cn(
                "mt-1 text-[10px] font-medium",
                inStock ? "text-[var(--success)]" : "text-[var(--danger)]"
              )}
            >
              {hint}
            </p>
          ) : null}
        </div>
      </Link>

      {showQuickAdd ? (
        <div className="border-t border-[var(--line)]/80 px-2 pb-2 pt-1.5">
          <Button
            variant={inStock ? "primary" : "secondary"}
            fullWidth
            loading={loading}
            disabled={!inStock}
            onClick={addToCart}
            className="h-8 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            {inStock ? "Add" : "Unavailable"}
          </Button>
        </div>
      ) : null}
    </article>
  );
}
