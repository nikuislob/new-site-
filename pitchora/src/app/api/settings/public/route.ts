import { prisma } from "@/lib/db";
import { parseFaq, safeJson, errorJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: "default" } });
    if (!settings) return errorJson("Settings missing", 500);

    return safeJson({
      settings: {
        siteName: settings.siteName,
        heroHeadline: settings.heroHeadline,
        heroSubheadline: settings.heroSubheadline,
        heroImageUrl: settings.heroImageUrl,
        upperSeatPrice: settings.upperSeatPrice,
        closerSeatPrice: settings.closerSeatPrice,
        maxTicketsPerOrder: settings.maxTicketsPerOrder,
        serviceFeeEnabled: settings.serviceFeeEnabled,
        serviceFeePercent: settings.serviceFeePercent,
        taxEnabled: settings.taxEnabled,
        taxPercent: settings.taxPercent,
        uniquePaymentEnabled: settings.uniquePaymentEnabled,
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        contactAddress: settings.contactAddress,
        whatsappUrl: settings.whatsappUrl,
        liveChatEnabled: settings.liveChatEnabled,
        footerText: settings.footerText,
        faq: parseFaq(settings.faqJson),
        privacyPolicy: settings.privacyPolicy,
        termsAndConditions: settings.termsAndConditions,
      },
    });
  } catch (e) {
    console.error(e);
    return errorJson("Failed to load settings", 500);
  }
}
