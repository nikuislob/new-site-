import Link from "next/link";
import { CreditCard, Mail, MapPin, Phone, Shield } from "lucide-react";

interface FooterProps {
  storeName?: string;
  about?: string;
  contactEmail?: string;
  contactPhone?: string;
  categories?: { name: string; slug: string }[];
}

const SHOP_LINKS = [
  { label: "All products", href: "/products" },
  { label: "Today's Deals", href: "/products?deals=1" },
  { label: "New arrivals", href: "/products?sort=newest" },
  { label: "Best sellers", href: "/products?sort=popular" },
  { label: "Wishlist", href: "/wishlist" },
];

const HELP_LINKS = [
  { label: "Help center", href: "/account" },
  { label: "Track your order", href: "/account/orders" },
  { label: "Shipping & delivery", href: "/#why-shop" },
  { label: "Returns & refunds", href: "/account" },
  { label: "Contact support", href: "/account" },
];

const ABOUT_LINKS = [
  { label: "About Voltora", href: "/#why-shop" },
  { label: "Why shop with us", href: "/#why-shop" },
  { label: "Secure checkout", href: "/cart" },
  { label: "Privacy policy", href: "/account" },
];

const ACCOUNT_LINKS = [
  { label: "Sign in", href: "/account/login" },
  { label: "Create account", href: "/account/register" },
  { label: "My orders", href: "/account/orders" },
  { label: "Profile", href: "/account/profile" },
  { label: "Cart", href: "/cart" },
];

export function Footer({
  storeName = "Voltora",
  about,
  contactEmail = "support@voltora.example",
  contactPhone = "1-800-555-0188",
  categories = [],
}: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="marketplace-footer mt-10 border-t border-white/10 bg-[var(--bg)] text-[#b8c5d9]">
      <div className="container-page py-8 sm:py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="font-display text-xl font-extrabold text-white sm:text-2xl">
              {storeName}
            </Link>
            {about ? (
              <p className="mt-3 max-w-sm text-xs leading-relaxed text-[#8fa0b8] sm:text-sm">{about}</p>
            ) : (
              <p className="mt-3 max-w-sm text-xs leading-relaxed text-[#8fa0b8] sm:text-sm">
                Your trusted US marketplace for phones, laptops, gaming gear, and everyday tech — shipped fast with
                transparent pricing.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-3 text-[10px] font-semibold uppercase tracking-wide text-[#7f92ad]">
              <span className="inline-flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-[var(--brand)]" />
                Secure checkout
              </span>
              <span className="inline-flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5 text-[var(--brand)]" />
                USD pricing
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Shop</h3>
            <ul className="mt-3 space-y-1.5 text-xs sm:text-sm">
              {SHOP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
              {categories.slice(0, 4).map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/category/${cat.slug}`} className="transition hover:text-white">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Help</h3>
            <ul className="mt-3 space-y-1.5 text-xs sm:text-sm">
              {HELP_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">About</h3>
            <ul className="mt-3 space-y-1.5 text-xs sm:text-sm">
              {ABOUT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Account</h3>
            <ul className="mt-3 space-y-1.5 text-xs sm:text-sm">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="mt-5 text-xs font-bold uppercase tracking-wider text-white">Contact</h3>
            <ul className="mt-3 space-y-2 text-xs sm:text-sm">
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--brand)]" />
                <a href={`mailto:${contactEmail}`} className="break-all hover:text-white">
                  {contactEmail}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0 text-[var(--brand)]" />
                <a href={`tel:${contactPhone.replace(/\D/g, "")}`} className="hover:text-white">
                  {contactPhone}
                </a>
              </li>
              <li className="flex items-start gap-2 text-[#7f92ad]">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--brand)]" />
                Continental US shipping
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-4 text-[10px] text-[#6d8099] sm:flex-row sm:items-center sm:justify-between sm:text-xs">
          <p>
            © {year} {storeName}. All rights reserved.
          </p>
          <p>Prices in USD · Sales tax calculated at checkout · Most orders ship within 1 business day</p>
        </div>
      </div>
    </footer>
  );
}
