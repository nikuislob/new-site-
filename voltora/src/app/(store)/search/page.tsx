import { listProducts } from "@/lib/products";
import { ProductCard } from "@/components/product/ProductCard";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps) {
  const { q } = await searchParams;
  return {
    title: q ? `Search: ${q}` : "Search",
    description: "Search Voltora's premium electronics catalog.",
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  const result = query
    ? await listProducts({ q: query, limit: 48 })
    : { products: [], pagination: { total: 0 } };

  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="font-display text-3xl font-bold animate-fade-up">
        {query ? `Results for “${query}”` : "Search"}
      </h1>
      <p className="mt-2 text-[var(--ink-muted)]">
        {query ? `${result.pagination.total} products found` : "Enter a search term in the header to find products."}
      </p>

      {query && result.products.length > 0 ? (
        <div className="product-grid mt-8">
          {result.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : query ? (
        <p className="mt-12 text-center text-[var(--ink-muted)]">No products matched your search.</p>
      ) : null}
    </div>
  );
}
