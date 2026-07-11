"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface HeroSlide {
  title: string;
  subtitle?: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  imageUrl: string;
  countdownEnds?: string;
  badge?: string;
}

interface HeroProps {
  slides: HeroSlide[];
  autoRotateMs?: number;
}

function useCountdown(endIso?: string) {
  const [remaining, setRemaining] = useState<string | null>(null);

  useEffect(() => {
    if (!endIso) return;
    const end = new Date(endIso).getTime();
    if (Number.isNaN(end)) return;

    const tick = () => {
      const diff = end - Date.now();
      if (diff <= 0) {
        setRemaining(null);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endIso]);

  return remaining;
}

function HeroSlideContent({ slide }: { slide: HeroSlide }) {
  const countdown = useCountdown(slide.countdownEnds);

  return (
    <div className="hero-slide-inner relative flex min-h-[200px] flex-col justify-center px-5 py-6 sm:min-h-[240px] sm:px-8 sm:py-8 lg:min-h-[280px] lg:px-10">
      <Image
        src={slide.imageUrl}
        alt=""
        fill
        priority
        sizes="(max-width: 1200px) 100vw, 1200px"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)]/95 via-[var(--bg)]/75 to-[var(--bg)]/25" />

      <div className="relative max-w-lg">
        {slide.badge ? (
          <span className="mb-2 inline-block rounded bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            {slide.badge}
          </span>
        ) : null}
        <h2 className="font-display text-xl font-extrabold leading-tight text-white sm:text-2xl lg:text-3xl">
          {slide.title}
        </h2>
        {slide.subtitle ? (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#c5d4ea] sm:text-sm">
            {slide.subtitle}
          </p>
        ) : null}
        {countdown ? (
          <p className="mt-2 inline-flex rounded bg-white/10 px-2.5 py-1 text-[11px] font-bold text-[var(--brand)] backdrop-blur">
            Ends in {countdown}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={slide.ctaLink}>
            <Button className="h-9 px-4 text-xs sm:text-sm">
              {slide.ctaText}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
          {slide.secondaryCtaText && slide.secondaryCtaLink ? (
            <Link href={slide.secondaryCtaLink}>
              <Button variant="secondary" className="h-9 bg-white/95 px-4 text-xs sm:text-sm">
                {slide.secondaryCtaText}
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function Hero({ slides, autoRotateMs = 6000 }: HeroProps) {
  const validSlides = slides.filter((s) => s.title && s.imageUrl);
  const [index, setIndex] = useState(0);

  const goTo = useCallback(
    (next: number) => {
      if (validSlides.length === 0) return;
      setIndex((next + validSlides.length) % validSlides.length);
    },
    [validSlides.length]
  );

  useEffect(() => {
    if (validSlides.length <= 1) return;
    const id = window.setInterval(() => goTo(index + 1), autoRotateMs);
    return () => window.clearInterval(id);
  }, [autoRotateMs, goTo, index, validSlides.length]);

  if (validSlides.length === 0) return null;

  const slide = validSlides[index];

  return (
    <section className="hero-carousel border-b border-[var(--line)] bg-white py-3 sm:py-4">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-lg border border-[var(--line)] shadow-sm">
          <HeroSlideContent slide={slide} />

          {validSlides.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[var(--ink)] shadow transition hover:bg-white"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[var(--ink)] shadow transition hover:bg-white"
                aria-label="Next slide"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                {validSlides.map((s, i) => (
                  <button
                    key={s.title + i}
                    type="button"
                    onClick={() => goTo(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === index ? "w-5 bg-[var(--brand)]" : "w-1.5 bg-white/50 hover:bg-white/80"
                    )}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
