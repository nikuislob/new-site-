import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-[var(--line)] bg-[var(--pitch-deep)] text-white">
      <div className="container-page grid gap-8 py-12 md:grid-cols-3">
        <div>
          <p className="font-display text-3xl tracking-[0.08em]">FIFA TICKETS</p>
          <p className="mt-3 max-w-sm text-sm text-white/75">
            Secure seat selection and instant payment redirects for FIFA match nights. Apple Pay and Cash App supported.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--gold)]">Explore</p>
          <div className="flex flex-col gap-2 text-sm text-white/80">
            <Link href="/matches">Upcoming Matches</Link>
            <Link href="/contact">Bulk / Group Orders</Link>
            <Link href="/admin/login">Admin Login</Link>
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--gold)]">Purchase Rules</p>
          <ul className="space-y-2 text-sm text-white/80">
            <li>Basic tickets from $70.50</li>
            <li>Premium tickets from $141.00</li>
            <li>Max 2 tickets per online checkout</li>
            <li>3+ tickets: use Chat Now / contact form</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/55">
        © {new Date().getFullYear()} FIFA Match Tickets Platform. Demo storefront for deployment.
      </div>
    </footer>
  );
}
