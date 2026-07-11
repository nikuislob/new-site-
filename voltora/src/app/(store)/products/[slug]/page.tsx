import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { prisma } from "@/lib/db";
import { ProductGallery } from "@/components/product/ProductGallery";
import { AddToCartPanel } from "@/components/product/AddToCartPanel";
import { ProductCard } from "@/components/product/ProductCard";
import { Badge } from "@/components/ui/Badge";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  return {
    title: product.name,
    description: product.shortDescription,
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: [{ url: product.mainImage }],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  await prisma.product.update({
    where: { id: product.id },
    data: { viewCount: { increment: 1 } },
  });

  const related = await getRelatedProducts(product.relatedIds);
  const specs = product.specifications;

  const galleryImages = [
    { url: product.mainImage, alt: product.name },
    ...product.images.map((img) => ({ id: img.id, url: img.url, alt: img.alt })),
  ];

  return (
    <div className="container-page py-8 sm:py-12">
      <nav className="mb-6 text-sm text-[var(--ink-muted)] animate-fade-up">
        <Link href="/products" className="hover:text-[var(--ink)]">
          Products
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/category/${product.category.slug}`} className="hover:text-[var(--ink)]">
          {product.category.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--ink)]">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={galleryImages} productName={product.name} />

        <div>
          <div className="animate-fade-up">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
              {product.brand.name}
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{product.name}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.badges.map((b) => (
                <Badge key={b}>{b}</Badge>
              ))}
              <Badge variant="default">{product.condition.replace("_", " ")}</Badge>
            </div>
            <p className="mt-4 text-[var(--ink-muted)]">{product.shortDescription}</p>
          </div>

          <div className="mt-6">
            <AddToCartPanel
              productId={product.id}
              productSlug={product.slug}
              name={product.name}
              sellingPrice={product.sellingPrice}
              originalPrice={product.originalPrice}
              stockQuantity={product.stockQuantity}
              inStock={product.inStock}
              variants={product.variants}
              deliveryEstimate={product.deliveryEstimate}
            />
          </div>
        </div>
      </div>

      <section className="mt-14 grid gap-8 lg:grid-cols-2 animate-fade-up">
        <div>
          <h2 className="font-display text-xl font-semibold">Description</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--ink-muted)]">
            {product.fullDescription}
          </p>
        </div>
        {Object.keys(specs).length > 0 ? (
          <div>
            <h2 className="font-display text-xl font-semibold">Specifications</h2>
            <dl className="mt-3 divide-y divide-[var(--line)] rounded-[var(--radius)] border border-[var(--line)] bg-white">
              {Object.entries(specs).map(([key, value]) => (
                <div key={key} className="grid grid-cols-2 gap-4 px-4 py-3 text-sm">
                  <dt className="font-medium text-[var(--ink-muted)]">{key}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </section>

      {related.length > 0 ? (
        <section className="mt-14">
          <h2 className="mb-6 font-display text-2xl font-bold">You may also like</h2>
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
