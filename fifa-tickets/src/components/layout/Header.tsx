"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ticket, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/matches", label: "Matches" },
  { href: "/contact", label: "Bulk Orders" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)]/70 bg-[#f3f7f4]/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--pitch)] text-white shadow-md">
            <Ticket size={18} />
          </span>
          <span className="font-display text-2xl tracking-[0.08em] text-[var(--pitch-deep)]">
            FIFA TICKETS
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "text-sm font-semibold transition-colors",
                pathname === l.href ? "text-[var(--pitch)]" : "text-[var(--ink-muted)] hover:text-[var(--pitch)]"
              )}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/matches" className="btn btn-primary !py-2 !px-4 text-sm">
            Buy Tickets
          </Link>
        </nav>

        <button
          className="md:hidden rounded-lg p-2 text-[var(--pitch-deep)]"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-[var(--line)] bg-white md:hidden">
          <div className="container-page flex flex-col gap-3 py-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="font-semibold text-[var(--ink)]"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
