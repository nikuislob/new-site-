import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { MapPin, Clock, Armchair } from "lucide-react";
import { prisma } from "@/lib/db";
import { availableSeats, expirePastMatches } from "@/lib/matches";
import { formatCurrency } from "@/lib/utils";
import { Countdown } from "@/components/ui/Countdown";
import { PageHeader } from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id },
    include: { homeTeam: true, awayTeam: true },
  });
  if (!match) return { title: "Match" };
  return { title: `${match.homeTeam.name} vs ${match.awayTeam.name}` };
}

export default async function MatchDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await expirePastMatches();
  const { id } = await params;
  const [match, settings] = await Promise.all([
    prisma.match.findUnique({
      where: { id },
      include: { homeTeam: true, awayTeam: true },
    }),
    prisma.settings.findUnique({ where: { id: "default" } }),
  ]);

  if (!match || match.kickoffAt <= new Date() || match.status === "COMPLETED") notFound();

  const avail = availableSeats(match);

  return (
    <div className="container-page py-14 page-enter">
      <PageHeader
        eyebrow="Match Details"
        title={`${match.homeTeam.name} vs ${match.awayTeam.name}`}
        description={`${match.stadium} · ${match.city ? `${match.city}, ` : ""}${match.country}`}
      />

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-[var(--radius)] border border-[var(--line)]">
            <div className="relative aspect-[16/9]">
              <Image
                src={match.stadiumImageUrl || "/stadium-hero.svg"}
                alt={match.stadium}
                fill
                className="object-cover"
                priority
              />
              <div className="stadium-lights" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-6">
              <TeamBlock team={match.homeTeam} />
              <p className="font-display text-4xl text-[var(--gold)]">VS</p>
              <TeamBlock team={match.awayTeam} align="right" />
            </div>
          </div>

          <div className="glass grid gap-4 rounded-[var(--radius)] p-6 sm:grid-cols-3">
            <Info
              icon={<Clock className="h-4 w-4 text-[var(--emerald)]" />}
              label="Kickoff"
              value={format(match.kickoffAt, "EEE, MMM d · h:mm a")}
            />
            <Info
              icon={<MapPin className="h-4 w-4 text-[var(--gold)]" />}
              label="Venue"
              value={match.stadium}
            />
            <Info
              icon={<Armchair className="h-4 w-4 text-white" />}
              label="Availability"
              value={`${avail.totalAvailable} seats`}
            />
          </div>

          <div className="glass rounded-[var(--radius)] p-6">
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-[var(--gold)]">Countdown</p>
            <Countdown target={match.kickoffAt.toISOString()} />
          </div>
        </div>

        <aside className="glass h-fit rounded-[var(--radius)] p-6">
          <h2 className="font-display text-3xl">Choose Category</h2>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Maximum {settings?.maxTicketsPerOrder ?? 2} tickets per online order.
          </p>

          <div className="mt-6 space-y-4">
            <CategoryOption
              href={`/book/${match.id}?category=UPPER`}
              title="Upper Side Seats"
              price={settings?.upperSeatPrice ?? 89}
              available={avail.upperAvailable}
            />
            <CategoryOption
              href={`/book/${match.id}?category=CLOSER`}
              title="Closer View Seats"
              price={settings?.closerSeatPrice ?? 218}
              available={avail.closerAvailable}
            />
          </div>

          <p className="mt-6 text-sm text-[var(--ink-muted)]">
            Need 3 or more tickets?{" "}
            <Link href={`/bulk-request?matchId=${match.id}`} className="text-[var(--gold)] underline">
              Contact support for bulk booking
            </Link>
            .
          </p>
        </aside>
      </div>
    </div>
  );
}

function TeamBlock({
  team,
  align = "left",
}: {
  team: { name: string; logoUrl: string | null; country: string };
  align?: "left" | "right";
}) {
  return (
    <div className={`flex items-center gap-3 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      <div className="relative h-14 w-14 overflow-hidden rounded-full border border-white/20 bg-black/50">
        {team.logoUrl ? <Image src={team.logoUrl} alt={team.name} fill className="object-cover" /> : null}
      </div>
      <div>
        <p className="font-semibold">{team.name}</p>
        <p className="text-xs text-white/70">{team.country}</p>
      </div>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-[var(--ink-muted)]">
        {icon}
        {label}
      </div>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function CategoryOption({
  href,
  title,
  price,
  available,
}: {
  href: string;
  title: string;
  price: number;
  available: number;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-[var(--line)] bg-black/30 p-4 transition hover:border-[var(--gold)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-[var(--ink-muted)]">{available} available</p>
        </div>
        <p className="font-display text-3xl text-[var(--gold)]">{formatCurrency(price)}</p>
      </div>
    </Link>
  );
}
