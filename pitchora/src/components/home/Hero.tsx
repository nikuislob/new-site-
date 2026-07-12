"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Countdown } from "@/components/ui/Countdown";

export function Hero({
  headline,
  subheadline,
  nearestKickoff,
}: {
  headline: string;
  subheadline: string;
  nearestKickoff?: string | null;
}) {
  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/stadium-hero.svg)" }}
        aria-hidden
      />
      <div className="stadium-lights" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-[var(--bg)]" />

      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="float-slow absolute left-[8%] top-[28%] h-28 w-16 rounded-full bg-gradient-to-b from-emerald-400/30 to-transparent blur-[1px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        />
        <motion.div
          className="float-delayed absolute right-[12%] top-[34%] h-32 w-18 rounded-full bg-gradient-to-b from-amber-300/25 to-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.15 }}
        />
        <motion.div
          className="absolute bottom-[22%] left-[18%] h-10 w-10 rounded-full border border-white/30 bg-white/10"
          animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container-page relative z-10 flex min-h-[100svh] flex-col justify-center pb-24 pt-10">
        <motion.p
          className="mb-4 text-sm uppercase tracking-[0.35em] text-[var(--gold)]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Pitchora Premium Tickets
        </motion.p>
        <motion.h1
          className="max-w-4xl font-display text-6xl leading-[0.95] md:text-8xl"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <span className="gold-text">{headline}</span>
        </motion.h1>
        <motion.p
          className="mt-5 max-w-xl text-base text-[var(--ink-muted)] md:text-lg"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {subheadline}
        </motion.p>
        <motion.div
          className="mt-8 flex flex-wrap items-center gap-4"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Link
            href="/matches"
            className="rounded-full bg-[var(--gold)] px-7 py-3.5 text-sm font-bold text-black transition hover:brightness-110"
          >
            Browse Matches
          </Link>
          <Link
            href="/bulk-request"
            className="rounded-full border border-[var(--line)] bg-white/5 px-7 py-3.5 text-sm font-semibold backdrop-blur"
          >
            Bulk Booking Help
          </Link>
        </motion.div>

        {nearestKickoff ? (
          <motion.div
            className="mt-10 inline-flex w-fit flex-col gap-2 rounded-2xl border border-[var(--line)] bg-black/45 px-5 py-4 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--emerald)]">Next kickoff</p>
            <Countdown target={nearestKickoff} />
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}
