"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

export interface NavCategory {
  id: string;
  name: string;
  slug: string;
  children?: { id: string; name: string; slug: string }[];
}

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  mainImage: string;
  sellingPrice: number;
  brand?: { name: string };
}

interface HeaderProps {
  storeName?: string;
  categories: NavCategory[];
}

export function Header({ storeName = "Voltora", categories }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (!res.ok) return;
      const data = await res.json();
      setCartCount(data.itemCount ?? data.totals?.itemCount ?? 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refreshCart();
    const onCartUpdate = () => refreshCart();
    window.addEventListener("voltora:cart-updated", onCartUpdate);
    return () => window.removeEventListener("voltora:cart-updated", onCartUpdate);
  }, [refreshCart, pathname]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (!res.ok) return;
        const data = await res.json();
        setResults(data.results || data.products || []);
        setSearchOpen(true);
      } catch {
        setResults([]);
      }
    }, 280);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)]/80 bg-white/90 backdrop-blur-md">
      <div className="container-page flex items-center gap-3 py-3 sm:gap-4 sm:py-4">
        <button
          type="button"
          className="rounded-xl p-2 text-[var(--ink)] lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/" className="group shrink-0">
          <span className="font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-[1.65rem]">
            {storeName}
            <span className="text-[var(--brand)]">.</span>
          </span>
        </Link>

        <form onSubmit={onSearchSubmit} className="relative hidden flex-1 lg:block">
          <div className="relative" ref={searchRef}>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query && setSearchOpen(true)}
              placeholder="Search phones, laptops, audio, gaming..."
              className="input w-full rounded-full pl-10"
              aria-label="Search products"
              autoComplete="off"
            />
          </div>
          {searchOpen && results.length > 0 ? (
            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-xl">
              <ul>
                {results.slice(0, 6).map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/products/${item.slug}`}
                      className="flex items-center gap-3 px-4 py-3 transition hover:bg-[var(--surface)]"
                      onClick={() => {
                        setSearchOpen(false);
                        setQuery("");
                      }}
                    >
                      <Image src={item.mainImage} alt="" width={40} height={40} className="h-10 w-10 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-[var(--ink-muted)]">
                          {item.brand?.name} · {formatCurrency(item.sellingPrice)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            href="/account"
            className="hidden rounded-full p-2.5 text-[var(--ink-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)] sm:inline-flex"
            aria-label="Account"
          >
            <User className="h-5 w-5" />
          </Link>
          <Link
            href="/wishlist"
            className="rounded-full p-2.5 text-[var(--ink-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5" />
          </Link>
          <Link
            href="/cart"
            className="relative rounded-full p-2.5 text-[var(--ink-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
            aria-label={`Cart${cartCount ? `, ${cartCount} items` : ""}`}
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      <nav className="hidden border-t border-[var(--line)]/70 lg:block" aria-label="Categories">
        <div className="container-page flex items-center gap-1 overflow-x-auto py-2">
          <Link
            href="/products"
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition",
              pathname === "/products" ? "bg-[var(--brand-soft)] text-[#067260]" : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            )}
          >
            All products
          </Link>
          {categories.map((cat) => (
            <div key={cat.id} className="group relative shrink-0">
              <Link
                href={`/category/${cat.slug}`}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-[var(--ink-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
              >
                {cat.name}
                {cat.children && cat.children.length > 0 ? (
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                ) : null}
              </Link>
              {cat.children && cat.children.length > 0 ? (
                <div className="invisible absolute left-0 top-full z-50 min-w-[200px] pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
                  <div className="rounded-2xl border border-[var(--line)] bg-white p-2 shadow-xl">
                    {cat.children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/category/${child.slug}`}
                        className="block rounded-xl px-3 py-2 text-sm text-[var(--ink-muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </nav>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[var(--bg)]/50"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-[min(320px,88vw)] flex-col bg-white shadow-2xl animate-fade-up">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-4">
              <span className="font-display text-xl font-bold">{storeName}</span>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={onSearchSubmit} className="border-b border-[var(--line)] p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  className="input rounded-full pl-9"
                />
              </div>
            </form>
            <nav className="flex-1 overflow-y-auto p-4">
              <Link href="/products" className="block rounded-xl px-3 py-2.5 font-medium" onClick={() => setMobileOpen(false)}>
                All products
              </Link>
              {categories.map((cat) => (
                <div key={cat.id} className="mt-1">
                  <Link
                    href={`/category/${cat.slug}`}
                    className="block rounded-xl px-3 py-2.5 font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    {cat.name}
                  </Link>
                  {cat.children?.map((child) => (
                    <Link
                      key={child.id}
                      href={`/category/${child.slug}`}
                      className="block rounded-xl py-2 pl-6 text-sm text-[var(--ink-muted)]"
                      onClick={() => setMobileOpen(false)}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              ))}
              <div className="mt-4 border-t border-[var(--line)] pt-4">
                <Link href="/account" className="block rounded-xl px-3 py-2.5" onClick={() => setMobileOpen(false)}>
                  Account
                </Link>
                <Link href="/wishlist" className="block rounded-xl px-3 py-2.5" onClick={() => setMobileOpen(false)}>
                  Wishlist
                </Link>
              </div>
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
