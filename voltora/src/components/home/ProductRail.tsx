import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";

interface ProductRailProps {
  title: string;
  subtitle?: string;
  products: ProductCardData[];
  viewAllHref?: string;
  layout?: "rail" | "grid";
}

export function ProductRail({
  title,
  subtitle,
  products,
  viewAllHref,
  layout = "grid",
}: ProductRailProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-10 sm:py-14">
      <div className="container-page">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div className="animate-fade-up">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-[var(--ink-muted)]">{subtitle}</p> : null}
          </div>
          {viewAllHref ? (
            <Link
              href={viewAllHref}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[var(--brand-deep)] hover:underline"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>

        {layout === "rail" ? (
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory sm:-mx-0 sm:px-0">
            {products.map((product, i) => (
              <div key={product.id} className="w-[min(280px,78vw)] shrink-0 snap-start animate-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
                <ProductCard product={product} priority={i < 2} />
              </div>
            ))}
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product, i) => (
              <div key={product.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <ProductCard product={product} priority={i < 4} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
