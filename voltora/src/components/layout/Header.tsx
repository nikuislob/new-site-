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
  Package,
  Headphones,
  MapPin,
  LayoutGrid,
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

const SECONDARY_NAV = [
  { label: "All Categories", href: "/products", icon: LayoutGrid },
  { label: "Today's Deals", href: "/products?deals=1", highlight: true },
  { label: "Smartphones", slug: "smartphones" },
  { label: "Laptops", slug: "laptops" },
  { label: "Tablets", slug: "tablets" },
  { label: "Gaming", slug: "gaming" },
  { label: "Audio", slug: "audio" },
  { label: "Wearables", slug: "wearables" },
  { label: "Accessories", slug: "accessories" },
  { label: "New Arrivals", href: "/products?sort=newest" },
  { label: "Best Sellers", href: "/products?sort=popular" },
] as const;

function resolveNavHref(
  item: (typeof SECONDARY_NAV)[number],
  categories: NavCategory[]
): string {
  if ("href" in item && item.href) return item.href;
  if ("slug" in item && item.slug) {
    const match = categories.find((c) => c.slug === item.slug);
    if (match) return `/category/${match.slug}`;
    return `/search?q=${encodeURIComponent(item.label)}`;
  }
  return "/products";
}

export function Header({ storeName = "Voltora", categories }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState("all");
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
        const params = new URLSearchParams({ q: query.trim() });
        if (categoryFilter !== "all") params.set("category", categoryFilter);
        const res = await fetch(`/api/search?${params}`);
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
  }, [query, categoryFilter]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchOpen(false);
    const params = new URLSearchParams({ q: query.trim() });
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    router.push(`/search?${params}`);
  };

  const searchForm = (className?: string, compact?: boolean) => (
    <form onSubmit={onSearchSubmit} className={cn("relative flex-1", className)}>
      <div className="marketplace-search" ref={searchRef}>
        <div className="flex overflow-hidden rounded-md border border-[var(--line)] bg-white shadow-sm focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-[var(--brand)]/20">
          <label className="sr-only" htmlFor={compact ? "mobile-search" : "desktop-search"}>
            Search products
          </label>
          <div className="relative hidden shrink-0 border-r border-[var(--line)] sm:block">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-full cursor-pointer appearance-none bg-[var(--surface)] py-2.5 pl-3 pr-8 text-xs font-semibold text-[var(--ink)] outline-none"
              aria-label="Search category"
            >
              <option value="all">All</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ink-muted)]" />
          </div>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
            <input
              id={compact ? "mobile-search" : "desktop-search"}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query && setSearchOpen(true)}
              placeholder={compact ? "Search Voltora..." : "Search phones, laptops, gaming, audio & more"}
              className="w-full border-0 bg-transparent py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-[var(--ink-muted)]"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            className="hidden shrink-0 bg-[var(--brand)] px-4 text-xs font-bold text-[#04241f] transition hover:bg-[var(--brand-deep)] sm:block"
          >
            Search
          </button>
        </div>

        {searchOpen && results.length > 0 ? (
          <div className="search-dropdown absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-md border border-[var(--line)] bg-white shadow-xl">
            <ul>
              {results.slice(0, 8).map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/products/${item.slug}`}
                    className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-[var(--surface)]"
                    onClick={() => {
                      setSearchOpen(false);
                      setQuery("");
                      setMobileOpen(false);
                    }}
                  >
                    <Image
                      src={item.mainImage}
                      alt=""
                      width={44}
                      height={44}
                      className="h-11 w-11 shrink-0 rounded border border-[var(--line)] object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--ink)]">{item.name}</p>
                      <p className="text-xs text-[var(--ink-muted)]">
                        {item.brand?.name ? `${item.brand.name} · ` : ""}
                        <span className="font-semibold text-[var(--ink)]">
                          {formatCurrency(item.sellingPrice)}
                        </span>
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="border-t border-[var(--line)] bg-[var(--surface)] px-3 py-2">
              <button
                type="submit"
                className="text-xs font-semibold text-[var(--brand-deep)] hover:underline"
              >
                See all results for &ldquo;{query}&rdquo;
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </form>
  );

  return (
    <header className="marketplace-header sticky top-0 z-40 border-b border-[var(--line)] bg-white shadow-sm">
      {/* Utility strip */}
      <div className="utility-strip hidden border-b border-[var(--line)]/80 bg-[var(--surface)] text-xs text-[var(--ink-muted)] lg:block">
        <div className="container-page flex items-center justify-between gap-4 py-1.5">
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-[var(--brand-deep)]" aria-hidden />
            <span>Free delivery on orders $75+ · Ships nationwide</span>
          </p>
          <nav className="flex items-center gap-4" aria-label="Utility">
            <Link href="/account/orders" className="transition hover:text-[var(--ink)]">
              Orders
            </Link>
            <Link href="/account" className="transition hover:text-[var(--ink)]">
              Account
            </Link>
            <Link href="/account" className="flex items-center gap-1 transition hover:text-[var(--ink)]">
              <Headphones className="h-3.5 w-3.5" aria-hidden />
              Support
            </Link>
          </nav>
        </div>
      </div>

      {/* Main row */}
      <div className="container-page py-2.5 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="rounded-md p-2 text-[var(--ink)] hover:bg-[var(--surface)] lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/" className="group shrink-0">
            <span className="font-display text-xl font-extrabold tracking-tight text-[var(--ink)] sm:text-2xl">
              {storeName}
            </span>
          </Link>

          <div className="hidden flex-1 lg:block">{searchForm()}</div>

          <div className="ml-auto flex items-center">
            <Link
              href="/account"
              className="header-action hidden flex-col items-center px-2 py-1 text-[var(--ink-muted)] transition hover:text-[var(--ink)] sm:flex lg:px-3"
            >
              <User className="h-5 w-5" />
              <span className="mt-0.5 text-[10px] font-semibold leading-none">Account</span>
            </Link>
            <Link
              href="/account/orders"
              className="header-action hidden flex-col items-center px-2 py-1 text-[var(--ink-muted)] transition hover:text-[var(--ink)] sm:flex lg:px-3"
            >
              <Package className="h-5 w-5" />
              <span className="mt-0.5 text-[10px] font-semibold leading-none">Orders</span>
            </Link>
            <Link
              href="/wishlist"
              className="header-action hidden flex-col items-center px-2 py-1 text-[var(--ink-muted)] transition hover:text-[var(--ink)] sm:flex lg:px-3"
            >
              <Heart className="h-5 w-5" />
              <span className="mt-0.5 text-[10px] font-semibold leading-none">Wishlist</span>
            </Link>
            <Link
              href="/cart"
              className="header-action relative flex flex-col items-center px-2 py-1 text-[var(--ink-muted)] transition hover:text-[var(--ink)] lg:px-3"
              aria-label={`Cart${cartCount ? `, ${cartCount} items` : ""}`}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 ? (
                <span className="absolute -right-0.5 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
              <span className="mt-0.5 hidden text-[10px] font-semibold leading-none sm:block">Cart</span>
            </Link>
          </div>
        </div>

        {/* Mobile sticky search */}
        <div className="mt-2 lg:hidden">{searchForm(undefined, true)}</div>
      </div>

      {/* Secondary category bar */}
      <nav className="secondary-nav hidden lg:block" aria-label="Shop categories">
        <div className="container-page flex items-stretch gap-0 overflow-x-auto">
          {SECONDARY_NAV.map((item) => {
            const href = resolveNavHref(item, categories);
            const isDeals = "highlight" in item && item.highlight;
            const isActive =
              pathname === href ||
              (href.startsWith("/category/") && pathname === href);

            return (
              <Link
                key={item.label}
                href={href}
                className={cn(
                  "secondary-nav-link shrink-0",
                  isDeals && "secondary-nav-link--deal",
                  isActive && "secondary-nav-link--active"
                )}
              >
                {"icon" in item && item.icon ? (
                  <item.icon className="h-3.5 w-3.5" aria-hidden />
                ) : null}
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-[min(320px,88vw)] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
              <span className="font-display text-lg font-bold">{storeName}</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-1.5 hover:bg-[var(--surface)]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-[var(--line)] p-3">{searchForm()}</div>

            <nav className="flex-1 overflow-y-auto p-3" aria-label="Mobile categories">
              <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                Shop
              </p>
              {SECONDARY_NAV.map((item) => (
                <Link
                  key={item.label}
                  href={resolveNavHref(item, categories)}
                  className="block rounded-md px-3 py-2.5 text-sm font-medium text-[var(--ink)] hover:bg-[var(--surface)]"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              <div className="my-3 border-t border-[var(--line)]" />

              <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                Browse
              </p>
              <Link
                href="/products"
                className="block rounded-md px-3 py-2.5 text-sm font-medium hover:bg-[var(--surface)]"
                onClick={() => setMobileOpen(false)}
              >
                All products
              </Link>
              {categories.map((cat) => (
                <div key={cat.id}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className="block rounded-md px-3 py-2.5 text-sm font-medium hover:bg-[var(--surface)]"
                    onClick={() => setMobileOpen(false)}
                  >
                    {cat.name}
                  </Link>
                  {cat.children?.map((child) => (
                    <Link
                      key={child.id}
                      href={`/category/${child.slug}`}
                      className="block rounded-md py-2 pl-6 text-sm text-[var(--ink-muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
                      onClick={() => setMobileOpen(false)}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              ))}

              <div className="my-3 border-t border-[var(--line)]" />

              <Link
                href="/account"
                className="block rounded-md px-3 py-2.5 text-sm hover:bg-[var(--surface)]"
                onClick={() => setMobileOpen(false)}
              >
                Account
              </Link>
              <Link
                href="/account/orders"
                className="block rounded-md px-3 py-2.5 text-sm hover:bg-[var(--surface)]"
                onClick={() => setMobileOpen(false)}
              >
                Orders
              </Link>
              <Link
                href="/wishlist"
                className="block rounded-md px-3 py-2.5 text-sm hover:bg-[var(--surface)]"
                onClick={() => setMobileOpen(false)}
              >
                Wishlist
              </Link>
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
