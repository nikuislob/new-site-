import Link from "next/link";
import { Mail, MessageCircle, ShieldCheck } from "lucide-react";

interface FooterProps {
  storeName?: string;
  about?: string;
  contactEmail?: string;
  contactPhone?: string;
  categories?: { name: string; slug: string }[];
}

export function Footer({
  storeName = "PitchPass",
  about,
  contactEmail = "support@pitchpass.example",
}: FooterProps) {
  return (
    <footer className="mt-20 bg-[#06130f] text-white">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link href="/" className="font-display text-2xl font-extrabold">{storeName}<span className="text-[var(--brand)]">.</span></Link>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/55">{about}</p>
          <div className="mt-6 flex items-center gap-2 text-xs text-white/50"><ShieldCheck className="h-4 w-4 text-[var(--brand)]" /> Prices and fees shown before payment</div>
        </div>
        <div>
          <h3 className="font-display font-semibold">Marketplace</h3>
          <div className="mt-4 grid gap-3 text-sm text-white/55">
            <Link href="/#matches" className="hover:text-white">Upcoming matches</Link>
            <Link href="/account" className="hover:text-white">My tickets</Link>
            <Link href="/support" className="hover:text-white">Customer support</Link>
          </div>
        </div>
        <div>
          <h3 className="font-display font-semibold">Legal & help</h3>
          <div className="mt-4 grid gap-3 text-sm text-white/55">
            <Link href="/policies/privacy" className="hover:text-white">Privacy policy</Link>
            <Link href="/policies/terms" className="hover:text-white">Terms & conditions</Link>
            <Link href="/policies/refunds" className="hover:text-white">Refund & cancellation</Link>
            <a href={`mailto:${contactEmail}`} className="inline-flex items-center gap-2 hover:text-white"><Mail className="h-3.5 w-3.5" /> {contactEmail}</a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-white/40 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} {storeName}. All rights reserved.</span>
          <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5" /> Support available in every order journey</span>
        </div>
      </div>
    </footer>
  );
}
