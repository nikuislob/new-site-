import { getSettings } from "@/lib/settings";
import { listProducts } from "@/lib/products";
import { prisma } from "@/lib/db";
import { Hero } from "@/components/home/Hero";
import { ProductRail } from "@/components/home/ProductRail";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { PromoBanners } from "@/components/home/PromoBanners";
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
    "why_shop_title",
    "delivery_text",
    "support_text",
    "free_shipping_threshold",
    "newsletter_text",
  ]);

  const [featured, trending, bestSellers, newArrivals, categories] = await Promise.all([
    listProducts({ featured: true, limit: 8 }),
    listProducts({ trending: true, limit: 8 }),
    listProducts({ bestSeller: true, limit: 8 }),
    listProducts({ newArrival: true, limit: 8 }),
    prisma.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 8,
    }),
  ]);

  const promoBanners = [
    {
      title: settings.promo_banner_1_title,
      text: settings.promo_banner_1_text,
      link: settings.promo_banner_1_link,
      image: settings.promo_banner_1_image,
    },
    {
      title: settings.promo_banner_2_title,
      text: settings.promo_banner_2_text,
      link: settings.promo_banner_2_link,
      image: settings.promo_banner_2_image,
    },
  ].filter((b) => b.title);

  return (
    <>
      <Hero
        storeName={settings.store_name}
        title={settings.hero_title}
        subtitle={settings.hero_subtitle}
        ctaText={settings.hero_cta_text}
        ctaLink={settings.hero_cta_link}
        secondaryCtaText={settings.hero_secondary_cta_text}
        secondaryCtaLink={settings.hero_secondary_cta_link}
        imageUrl={settings.hero_image}
        countdownEnds={settings.deal_countdown_ends || undefined}
      />

      <CategoryGrid categories={categories} />

      <ProductRail
        title="Trending now"
        subtitle="What US shoppers are loving this week"
        products={trending.products}
        viewAllHref="/products?sort=popular"
        layout="rail"
      />

      <PromoBanners banners={promoBanners} />

      <ProductRail
        title="Featured picks"
        products={featured.products}
        viewAllHref="/products"
      />

      <ProductRail
        title="Best sellers"
        products={bestSellers.products}
        viewAllHref="/products?sort=popular"
        layout="rail"
      />

      <ProductRail
        title="New arrivals"
        products={newArrivals.products}
        viewAllHref="/products?sort=newest"
      />

      <WhyShop
        title={settings.why_shop_title}
        deliveryText={settings.delivery_text}
        supportText={settings.support_text}
        freeShippingThreshold={settings.free_shipping_threshold}
      />

      <NewsletterForm description={settings.newsletter_text} />
    </>
  );
}
