import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout" };

type Props = {
  searchParams: Promise<{ matchId?: string; categoryId?: string; seats?: string }>;
};

async function CheckoutContent({ searchParams }: Props) {
  const sp = await searchParams;
  const matchId = sp.matchId;
  const categoryId = sp.categoryId;
  const seatIds = (sp.seats || "").split(",").filter(Boolean);

  if (!matchId || !categoryId || seatIds.length === 0) {
    redirect("/matches");
  }

  if (seatIds.length > 2) {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    redirect(`/contact?match=${match?.slug || ""}&qty=${seatIds.length}`);
  }

  const [match, category, seats] = await Promise.all([
    prisma.match.findUnique({ where: { id: matchId } }),
    prisma.ticketCategory.findUnique({ where: { id: categoryId } }),
    prisma.seat.findMany({
      where: { id: { in: seatIds }, matchId },
      include: { category: true },
    }),
  ]);

  if (!match || !category || seats.length !== seatIds.length) {
    redirect("/matches");
  }

  const unavailable = seats.some((s) => s.status !== "AVAILABLE" || s.categoryId !== categoryId);
  if (unavailable) {
    redirect(`/matches/${match.slug}?error=seats`);
  }

  return (
    <div className="container-page py-12">
      <h1 className="font-display text-5xl tracking-[0.06em] text-[var(--pitch-deep)]">Checkout</h1>
      <p className="mt-2 text-[var(--ink-muted)]">
        Complete your details and you will be redirected to the payment link for this package.
      </p>
      <div className="mt-8">
        <CheckoutForm
          match={{
            id: match.id,
            title: `${match.homeTeam} vs ${match.opponent}`,
            stadiumName: match.stadiumName,
          }}
          category={{
            id: category.id,
            code: category.code,
            name: category.name,
            price: category.price,
          }}
          seats={seats.map((s) => ({
            id: s.id,
            label: s.label,
            price: s.category.price,
          }))}
        />
      </div>
    </div>
  );
}

export default function CheckoutPage(props: Props) {
  return (
    <Suspense fallback={<div className="container-page py-12">Loading checkout…</div>}>
      <CheckoutContent {...props} />
    </Suspense>
  );
}
