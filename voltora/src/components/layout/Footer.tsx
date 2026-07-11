import Link from "next/link";
import { Globe, Mail, Phone, Share2 } from "lucide-react";

interface FooterProps {
  storeName?: string;
  about?: string;
  contactEmail?: string;
  contactPhone?: string;
  categories?: { name: string; slug: string }[];
}

export function Footer({
  storeName = "Voltora",
  about,
  contactEmail = "support@voltora.example",
  contactPhone = "1-800-555-0188",
  categories = [],
}: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-[var(--bg)] text-[#d7e4f7]">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="font-display text-2xl font-extrabold text-white">
            {storeName}
            <span className="text-[var(--brand)]">.</span>
          </Link>
          {about ? <p className="mt-4 text-sm leading-relaxed text-[#9fb0cb]">{about}</p> : null}
          <div className="mt-5 flex gap-3">
            {[Share2, Globe, Mail].map((Icon, i) => (
              <span
                key={i}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-[#9fb0cb]"
                aria-hidden
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white">Shop</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/products" className="text-[#9fb0cb] transition hover:text-white">
                All products
              </Link>
            </li>
            {categories.slice(0, 6).map((cat) => (
              <li key={cat.slug}>
                <Link href={`/category/${cat.slug}`} className="text-[#9fb0cb] transition hover:text-white">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white">Support</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/account/orders" className="text-[#9fb0cb] transition hover:text-white">
                Track order
              </Link>
            </li>
            <li>
              <Link href="/account" className="text-[#9fb0cb] transition hover:text-white">
                My account
              </Link>
            </li>
            <li>
              <Link href="/cart" className="text-[#9fb0cb] transition hover:text-white">
                Cart
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-[#9fb0cb]">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[var(--brand)]" />
              <a href={`mailto:${contactEmail}`} className="hover:text-white">
                {contactEmail}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[var(--brand)]" />
              <a href={`tel:${contactPhone.replace(/\D/g, "")}`} className="hover:text-white">
                {contactPhone}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-[#7f92ad] sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {storeName}. Premium US electronics.</p>
          <p>Prices in USD · Continental US shipping</p>
        </div>
      </div>
    </footer>
  );
}
