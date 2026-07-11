import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface PromoBanner {
  title: string;
  text: string;
  link: string;
  image: string;
}

interface PromoBannersProps {
  banners: PromoBanner[];
}

export function PromoBanners({ banners }: PromoBannersProps) {
  if (banners.length === 0) return null;

  return (
    <section className="py-8 sm:py-10">
      <div className="container-page grid gap-4 md:grid-cols-2">
        {banners.map((banner, i) => (
          <Link
            key={banner.title}
            href={banner.link}
            className="group relative overflow-hidden rounded-[var(--radius)] bg-[var(--bg)] animate-fade-up"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className="relative min-h-[220px] sm:min-h-[260px]">
              <Image
                src={banner.image}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover opacity-70 transition duration-500 group-hover:scale-[1.02] group-hover:opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)]/95 via-[var(--bg)]/55 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-center p-6 sm:p-8">
                <h3 className="max-w-xs font-display text-2xl font-bold text-white">{banner.title}</h3>
                <p className="mt-2 max-w-sm text-sm text-[#c5d4ea]">{banner.text}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand)]">
                  Shop now
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
