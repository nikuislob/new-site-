import Link from "next/link";

export function SiteFooter({ disclaimer }: { disclaimer?: string }) {
  return (
    <footer className="mt-20 border-t border-white/10 bg-[#03070e]">
      <div className="container-page grid gap-8 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="font-display text-3xl tracking-[0.12em] text-white">ARENA NIGHTS</div>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--ink-muted)]">
            An independent premium football ticket experience. Built for match-night atmosphere,
            secure booking, and digital entry.
          </p>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">Explore</div>
          <div className="mt-3 flex flex-col gap-2 text-sm text-white/80">
            <Link href="/stadium">Interactive Stadium</Link>
            <Link href="/find-ticket">Find My Ticket</Link>
            <Link href="/checkout">Checkout</Link>
          </div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">Support</div>
          <p className="mt-3 text-sm text-white/80">Live chat available on every page.</p>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs leading-relaxed text-white/45">
        {disclaimer ||
          "Arena Nights is an independent ticket experience platform and is not affiliated with FIFA or any official tournament organizer."}
      </div>
    </footer>
  );
}
