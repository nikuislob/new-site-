import { getSettings } from "@/lib/settings";
import { safeJson } from "@/lib/utils";

export async function GET() {
  const settings = await getSettings([
    "store_name",
    "store_tagline",
    "hero_headline",
    "hero_subcopy",
    "announcement",
    "footer_disclaimer",
    "max_tickets_per_order",
    "support_welcome",
  ]);
  return safeJson({ settings });
}
