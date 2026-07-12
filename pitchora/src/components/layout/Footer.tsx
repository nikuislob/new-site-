import Link from "next/link";
import { Ticket } from "lucide-react";

export function Footer({
  footerText,
  contactEmail,
  contactPhone,
}: {
  footerText?: string;
  contactEmail?: string;
  contactPhone?: string;
}) {
  return (
    <footer className="mt-24 border-t border-[var(--line)] bg-black/40">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-[var(--gold)]" />
            <span className="font-display text-3xl gold-text">PITCHORA</span>
          </div>
          <p className="mt-4 max-w-md text-sm text-[var(--ink-muted)]">
            {footerText || "Premium football ticket experiences worldwide."}
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm uppercase tracking-[0.2em] text-[var(--gold)]">Explore</h4>
          <div className="flex flex-col gap-2 text-sm text-[var(--ink-muted)]">
            <Link href="/matches">Upcoming Matches</Link>
            <Link href="/bulk-request">Bulk Tickets</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
        <div>
          <h4 className="mb-3 text-sm uppercase tracking-[0.2em] text-[var(--gold)]">Legal</h4>
          <div className="flex flex-col gap-2 text-sm text-[var(--ink-muted)]">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms & Conditions</Link>
            <Link href="/admin/login">Admin Login</Link>
            {contactEmail ? <a href={`mailto:${contactEmail}`}>{contactEmail}</a> : null}
            {contactPhone ? <span>{contactPhone}</span> : null}
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--line)] py-5 text-center text-xs text-[var(--ink-muted)]">
        © {new Date().getFullYear()} Pitchora. All rights reserved. Original branding — not affiliated with FIFA.
      </div>
    </footer>
  );
}
