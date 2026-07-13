import Link from "next/link";
import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CartButton } from "@/components/layout/CartButton";
import { MobileNav } from "@/components/layout/MobileNav";

export async function Header() {
  const [customer, announcement] = await Promise.all([
    getCurrentCustomer(),
    prisma.siteSetting.findUnique({ where: { key: "announcement" } }).catch(() => null),
  ]);

  return (
    <header className="sticky top-0 z-40">
      {announcement?.value ? (
        <div className="bg-[var(--bg)] px-4 py-2 text-center text-xs font-semibold tracking-wide text-[#d7f0e0] sm:text-sm">
          {announcement.value}
        </div>
      ) : null}
      <div className="relative border-b border-[var(--line)] bg-white/90 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link href="/" className="font-display text-3xl font-extrabold tracking-wide text-[var(--brand-deep)]">
            PitchPass
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-[var(--ink)] md:flex">
            <Link href="/matches" className="hover:text-[var(--brand)]">
              Matches
            </Link>
            <Link href="/seating" className="hover:text-[var(--brand)]">
              Seating
            </Link>
            <Link href="/how-it-works" className="hover:text-[var(--brand)]">
              How it works
            </Link>
            {customer ? (
              <Link href="/account" className="hover:text-[var(--brand)]">
                Account
              </Link>
            ) : (
              <Link href="/login" className="hover:text-[var(--brand)]">
                Sign in
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-2">
            <CartButton />
            <Link href="/matches" className="btn btn-primary hidden sm:inline-flex">
              Buy tickets
            </Link>
            <MobileNav customer={Boolean(customer)} />
          </div>
        </div>
      </div>
    </header>
  );
}
