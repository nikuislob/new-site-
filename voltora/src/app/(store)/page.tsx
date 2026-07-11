import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { listProducts } from "@/lib/products";
import { prisma } from "@/lib/db";
import { Hero, type HeroSlide } from "@/components/home/Hero";
import { ProductRail } from "@/components/home/ProductRail";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { WhyShop } from "@/components/home/WhyShop";
import { NewsletterForm } from "@/components/home/NewsletterForm";

export default async function HomePage() {
  const settings = await getSettings([
    "store_name",
    "hero_title",
    "hero_subtitle",
    "hero_cta_text",
    "hero_cta_link",
    "hero_secondary_cta_text",
    "hero_secondary_cta_link",
    "hero_image",
    "deal_countdown_ends",
    "promo_banner_1_title",
    "promo_banner_1_text",
    "promo_banner_1_link",
    "promo_banner_1_image",
    "promo_banner_2_title",
    "promo_banner_2_text",
    "promo_banner_2_link",
    "promo_banner_2_image",
    "promo_banner_3_title",
    "promo_banner_3_text",
    "promo_banner_3_link",
    "promo_banner_3_image",
    "why_shop_title",
    "delivery_text",
    "support_text",
    "free_shipping_threshold",
    "newsletter_text",
  ]);

  const [trending, bestSellers, newArrivals, dealPool, categories, brands] = await Promise.all([
    listProducts({ trending: true, limit: 10 }),
    listProducts({ bestSeller: true, limit: 10 }),
    listProducts({ newArrival: true, limit: 10 }),
    listProducts({ limit: 48, sort: "popular" }),
    prisma.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 12,
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      take: 12,
    }),
  ]);

  const todaysDeals = [...dealPool.products]
    .filter((p) => p.discountPercent > 0)
    .sort((a, b) => b.discountPercent - a.discountPercent)
    .slice(0, 10);

  const heroSlides: HeroSlide[] = [];

  if (settings.hero_title && settings.hero_image) {
    heroSlides.push({
      title: settings.hero_title,
      subtitle: settings.hero_subtitle,
      ctaText: settings.hero_cta_text,
      ctaLink: settings.hero_cta_link,
      secondaryCtaText: settings.hero_secondary_cta_text || undefined,
      secondaryCtaLink: settings.hero_secondary_cta_link || undefined,
      imageUrl: settings.hero_image,
      countdownEnds: settings.deal_countdown_ends || undefined,
      badge: "Featured",
    });
  }

  if (settings.promo_banner_1_title && settings.promo_banner_1_image) {
    heroSlides.push({
      title: settings.promo_banner_1_title,
      subtitle: settings.promo_banner_1_text,
      ctaText: "Shop deal",
      ctaLink: settings.promo_banner_1_link || "/products?deals=1",
      imageUrl: settings.promo_banner_1_image,
      badge: "Today's Deal",
    });
  }

  if (settings.promo_banner_2_title && settings.promo_banner_2_image) {
    heroSlides.push({
      title: settings.promo_banner_2_title,
      subtitle: settings.promo_banner_2_text,
      ctaText: "Shop now",
      ctaLink: settings.promo_banner_2_link || "/products",
      imageUrl: settings.promo_banner_2_image,
      badge: "Limited time",
    });
  }

  if (settings.promo_banner_3_title && settings.promo_banner_3_image) {
    heroSlides.push({
      title: settings.promo_banner_3_title,
      subtitle: settings.promo_banner_3_text,
      ctaText: "Browse",
      ctaLink: settings.promo_banner_3_link || "/products",
      imageUrl: settings.promo_banner_3_image,
    });
  }

  return (
    <>
      <Hero slides={heroSlides} />

      <CategoryGrid categories={categories} title="Shop by category" layout="scroll" />

      <ProductRail
        title="Today's Deals"
        subtitle="Top discounts — updated daily"
        products={todaysDeals}
        viewAllHref="/products?deals=1"
        layout="rail"
        highlightDeals
      />

      <ProductRail
        title="Trending"
        subtitle="Popular picks this week"
        products={trending.products}
        viewAllHref="/products?sort=popular"
        layout="rail"
      />

      <ProductRail
        title="Best Sellers"
        products={bestSellers.products}
        viewAllHref="/products?sort=popular"
        layout="grid"
      />

      <ProductRail
        title="New Arrivals"
        products={newArrivals.products}
        viewAllHref="/products?sort=newest"
        layout="rail"
      />

      {brands.length > 0 ? (
        <section className="home-section border-y border-[var(--line)] bg-white py-5">
          <div className="container-page">
            <div className="home-section-header">
              <h2 className="home-section-title">Featured brands</h2>
              <Link
                href="/products"
                className="text-xs font-semibold text-[var(--brand-deep)] hover:underline"
              >
                Shop all brands
              </Link>
            </div>
            <div className="brands-strip">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/products?brand=${brand.slug}`}
                  className="brand-pill"
                >
                  {brand.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <div id="why-shop">
        <WhyShop
          title={settings.why_shop_title}
          deliveryText={settings.delivery_text}
          supportText={settings.support_text}
          freeShippingThreshold={settings.free_shipping_threshold}
        />
      </div>

      <NewsletterForm description={settings.newsletter_text} />
    </>
  );
}
