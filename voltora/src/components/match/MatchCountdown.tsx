"use client";

import { useEffect, useMemo, useState } from "react";

export function MatchCountdown({ targetIso }: { targetIso: string }) {
  const target = useMemo(() => new Date(targetIso).getTime(), [targetIso]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  const parts = [
    { label: "Days", value: days },
    { label: "Hours", value: hours },
    { label: "Mins", value: minutes },
    { label: "Secs", value: seconds },
  ];

  return (
    <div className="grid grid-cols-4 gap-2" aria-live="polite" aria-label="Countdown to kickoff">
      {parts.map((part) => (
        <div
          key={part.label}
          className="rounded-2xl border border-white/10 bg-black/30 px-2 py-3 text-center backdrop-blur"
        >
          <div className="font-display text-3xl text-white md:text-4xl">
            {String(part.value).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
            {part.label}
          </div>
        </div>
      ))}
    </div>
  );
}
