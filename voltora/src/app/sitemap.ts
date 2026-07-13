import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { ACTIVE_MATCH_STATUSES } from "@/lib/tickets";
import { absoluteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const matches = await prisma.eventMatch.findMany({
    where: { isVisible: true, kickoffAt: { gt: new Date() }, status: { in: ACTIVE_MATCH_STATUSES } },
    select: { slug: true, updatedAt: true },
  });
  return [
    { url: absoluteUrl("/"), lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    { url: absoluteUrl("/support"), lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/policies/privacy"), lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/policies/terms"), lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/policies/refunds"), lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    ...matches.map((match) => ({
      url: absoluteUrl(`/matches/${match.slug}`),
      lastModified: match.updatedAt,
      changeFrequency: "hourly" as const,
      priority: 0.9,
    })),
  ];
}
