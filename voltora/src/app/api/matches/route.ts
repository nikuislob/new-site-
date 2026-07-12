import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";

export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      where: {
        matchDate: { gt: new Date() },
      },
      orderBy: { matchDate: "asc" },
    });

    return safeJson({
      matches: matches.map((m) => ({
        id: m.id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        venue: m.venue,
        stadiumViewUrl: m.stadiumViewUrl,
        matchDate: m.matchDate.toISOString(),
        standardAvailable: m.standardAvailable,
        premiumAvailable: m.premiumAvailable,
      })),
    });
  } catch (err) {
    console.error(err);
    return errorJson("Unable to load matches", 500);
  }
}
