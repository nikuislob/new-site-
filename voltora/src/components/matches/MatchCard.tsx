import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin, Ticket } from "lucide-react";
import { formatMoney } from "@/lib/utils";

type MatchCardProps = {
  match: {
    slug: string;
    round: string;
    homeTeam: string;
    awayTeam: string;
    kickoffAt: Date;
    venue: { name: string; city: string; timezone: string };
    listings: { price: number; currency: string; quantityAvailable: number }[];
  };
};

function teamMark(name: string) {
  const words = name.replace(/of|the/gi, "").trim().split(/\s+/);
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "TBD";
}

export function MatchCard({ match }: MatchCardProps) {
  const lowest = match.listings.filter((item) => item.quantityAvailable > 0).sort((a, b) => a.price - b.price)[0];
  const date = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: match.venue.timezone,
  }).format(match.kickoffAt);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: match.venue.timezone,
  }).format(match.kickoffAt);

  return (
    <article className="group overflow-hidden rounded-[26px] border border-[#dce8e2] bg-white shadow-[0_18px_60px_rgba(7,38,28,.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(7,38,28,.14)]">
      <div className="flex items-center justify-between border-b border-[#e7efeb] px-5 py-3">
        <span className="text-[11px] font-bold uppercase tracking-[.16em] text-[#5d766c]">{match.round}</span>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#17845f]"><span className="h-1.5 w-1.5 rounded-full bg-[#36e49c]" /> Upcoming</span>
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#f0f6f3] font-display text-sm font-extrabold text-[#123c2f]">{teamMark(match.homeTeam)}</span>
            <h3 className="mt-3 line-clamp-2 min-h-12 font-display text-base font-bold leading-6">{match.homeTeam}</h3>
          </div>
          <span className="font-display text-sm font-extrabold text-[#91a49d]">VS</span>
          <div className="min-w-0 flex-1 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#f0f6f3] font-display text-sm font-extrabold text-[#123c2f]">{teamMark(match.awayTeam)}</span>
            <h3 className="mt-3 line-clamp-2 min-h-12 font-display text-base font-bold leading-6">{match.awayTeam}</h3>
          </div>
        </div>
        <div className="mt-6 grid gap-2 rounded-2xl bg-[#f7faf8] p-4 text-xs text-[#587067]">
          <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#17845f]" /> {date} · {time}</span>
          <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#17845f]" /> {match.venue.name}, {match.venue.city}</span>
        </div>
        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[#758b83]">{lowest ? "Tickets from" : "Availability"}</p>
            <p className="mt-1 font-display text-xl font-extrabold">{lowest ? formatMoney(lowest.price, lowest.currency) : "Currently unavailable"}</p>
          </div>
          <Link href={`/matches/${match.slug}`} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#09261c] text-white transition group-hover:bg-[var(--brand)] group-hover:text-[#071711]" aria-label={`View tickets for ${match.homeTeam} versus ${match.awayTeam}`}>
            {lowest ? <ArrowUpRight className="h-5 w-5" /> : <Ticket className="h-5 w-5" />}
          </Link>
        </div>
      </div>
    </article>
  );
}
