"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Ticket, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/matches", label: "Matches" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors",
        scrolled ? "border-[var(--line)] bg-black/80 backdrop-blur-xl" : "border-transparent bg-transparent"
      )}
    >
      <div className="container-page flex h-16 items-center justify-between md:h-20">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--gold-soft)] text-[var(--gold)]">
            <Ticket className="h-5 w-5" />
          </span>
          <span className="font-display text-3xl tracking-[0.08em] gold-text">PITCHORA</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition hover:text-[var(--gold)]",
                pathname === link.href ? "text-[var(--gold)]" : "text-[var(--ink-muted)]"
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/matches"
            className="rounded-full bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-110"
          >
            Book Tickets
          </Link>
        </nav>

        <button
          className="md:hidden rounded-lg p-2 text-white"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-[var(--line)] bg-black/95 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="py-2 text-[var(--ink-muted)]">
                {link.label}
              </Link>
            ))}
            <Link
              href="/matches"
              className="rounded-full bg-[var(--gold)] px-4 py-2 text-center font-semibold text-black"
            >
              Book Tickets
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
