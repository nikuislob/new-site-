import { prisma } from "@/lib/db";
import { errorJson, safeJson, slugify } from "@/lib/utils";

type ProviderMatch = {
  id: string | number;
  utcDate?: string;
  kickoffAt?: string;
  status?: string;
  stage?: string;
  round?: string;
  homeTeam?: { name?: string; tla?: string } | string;
  awayTeam?: { name?: string; tla?: string } | string;
  venue?: { name?: string; city?: string; timezone?: string } | string;
};

export async function GET(request: Request) {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret || request.headers.get("authorization") !== `Bearer ${configuredSecret}`) {
    return errorJson("Unauthorized", 401);
  }
  const apiUrl = process.env.MATCH_API_URL;
  const apiKey = process.env.MATCH_API_KEY;
  if (!apiUrl || !apiKey) return errorJson("MATCH_API_URL and MATCH_API_KEY are required", 503);

  try {
    const response = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Match provider returned ${response.status}`);
    const payload = await response.json() as { matches?: ProviderMatch[] } | ProviderMatch[];
    const matches = Array.isArray(payload) ? payload : payload.matches || [];
    let updated = 0;
    let created = 0;

    for (const item of matches) {
      const externalId = String(item.id);
      const kickoff = item.utcDate || item.kickoffAt;
      if (!kickoff) continue;
      const home = typeof item.homeTeam === "string" ? item.homeTeam : item.homeTeam?.name;
      const away = typeof item.awayTeam === "string" ? item.awayTeam : item.awayTeam?.name;
      const existing = await prisma.eventMatch.findUnique({ where: { externalId } });
      if (existing) {
        await prisma.eventMatch.update({
          where: { id: existing.id },
          data: {
            kickoffAt: new Date(kickoff),
            status: item.status || existing.status,
            round: item.stage || item.round || existing.round,
            homeTeam: home || existing.homeTeam,
            awayTeam: away || existing.awayTeam,
            homeTeamCode: typeof item.homeTeam === "object" ? item.homeTeam?.tla : existing.homeTeamCode,
            awayTeamCode: typeof item.awayTeam === "object" ? item.awayTeam?.tla : existing.awayTeamCode,
            sourceUpdatedAt: new Date(),
          },
        });
        updated += 1;
        continue;
      }

      const venueName = typeof item.venue === "string" ? item.venue : item.venue?.name;
      const city = typeof item.venue === "object" ? item.venue?.city : undefined;
      if (!venueName || !city) continue;
      const venue = await prisma.venue.upsert({
        where: { externalId: `provider-${slugify(venueName)}` },
        create: {
          externalId: `provider-${slugify(venueName)}`,
          name: venueName,
          city,
          timezone: typeof item.venue === "object" ? item.venue.timezone || "UTC" : "UTC",
        },
        update: { name: venueName, city },
      });
      await prisma.eventMatch.create({
        data: {
          externalId,
          slug: `${slugify(home || "tbd")}-vs-${slugify(away || "tbd")}-${externalId}`,
          round: item.stage || item.round || "Knockout stage",
          homeTeam: home || "To be determined",
          awayTeam: away || "To be determined",
          kickoffAt: new Date(kickoff),
          status: item.status || "SCHEDULED",
          venueId: venue.id,
          sourceUpdatedAt: new Date(),
        },
      });
      created += 1;
    }
    return safeJson({ synced: true, updated, created, received: matches.length });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Match sync failed", 502);
  }
}
