"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CategoryTile {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  description?: string | null;
}

interface CategoryGridProps {
  title?: string;
  categories: CategoryTile[];
  layout?: "scroll" | "grid";
}

const FALLBACK_IMAGES: Record<string, string> = {
  smartphones: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80",
  laptops: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80",
  tablets: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80",
  audio: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
  gaming: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&q=80",
  wearables: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&q=80",
  accessories: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80",
  "smart-home": "https://images.unsplash.com/photo-1558002038-1055907df827?w=400&q=80",
};

function CategoryCard({ cat, compact }: { cat: CategoryTile; compact?: boolean }) {
  const image = cat.imageUrl || FALLBACK_IMAGES[cat.slug] || FALLBACK_IMAGES.smartphones;

  return (
    <Link
      href={`/category/${cat.slug}`}
      className="category-tile group flex shrink-0 flex-col overflow-hidden rounded-md border border-[var(--line)] bg-white transition hover:border-[var(--brand)]/40 hover:shadow-md"
    >
      <div className={compact ? "relative aspect-square w-[88px]" : "relative aspect-[4/3] w-full sm:aspect-square"}>
        <Image
          src={image}
          alt={cat.name}
          fill
          sizes={compact ? "88px" : "(max-width: 640px) 33vw, 120px"}
          className="object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className={compact ? "px-1.5 py-1.5 text-center" : "px-2 py-2 text-center sm:px-3"}>
        <h3 className={compact ? "line-clamp-2 text-[10px] font-semibold leading-tight" : "line-clamp-2 text-xs font-semibold sm:text-sm"}>
          {cat.name}
        </h3>
      </div>
    </Link>
  );
}

export function CategoryGrid({
  title = "Shop by category",
  categories,
  layout = "scroll",
}: CategoryGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (categories.length === 0) return null;

  const scroll = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * 220, behavior: "smooth" });
  };

  return (
    <section className="py-5 sm:py-6">
      <div className="container-page">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold sm:text-xl">{title}</h2>
          <Link
            href="/products"
            className="text-xs font-semibold text-[var(--brand-deep)] hover:underline"
          >
            View all
          </Link>
        </div>

        {layout === "scroll" ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => scroll(-1)}
              className="absolute -left-1 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--line)] bg-white shadow-sm hover:bg-[var(--surface)] sm:flex"
              aria-label="Scroll categories left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div
              ref={scrollRef}
              className="category-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 snap-x snap-mandatory scrollbar-hide sm:gap-3"
            >
              {categories.map((cat) => (
                <div key={cat.id} className="w-[88px] shrink-0 snap-start sm:w-[100px]">
                  <CategoryCard cat={cat} compact />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => scroll(1)}
              className="absolute -right-1 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--line)] bg-white shadow-sm hover:bg-[var(--surface)] sm:flex"
              aria-label="Scroll categories right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="category-grid-dense">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} cat={cat} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
