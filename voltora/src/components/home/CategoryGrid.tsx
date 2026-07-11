import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

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
}

const FALLBACK_IMAGES: Record<string, string> = {
  smartphones: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80",
  laptops: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80",
  audio: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
  gaming: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&q=80",
  wearables: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&q=80",
  "smart-home": "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80",
};

export function CategoryGrid({ title = "Shop by category", categories }: CategoryGridProps) {
  if (categories.length === 0) return null;

  return (
    <section className="py-10 sm:py-14">
      <div className="container-page">
        <h2 className="mb-6 font-display text-2xl font-bold sm:text-3xl animate-fade-up">{title}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {categories.map((cat, i) => {
            const image = cat.imageUrl || FALLBACK_IMAGES[cat.slug] || FALLBACK_IMAGES.smartphones;
            return (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="group relative overflow-hidden rounded-[var(--radius)] bg-[var(--bg)] animate-fade-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={image}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-95"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/25 to-transparent" />
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 text-white">
                  <div>
                    <h3 className="font-display text-lg font-bold">{cat.name}</h3>
                    {cat.description ? (
                      <p className="mt-0.5 line-clamp-1 text-xs text-[#b8c9e2]">{cat.description}</p>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-white/15 p-2 backdrop-blur transition group-hover:bg-[var(--brand)] group-hover:text-[#04241f]">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
