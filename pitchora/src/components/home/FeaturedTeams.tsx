"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export type TeamCardData = {
  id: string;
  name: string;
  country: string;
  logoUrl: string | null;
  upcomingCount: number;
};

export function FeaturedTeams({ teams }: { teams: TeamCardData[] }) {
  return (
    <section className="container-page py-20">
      <div className="mb-10">
        <p className="text-sm uppercase tracking-[0.25em] text-[var(--gold)]">Clubs</p>
        <h2 className="font-display text-5xl md:text-6xl">Featured Teams</h2>
        <p className="mt-2 max-w-xl text-[var(--ink-muted)]">
          Follow the clubs lighting up upcoming fixtures across Pitchora venues.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {teams.map((team, i) => (
          <motion.div
            key={team.id}
            className="glass rounded-[var(--radius)] p-5 transition hover:border-[var(--emerald)]/40"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="relative mb-4 h-16 w-16 overflow-hidden rounded-full border border-[var(--line)]">
              {team.logoUrl ? (
                <Image src={team.logoUrl} alt={team.name} fill className="object-cover" />
              ) : null}
            </div>
            <h3 className="text-lg font-semibold">{team.name}</h3>
            <p className="text-sm text-[var(--ink-muted)]">{team.country}</p>
            <p className="mt-3 text-sm text-[var(--emerald)]">
              {team.upcomingCount} upcoming match{team.upcomingCount === 1 ? "" : "es"}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
