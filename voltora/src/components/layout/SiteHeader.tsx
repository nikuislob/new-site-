"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Ticket, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/stadium", label: "Stadium" },
    { href: "/find-ticket", label: "Find My Ticket" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050b14]/80 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand)] text-[#04150e]">
            <Ticket className="h-4 w-4" />
          </span>
          <span className="font-display text-2xl tracking-[0.12em] text-white">ARENA NIGHTS</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)] transition hover:text-white",
                pathname === link.href && "text-[var(--brand)]"
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/stadium" className="btn btn-primary !py-2.5 !text-sm">
            Get Tickets
          </Link>
        </nav>

        <button
          type="button"
          className="rounded-full border border-white/15 p-2 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-[#07111d] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white/80 hover:bg-white/5"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/stadium" onClick={() => setOpen(false)} className="btn btn-primary">
              Get Tickets
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
