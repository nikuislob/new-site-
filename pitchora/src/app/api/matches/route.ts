import { getUpcomingMatches, serializeMatch } from "@/lib/matches";
import { errorJson, safeJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit");
    const featured = searchParams.get("featured");

    let matches = await getUpcomingMatches(limit ? Number(limit) : undefined);
    if (featured === "true") {
      matches = matches.filter((m) => m.isFeatured);
    }

    return safeJson({ matches: matches.map(serializeMatch) });
  } catch (e) {
    console.error(e);
    return errorJson("Failed to load matches", 500);
  }
}
