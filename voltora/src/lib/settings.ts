import { prisma } from "./db";

const DEFAULTS: Record<string, string> = {
  store_name: "Voltora",
  store_tagline: "Premium electronics. Delivered.",
  announcement_bar: "Free shipping on orders over $15 · Easy 30-day returns · US-based support",
  announcement_enabled: "true",
  hero_title: "Tech that keeps up with you",
  hero_subtitle: "Shop trending smartphones, laptops, audio, gaming, and smart home gear — curated for US customers.",
  hero_cta_text: "Shop bestsellers",
  hero_cta_link: "/products?sort=popular",
  hero_image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1600&q=80",
  hero_secondary_cta_text: "Browse deals",
  hero_secondary_cta_link: "/products?badge=Hot%20Deal",
  promo_banner_1_title: "Limited-time laptop deals",
  promo_banner_1_text: "Save on certified devices built for work and play.",
  promo_banner_1_link: "/category/laptops",
  promo_banner_1_image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&q=80",
  promo_banner_2_title: "Immersive audio, sharper prices",
  promo_banner_2_text: "Wireless earbuds and headphones from top brands.",
  promo_banner_2_link: "/category/headphones",
  promo_banner_2_image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80",
  deal_countdown_ends: "",
  why_shop_title: "Why shop Voltora",
  delivery_text: "Most in-stock items ship within 1 business day. Typical delivery is 3–5 business days across the continental US when inventory and destination allow.",
  support_text: "US-based customer support available via live chat and email. We never ask for passwords, banking credentials, or card CVV.",
  footer_about: "Voltora is a modern US electronics marketplace for trending devices, accessories, and carefully listed open-box gear.",
  contact_email: "support@voltora.example",
  contact_phone: "1-800-555-0188",
  newsletter_text: "Get product drops, deal alerts, and setup tips — no spam.",
  global_delivery_estimate: "3–5 business days",
  free_shipping_threshold: "15",
  flat_shipping_rate: "2.99",
  return_policy: "Most items may be returned within 30 days of delivery in original condition. Opened software and personalized items may be excluded.",
  shipping_policy: "Orders placed before 2 PM ET on business days typically ship the same day when in stock. Delivery estimates are shown per product.",
};

export async function getSetting(key: string): Promise<string> {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  return row?.value ?? DEFAULTS[key] ?? "";
}

export async function getSettings(keys?: string[]): Promise<Record<string, string>> {
  const rows = await prisma.siteSetting.findMany({
    where: keys ? { key: { in: keys } } : undefined,
  });
  const map: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) map[row.key] = row.value;
  if (keys) {
    const filtered: Record<string, string> = {};
    for (const k of keys) filtered[k] = map[k] ?? "";
    return filtered;
  }
  return map;
}

export async function setSetting(key: string, value: string) {
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function setSettings(entries: Record<string, string>) {
  for (const [key, value] of Object.entries(entries)) {
    await setSetting(key, value);
  }
}

export { DEFAULTS as DEFAULT_SETTINGS };
