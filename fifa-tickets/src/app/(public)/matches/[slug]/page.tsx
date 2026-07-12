import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMatchDate } from "@/lib/utils";
import { SeatMap } from "@/components/match/SeatMap";
import { Calendar, Clock, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const match = await prisma.match.findUnique({ where: { slug } });
  if (!match) return { title: "Match" };
  return { title: `${match.homeTeam} vs ${match.opponent}` };
}

export default async function MatchDetailPage({ params }: Props) {
  const { slug } = await params;
  const match = await prisma.match.findUnique({
    where: { slug },
    include: {
      seats: {
        include: { category: true },
        orderBy: [{ section: "asc" }, { row: "asc" }, { number: "asc" }],
      },
    },
  });

  if (!match || !match.isPublished) notFound();

  const categories = await prisma.ticketCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const seatDTOs = match.seats.map((s) => ({
    id: s.id,
    section: s.section,
    row: s.row,
    number: s.number,
    label: s.label,
    status: s.status,
    categoryId: s.categoryId,
    categoryCode: s.category.code,
    categoryName: s.category.name,
    categoryColor: s.category.color,
    price: s.category.price,
    x: s.x,
    y: s.y,
  }));

  return (
    <div className="pb-16">
      <section className="relative h-[42vh] min-h-[280px] overflow-hidden">
        {match.stadiumImage && (
          <Image src={match.stadiumImage} alt={match.stadiumName} fill priority className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(8,67,44,0.95)] via-[rgba(8,67,44,0.55)] to-transparent" />
        <div className="container-page relative z-10 flex h-full flex-col justify-end pb-8 text-white">
          <p className="text-sm font-bold uppercase tracking-wider text-[var(--gold)]">{match.stadiumName}</p>
          <h1 className="font-display text-5xl tracking-[0.06em] sm:text-6xl md:text-7xl">
            {match.homeTeam} <span className="text-[var(--gold)]">vs</span> {match.opponent}
          </h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/85">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={15} /> {formatMatchDate(match.matchDate)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={15} /> {match.matchTime}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} /> {match.venue}
            </span>
          </div>
        </div>
      </section>

      {match.description && (
        <div className="container-page pt-8">
          <p className="max-w-3xl text-[var(--ink-muted)]">{match.description}</p>
        </div>
      )}

      <div className="container-page mt-10">
        <h2 className="mb-6 font-display text-4xl tracking-[0.05em] text-[var(--pitch-deep)]">
          Select Your Seats
        </h2>
        <SeatMap
          matchId={match.id}
          matchSlug={match.slug}
          seats={seatDTOs}
          categories={categories.map((c) => ({
            id: c.id,
            code: c.code,
            name: c.name,
            price: c.price,
            color: c.color,
            description: c.description,
          }))}
        />
      </div>
    </div>
  );
}
