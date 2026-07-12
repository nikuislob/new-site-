import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-[var(--line)] bg-[var(--bg)] text-[#c9ddd2]">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-4xl font-extrabold text-white">PitchPass</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#9fb8aa]">
            Independent US ticket marketplace for upcoming international soccer matches.
            Secure checkout with Cash App and Apple Pay links matched to your cart total.
          </p>
        </div>
        <div>
          <p className="font-display text-xl font-bold text-white">Fans</p>
          <div className="mt-3 grid gap-2 text-sm">
            <Link href="/matches">Upcoming matches</Link>
            <Link href="/seating">Seating map</Link>
            <Link href="/cart">Cart</Link>
            <Link href="/login">Sign in</Link>
            <Link href="/download">Download zip</Link>
          </div>
        </div>
        <div>
          <p className="font-display text-xl font-bold text-white">Support</p>
          <div className="mt-3 grid gap-2 text-sm">
            <Link href="/how-it-works">How payment works</Link>
            <Link href="/download">Download zip</Link>
            <Link href="/account">My orders</Link>
            <p className="text-[#9fb8aa]">Use Chat Now anytime — US-based help.</p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-[#7f998c]">
        Demo marketplace — not affiliated with FIFA. Replace payment URLs before real use.
      </div>
    </footer>
  );
}
