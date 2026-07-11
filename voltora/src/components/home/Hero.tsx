"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface HeroProps {
  storeName?: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  imageUrl: string;
  countdownEnds?: string;
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

export function Hero({
  storeName = "Voltora",
  title,
  subtitle,
  ctaText,
  ctaLink,
  secondaryCtaText,
  secondaryCtaLink,
  imageUrl,
  countdownEnds,
}: HeroProps) {
  const countdown = useCountdown(countdownEnds);

  return (
    <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden">
      <div className="relative min-h-[min(78vh,720px)] bg-[var(--bg)]">
        <Image
          src={imageUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)] via-[var(--bg)]/88 to-[var(--bg)]/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)]/70 via-transparent to-transparent" />

        <div className="container-page relative flex min-h-[min(78vh,720px)] flex-col justify-center py-16">
          <div className="max-w-2xl animate-fade-up">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)] backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              {storeName}
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[#c5d4ea] sm:text-lg">
              {subtitle}
            </p>

            {countdown ? (
              <p className="mt-4 inline-flex rounded-full bg-[var(--accent)]/90 px-4 py-1.5 text-sm font-bold text-white">
                Deal ends in {countdown}
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={ctaLink}>
                <Button className="min-w-[160px]">
                  {ctaText}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              {secondaryCtaText && secondaryCtaLink ? (
                <Link href={secondaryCtaLink}>
                  <Button variant="secondary" className="min-w-[160px] bg-white/95">
                    {secondaryCtaText}
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
