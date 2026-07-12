import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-emerald-400/10 bg-slate-950/80">
      <div className="container-page grid gap-6 py-10 md:grid-cols-3">
        <div>
          <div className="text-lg font-black text-white">PitchPass USA</div>
          <p className="mt-2 text-sm text-slate-400">
            High-energy international football tickets for American fans. Secure up to 2 seats online
            with Apple Pay / Cash App payment links.
          </p>
        </div>
        <div className="text-sm text-slate-400">
          <div className="font-bold uppercase tracking-[0.14em] text-lime-400">Explore</div>
          <div className="mt-3 flex flex-col gap-2">
            <Link href="/">Upcoming Matches</Link>
            <Link href="/#tickets">Choose Seats</Link>
            <Link href="/admin">Admin Dashboard</Link>
          </div>
        </div>
        <div className="text-sm text-slate-400">
          <div className="font-bold uppercase tracking-[0.14em] text-lime-400">Support</div>
          <p className="mt-3">
            Bulk / group sales: use the live chat desk. Max 2 tickets per online checkout.
          </p>
        </div>
      </div>
    </footer>
  );
}
