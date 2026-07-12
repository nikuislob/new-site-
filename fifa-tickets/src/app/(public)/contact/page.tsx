import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { ContactForm } from "@/components/checkout/ContactForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bulk Orders / Contact" };

export default async function ContactPage() {
  const matches = await prisma.match.findMany({
    where: { isPublished: true },
    orderBy: { matchDate: "asc" },
  });

  return (
    <div className="container-page py-12">
      <p className="text-sm font-bold uppercase tracking-wider text-[var(--pitch)]">Group Sales</p>
      <h1 className="font-display text-5xl tracking-[0.06em] text-[var(--pitch-deep)]">Chat Now</h1>
      <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
        Online checkout is limited to 2 tickets. Need more seats for friends, family, or corporate hospitality? Send a bulk inquiry and our team will follow up.
      </p>
      <div className="mt-8 max-w-3xl">
        <Suspense fallback={<div>Loading form…</div>}>
          <ContactForm
            matches={matches.map((m) => ({
              id: m.id,
              slug: m.slug,
              label: `${m.homeTeam} vs ${m.opponent} — ${m.stadiumName}`,
            }))}
          />
        </Suspense>
      </div>
    </div>
  );
}
