import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";

interface ProductRailProps {
  title: string;
  subtitle?: string;
  products: ProductCardData[];
  viewAllHref?: string;
  layout?: "rail" | "grid";
  highlightDeals?: boolean;
}

export function ProductRail({
  title,
  subtitle,
  products,
  viewAllHref,
  layout = "grid",
  highlightDeals,
}: ProductRailProps) {
  if (products.length === 0) return null;

  return (
    <section className="home-section">
      <div className="container-page">
        <div className="home-section-header">
          <div>
            <h2 className="home-section-title flex items-center gap-2">
              {highlightDeals ? (
                <Flame className="h-5 w-5 text-[var(--accent)]" aria-hidden />
              ) : null}
              {title}
            </h2>
            {subtitle ? <p className="mt-0.5 text-xs text-[var(--ink-muted)]">{subtitle}</p> : null}
          </div>
          {viewAllHref ? (
            <Link
              href={viewAllHref}
              className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--brand-deep)] hover:underline"
            >
              See all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>

        {layout === "rail" ? (
          <div className="product-grid--rail">
            {products.map((product, i) => (
              <div key={product.id}>
                <ProductCard product={product} priority={i < 2} />
              </div>
            ))}
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 4} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
