"use client";

import Image from "next/image";
import { formatMatchDate, formatMatchTime } from "@/lib/format";
import { formatCurrency } from "@/lib/utils";

type MatchCardProps = {
  teamAName: string;
  teamBName: string;
  teamACode: string;
  teamBCode: string;
  teamAFlagUrl?: string | null;
  teamBFlagUrl?: string | null;
  matchDate: string;
  stadiumName: string;
  city: string;
  availability: string;
  fromPriceCents?: number;
};

export function FeaturedMatchCard(props: MatchCardProps) {
  const availabilityClass =
    props.availability === "SOLD OUT"
      ? "badge-danger"
      : props.availability === "LIMITED AVAILABILITY"
        ? "badge-warning"
        : "badge-success";

  return (
    <article className="glass-panel relative overflow-hidden p-5 md:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(46,229,157,0.12),transparent_45%)]" />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
            Featured Final
          </span>
          <span className={`badge ${availabilityClass}`}>{props.availability}</span>
        </div>

        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <TeamBlock
            name={props.teamAName}
            code={props.teamACode}
            flagUrl={props.teamAFlagUrl}
            align="left"
          />
          <div className="text-center">
            <div className="font-display text-4xl text-white/80">VS</div>
          </div>
          <TeamBlock
            name={props.teamBName}
            code={props.teamBCode}
            flagUrl={props.teamBFlagUrl}
            align="right"
          />
        </div>

        <div className="mt-5 grid gap-2 text-sm text-white/70 sm:grid-cols-2">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">Date</div>
            <div className="font-semibold text-white">{formatMatchDate(props.matchDate)}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">Kickoff</div>
            <div className="font-semibold text-white">{formatMatchTime(props.matchDate)}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">Stadium</div>
            <div className="font-semibold text-white">{props.stadiumName}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">City</div>
            <div className="font-semibold text-white">{props.city}</div>
          </div>
        </div>

        {typeof props.fromPriceCents === "number" ? (
          <div className="mt-5 border-t border-white/10 pt-4 text-sm text-white/70">
            From <span className="font-bold text-[var(--brand)]">{formatCurrency(props.fromPriceCents)}</span>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function TeamBlock({
  name,
  code,
  flagUrl,
  align,
}: {
  name: string;
  code: string;
  flagUrl?: string | null;
  align: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <div className={`flex items-center gap-3 ${align === "right" ? "justify-end" : ""}`}>
        {align === "left" && flagUrl ? (
          <Image src={flagUrl} alt="" width={44} height={44} className="rounded-xl" />
        ) : null}
        <div>
          <div className="font-display text-2xl text-white md:text-3xl">{code}</div>
          <div className="text-xs text-white/60 md:text-sm">{name}</div>
        </div>
        {align === "right" && flagUrl ? (
          <Image src={flagUrl} alt="" width={44} height={44} className="rounded-xl" />
        ) : null}
      </div>
    </div>
  );
}
