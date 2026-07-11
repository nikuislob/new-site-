import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { listProducts } from "@/lib/products";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductFilters } from "@/components/product/ProductFilters";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export const metadata = {
  title: "All Products",
  description: "Browse Voltora's full catalog of premium electronics.",
};

export default async function ProductsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Number(param(sp.page)) || 1;
  const minPrice = param(sp.minPrice) ? Number(param(sp.minPrice)) : undefined;
  const maxPrice = param(sp.maxPrice) ? Number(param(sp.maxPrice)) : undefined;

  const [result, categories, brands] = await Promise.all([
    listProducts({
      categorySlug: param(sp.category),
      brandSlug: param(sp.brand),
      minPrice,
      maxPrice,
      condition: param(sp.condition),
      availability: param(sp.availability),
      badge: param(sp.badge),
      sort: param(sp.sort),
      q: param(sp.q),
      page,
      limit: 24,
    }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="mb-8 animate-fade-up">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">All products</h1>
        <p className="mt-2 text-[var(--ink-muted)]">
          {result.pagination.total} items · Premium US electronics
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Suspense fallback={<div className="skeleton h-96" />}>
          <ProductFilters
            categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
            brands={brands.map((b) => ({ id: b.id, name: b.name, slug: b.slug }))}
          />
        </Suspense>

        <div>
          {result.products.length === 0 ? (
            <p className="rounded-[var(--radius)] border border-dashed border-[var(--line)] p-12 text-center text-[var(--ink-muted)]">
              No products match your filters.
            </p>
          ) : (
            <div className="product-grid">
              {result.products.map((product, i) => (
                <div key={product.id} className="animate-fade-up" style={{ animationDelay: `${(i % 8) * 0.04}s` }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}

          {result.pagination.pages > 1 ? (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: result.pagination.pages }, (_, i) => i + 1)
                .slice(0, 8)
                .map((p) => (
                  <a
                    key={p}
                    href={`/products?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, param(v) || ""])), page: String(p) }).toString()}`}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                      p === page ? "bg-[var(--brand)] text-[#04241f]" : "bg-white text-[var(--ink-muted)]"
                    }`}
                  >
                    {p}
                  </a>
                ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
