"use client";

import { useEffect, useState } from "react";

export function PageLoader({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) setVisible(true);
    else {
      const t = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(t);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-400 ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
        <p className="font-display text-4xl gold-text tracking-[0.2em]">PITCHORA</p>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">Preparing your matchday experience</p>
      </div>
    </div>
  );
}
