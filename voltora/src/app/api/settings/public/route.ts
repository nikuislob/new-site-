import { getSettings } from "@/lib/settings";
import { safeJson, errorJson } from "@/lib/utils";

const PUBLIC_KEYS = [
  "store_name",
  "store_tagline",
  "announcement_bar",
  "announcement_enabled",
  "hero_title",
  "hero_subtitle",
  "hero_cta_text",
  "hero_cta_link",
  "hero_image",
  "hero_secondary_cta_text",
  "hero_secondary_cta_link",
  "promo_banner_1_title",
  "promo_banner_1_text",
  "promo_banner_1_link",
  "promo_banner_1_image",
  "promo_banner_2_title",
  "promo_banner_2_text",
  "promo_banner_2_link",
  "promo_banner_2_image",
  "deal_countdown_ends",
  "why_shop_title",
  "delivery_text",
  "support_text",
  "footer_about",
  "contact_email",
  "contact_phone",
  "newsletter_text",
  "global_delivery_estimate",
  "free_shipping_threshold",
  "flat_shipping_rate",
  "return_policy",
  "shipping_policy",
];

export async function GET() {
  try {
    const settings = await getSettings(PUBLIC_KEYS);
    return safeJson({ settings });
  } catch {
    return errorJson("Failed to fetch settings", 500);
  }
}
