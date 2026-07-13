"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUserRound, Menu, Search, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface NavCategory {
  id: string;
  name: string;
  slug: string;
  children?: { id: string; name: string; slug: string }[];
}

export function Header({ storeName = "PitchPass" }: { storeName?: string; categories?: NavCategory[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = [
    { href: "/#matches", label: "Matches" },
    { href: "/#journey", label: "Tournament" },
    { href: "/support", label: "Support" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#071711]/90 text-white backdrop-blur-xl">
      <div className="container-page flex h-[72px] items-center gap-8">
        <Link href="/" className="flex items-center gap-2" aria-label="PitchPass home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--brand)] text-[#071711]">
            <span className="h-4 w-4 rounded-full border-[3px] border-current" />
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight">{storeName}</span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-white/70 transition hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <Link href="/#matches" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/75 hover:bg-white/5">
            <Search className="h-4 w-4" /> Find a match
          </Link>
          <Link href="/account" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold hover:border-[var(--brand)]">
            <CircleUserRound className="h-4 w-4" /> My tickets
          </Link>
        </div>
        <button type="button" className="ml-auto rounded-xl p-2 md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      <div className="border-t border-white/10 bg-[var(--brand)]/10">
        <div className="container-page flex items-center justify-center gap-2 py-2 text-[11px] font-medium text-white/70 sm:text-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-[var(--brand)]" />
          Independent ticket marketplace · Not affiliated with or endorsed by FIFA
        </div>
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 bg-[#071711] md:hidden">
          <div className="flex h-[72px] items-center justify-between px-5">
            <span className="font-display text-xl font-bold">PitchPass</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu"><X /></button>
          </div>
          <nav className="grid gap-2 p-5">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={cn("rounded-2xl px-4 py-4 text-lg", pathname === link.href && "bg-white/10")}>
                {link.label}
              </Link>
            ))}
            <Link href="/account" onClick={() => setOpen(false)} className="mt-3 rounded-2xl bg-[var(--brand)] px-4 py-4 font-bold text-[#071711]">
              My tickets
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
