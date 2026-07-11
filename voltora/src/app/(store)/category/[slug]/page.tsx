import { notFound } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { listProducts } from "@/lib/products";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductFilters } from "@/components/product/ProductFilters";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  return {
    title: category?.name || "Category",
    description: category?.description || `Shop ${category?.name || "category"} at Voltora.`,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await prisma.category.findUnique({ where: { slug, isActive: true } });
  if (!category) notFound();

  const page = Number(param(sp.page)) || 1;
  const [result, categories, brands] = await Promise.all([
    listProducts({
      categorySlug: slug,
      brandSlug: param(sp.brand),
      minPrice: param(sp.minPrice) ? Number(param(sp.minPrice)) : undefined,
      maxPrice: param(sp.maxPrice) ? Number(param(sp.maxPrice)) : undefined,
      condition: param(sp.condition),
      availability: param(sp.availability),
      sort: param(sp.sort),
      page,
      limit: 24,
    }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="mb-8 animate-fade-up">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{category.name}</h1>
        {category.description ? (
          <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">{category.description}</p>
        ) : null}
        <p className="mt-2 text-sm text-[var(--ink-muted)]">{result.pagination.total} products</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Suspense fallback={<div className="skeleton h-96" />}>
          <ProductFilters
            categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
            brands={brands.map((b) => ({ id: b.id, name: b.name, slug: b.slug }))}
          />
        </Suspense>

        <div className="product-grid">
          {result.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
