"use client";

import { useEffect, useState } from "react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function Countdown({ target }: { target: string | Date }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const end = new Date(target).getTime();
  const diff = Math.max(0, end - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  if (diff <= 0) {
    return <span className="text-[var(--ink-muted)]">Kickoff passed</span>;
  }

  return (
    <div className="inline-flex items-center gap-2 font-semibold tracking-wide" aria-live="polite">
      <TimeBox value={pad(days)} label="D" />
      <TimeBox value={pad(hours)} label="H" />
      <TimeBox value={pad(minutes)} label="M" />
      <TimeBox value={pad(seconds)} label="S" />
    </div>
  );
}

function TimeBox({ value, label }: { value: string; label: string }) {
  return (
    <span className="rounded-lg border border-[var(--line)] bg-black/40 px-2 py-1 text-sm">
      <span className="text-[var(--gold)]">{value}</span>
      <span className="ml-1 text-[10px] text-[var(--ink-muted)]">{label}</span>
    </span>
  );
}
