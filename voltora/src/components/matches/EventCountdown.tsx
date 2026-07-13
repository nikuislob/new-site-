"use client";

import { useEffect, useState } from "react";

export function EventCountdown({ kickoff }: { kickoff: string }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(kickoff).getTime() - Date.now()));
  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(Math.max(0, new Date(kickoff).getTime() - Date.now())), 1000);
    return () => window.clearInterval(timer);
  }, [kickoff]);
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining / 3_600_000) % 24);
  const minutes = Math.floor((remaining / 60_000) % 60);
  const seconds = Math.floor((remaining / 1000) % 60);
  return (
    <div className="flex gap-2" aria-label={`${days} days, ${hours} hours until kickoff`}>
      {[[days, "Days"], [hours, "Hrs"], [minutes, "Min"], [seconds, "Sec"]].map(([value, label]) => (
        <div key={label} className="min-w-14 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
          <div className="font-display text-lg font-bold">{String(value).padStart(2, "0")}</div>
          <div className="text-[9px] uppercase tracking-wider text-white/45">{label}</div>
        </div>
      ))}
    </div>
  );
}
