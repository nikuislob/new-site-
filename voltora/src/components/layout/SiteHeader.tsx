"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Matches" },
  { href: "/#tickets", label: "Choose Seats" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-emerald-400/15 bg-slate-950/80 backdrop-blur-xl">
      <div className="container-page flex items-center justify-between gap-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-lime-400 to-emerald-500 text-sm font-black text-slate-950">
            PP
          </span>
          <div>
            <div className="text-lg font-black tracking-wide text-white">PitchPass USA</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-lime-400">
              Match-day tickets
            </div>
          </div>
        </Link>
        <nav className="hidden items-center gap-5 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-bold uppercase tracking-[0.12em] text-slate-300 hover:text-lime-400",
                pathname === link.href && "text-lime-400"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link href="/#tickets" className="btn btn-primary !py-2.5 !text-sm pulse-glow">
          Get Tickets
        </Link>
      </div>
      <div className="border-t border-white/5 bg-emerald-950/50 px-4 py-1.5 text-center text-[11px] text-slate-400">
        Independent ticket marketplace for USA venues — not affiliated with FIFA or any governing body.
      </div>
    </header>
  );
}
