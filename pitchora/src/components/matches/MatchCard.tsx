"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { MapPin, Clock } from "lucide-react";
import { Countdown } from "@/components/ui/Countdown";
import { formatCurrency } from "@/lib/utils";

export type MatchCardData = {
  id: string;
  kickoffAt: string;
  stadium: string;
  country: string;
  city?: string | null;
  upperAvailable?: number;
  closerAvailable?: number;
  totalAvailable?: number;
  homeTeam: { name: string; shortName: string; logoUrl: string | null; country: string };
  awayTeam: { name: string; shortName: string; logoUrl: string | null; country: string };
};

export function MatchCard({ match, upperPrice, closerPrice }: { match: MatchCardData; upperPrice?: number; closerPrice?: number }) {
  const available = match.totalAvailable ?? ((match.upperAvailable || 0) + (match.closerAvailable || 0));

  return (
    <article className="glass group overflow-hidden rounded-[var(--radius)] transition hover:border-[var(--gold)]/40">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
        <TeamSide team={match.homeTeam} align="left" />
        <div className="text-center">
          <p className="font-display text-2xl text-[var(--gold)]">VS</p>
          <p className="text-xs text-[var(--ink-muted)]">{format(new Date(match.kickoffAt), "MMM d, yyyy")}</p>
        </div>
        <TeamSide team={match.awayTeam} align="right" />
      </div>

      <div className="space-y-3 px-5 py-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--ink-muted)]">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-4 w-4 text-[var(--emerald)]" />
            {format(new Date(match.kickoffAt), "h:mm a")}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4 text-[var(--gold)]" />
            {match.stadium}, {match.country}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Countdown target={match.kickoffAt} />
          <p className="text-sm text-[var(--ink-muted)]">
            <span className="text-[var(--emerald)] font-semibold">{available}</span> seats left
          </p>
        </div>
        {(upperPrice || closerPrice) && (
          <p className="text-xs text-[var(--ink-muted)]">
            From {formatCurrency(Math.min(upperPrice || Infinity, closerPrice || Infinity))}
          </p>
        )}
        <Link
          href={`/matches/${match.id}`}
          className="inline-flex w-full items-center justify-center rounded-full bg-[var(--emerald)] px-4 py-2.5 text-sm font-semibold text-black transition group-hover:bg-[var(--gold)]"
        >
          Buy Tickets
        </Link>
      </div>
    </article>
  );
}

function TeamSide({
  team,
  align,
}: {
  team: MatchCardData["homeTeam"];
  align: "left" | "right";
}) {
  return (
    <div className={`flex flex-1 items-center gap-3 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      <div className="relative h-14 w-14 overflow-hidden rounded-full border border-[var(--line)] bg-black/50">
        {team.logoUrl ? (
          <Image src={team.logoUrl} alt={team.name} fill className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center font-display text-xl">{team.shortName}</span>
        )}
      </div>
      <div>
        <p className="font-semibold leading-tight">{team.name}</p>
        <p className="text-xs text-[var(--ink-muted)]">{team.country}</p>
      </div>
    </div>
  );
}
