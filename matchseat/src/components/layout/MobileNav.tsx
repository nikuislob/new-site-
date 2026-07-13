"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

type MobileNavProps = {
  customer: boolean;
};

export function MobileNav({ customer }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/matches", label: "Matches" },
    { href: "/seating", label: "Seating" },
    { href: "/how-it-works", label: "How it works" },
    customer ? { href: "/account", label: "Account" } : { href: "/login", label: "Sign in" },
    { href: "/matches", label: "Buy tickets" },
  ];

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="rounded-xl border border-[var(--line)] p-2 text-[var(--ink)]"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-full z-50 border-b border-[var(--line)] bg-white px-4 py-4 shadow-lg">
          <nav className="container-page flex flex-col gap-3 text-sm font-semibold text-[var(--ink)]">
            {links.map((link) => (
              <Link key={link.label} href={link.href} onClick={() => setOpen(false)} className="py-1">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
