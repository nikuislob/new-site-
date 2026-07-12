import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/Badge";
import type { Match } from "@prisma/client";

export function MatchCard({ match }: { match: Match }) {
  return (
    <Link
      href={`/matches/${match.slug}`}
      className="group block overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-white transition hover:-translate-y-1 hover:shadow-[var(--shadow)]"
    >
      <div className="relative bg-[linear-gradient(135deg,#0d2218,#1f8a4c)] px-5 py-8 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="text-center">
            <p className="text-3xl">{match.homeFlag || "⚽"}</p>
            <p className="mt-2 font-display text-2xl font-bold">{match.homeTeam}</p>
          </div>
          <p className="font-display text-xl font-bold text-[var(--accent)]">VS</p>
          <div className="text-center">
            <p className="text-3xl">{match.awayFlag || "⚽"}</p>
            <p className="mt-2 font-display text-2xl font-bold">{match.awayTeam}</p>
          </div>
        </div>
        {match.isFeatured ? (
          <span className="absolute left-3 top-3 rounded-md bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--bg)]">
            Featured
          </span>
        ) : null}
      </div>
      <div className="space-y-2 p-5">
        <div className="flex flex-wrap gap-2">
          <Badge>{match.stage}</Badge>
          {match.groupName ? <Badge className="bg-[var(--accent-soft)] text-[#8a6a16]">{match.groupName}</Badge> : null}
        </div>
        <p className="text-sm font-semibold text-[var(--ink)]">
          {format(new Date(match.kickoffAt), "EEE, MMM d · h:mm a")} ET
        </p>
        <p className="text-sm text-[var(--ink-muted)]">
          {match.venueName} · {match.venueCity}, {match.venueState}
        </p>
        <p className="pt-1 text-sm font-bold text-[var(--brand-deep)] group-hover:underline">
          From $70 · View seats →
        </p>
      </div>
    </Link>
  );
}
