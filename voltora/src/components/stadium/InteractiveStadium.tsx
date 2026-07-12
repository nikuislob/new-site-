"use client";

import { useMemo, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";

export type StadiumZoneView = {
  id: string;
  code: string;
  name: string;
  viewingQuality: string;
  svgPathId: string;
  categoryId: string;
  categoryName: string;
  categorySlug?: string;
  priceCents: number;
  description?: string;
  available: number;
  availability?: string;
};

type Props = {
  zones: StadiumZoneView[];
  selectedZoneCode?: string | null;
  onSelect: (zone: StadiumZoneView) => void;
};

const ZONE_PATHS: Record<string, string> = {
  "zone-upper-north": "M70 18 H330 L300 70 H100 Z",
  "zone-upper-south": "M100 330 H300 L330 382 H70 Z",
  "zone-upper-east": "M330 70 L382 70 L382 330 L330 300 Z",
  "zone-upper-west": "M70 70 L18 70 L18 330 L70 300 Z",
  "zone-lower-north": "M110 85 H290 L270 125 H130 Z",
  "zone-lower-south": "M130 275 H270 L290 315 H110 Z",
  "zone-lower-east": "M275 130 L315 110 L315 290 L275 270 Z",
  "zone-lower-west": "M125 130 L85 110 L85 290 L125 270 Z",
};

export function InteractiveStadium({ zones, selectedZoneCode, onSelect }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const zoneBySvg = useMemo(() => {
    const map = new Map<string, StadiumZoneView>();
    for (const zone of zones) map.set(zone.svgPathId, zone);
    return map;
  }, [zones]);

  const activeCode = hovered || selectedZoneCode;
  const activeZone = zones.find((z) => z.code === activeCode) || null;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
      <div className="glass-panel relative overflow-hidden p-3 md:p-5">
        <div className="pointer-events-none absolute inset-0">
          <div className="stadium-beam left-[10%]" />
          <div className="stadium-beam left-[55%]" style={{ animationDelay: "2.5s" }} />
        </div>
        <svg
          viewBox="0 0 400 400"
          className="relative z-10 mx-auto h-auto w-full max-w-[560px]"
          role="img"
          aria-label="Interactive stadium seating map"
        >
          <defs>
            <radialGradient id="pitchGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2ee59d" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0a3d24" stopOpacity="0.9" />
            </radialGradient>
            <linearGradient id="seatGood" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2ee59d" />
              <stop offset="100%" stopColor="#0f8f5c" />
            </linearGradient>
            <linearGradient id="seatStandard" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3d5a80" />
              <stop offset="100%" stopColor="#1b2a41" />
            </linearGradient>
          </defs>

          <ellipse cx="200" cy="200" rx="188" ry="188" fill="#0a1422" stroke="rgba(255,255,255,0.08)" />
          <ellipse cx="200" cy="200" rx="170" ry="170" fill="none" stroke="rgba(240,199,94,0.15)" strokeWidth="2" />

          {Object.entries(ZONE_PATHS).map(([svgId, d]) => {
            const zone = zoneBySvg.get(svgId);
            if (!zone) return null;
            const selected = selectedZoneCode === zone.code;
            const isHovered = hovered === zone.code;
            const dimmed = Boolean(hovered || selectedZoneCode) && !selected && !isHovered;
            const fill = zone.viewingQuality === "GOOD" ? "url(#seatGood)" : "url(#seatStandard)";
            return (
              <path
                key={svgId}
                d={d}
                fill={fill}
                opacity={dimmed ? 0.28 : selected || isHovered ? 1 : 0.82}
                stroke={selected || isHovered ? "#f0c75e" : "rgba(255,255,255,0.25)"}
                strokeWidth={selected || isHovered ? 3 : 1}
                className="cursor-pointer transition-all duration-200"
                tabIndex={0}
                role="button"
                aria-label={`${zone.name}, ${zone.categoryName}, ${formatCurrency(zone.priceCents)}, ${zone.available} available`}
                aria-pressed={selected}
                onMouseEnter={() => setHovered(zone.code)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(zone.code)}
                onBlur={() => setHovered(null)}
                onClick={() => onSelect(zone)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(zone);
                  }
                }}
              />
            );
          })}

          {/* Pitch */}
          <rect x="130" y="130" width="140" height="140" rx="8" fill="url(#pitchGlow)" stroke="#2ee59d" strokeWidth="2" />
          <circle cx="200" cy="200" r="22" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
          <line x1="130" y1="200" x2="270" y2="200" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
          <rect x="130" y="165" width="28" height="70" fill="none" stroke="rgba(255,255,255,0.4)" />
          <rect x="242" y="165" width="28" height="70" fill="none" stroke="rgba(255,255,255,0.4)" />
          <rect x="130" y="180" width="12" height="40" fill="none" stroke="rgba(255,255,255,0.35)" />
          <rect x="258" y="180" width="12" height="40" fill="none" stroke="rgba(255,255,255,0.35)" />
        </svg>
      </div>

      <div className="glass-panel p-4 md:p-5">
        <h3 className="font-display text-2xl tracking-[0.08em] text-white">Section Preview</h3>
        {activeZone ? (
          <div className="mt-4 space-y-3 animate-fade-up">
            <div className="text-lg font-bold text-white">{activeZone.name}</div>
            <div className="text-sm text-white/65">{activeZone.categoryName}</div>
            <div className="font-display text-4xl text-[var(--brand)]">
              {formatCurrency(activeZone.priceCents)}
              <span className="ml-2 text-base tracking-normal text-white/50">/ ticket</span>
            </div>
            <div className="text-sm text-white/70">
              Viewing quality: <strong className="text-white">{activeZone.viewingQuality}</strong>
            </div>
            <div className="text-sm text-white/70">
              Availability:{" "}
              <strong className={activeZone.available > 0 ? "text-[var(--brand)]" : "text-[var(--danger)]"}>
                {activeZone.available > 0 ? `${activeZone.available} left` : "Sold out"}
              </strong>
            </div>
            {activeZone.description ? (
              <p className="text-sm leading-relaxed text-white/60">{activeZone.description}</p>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            Tap or hover a stadium section to preview category, price, and viewing quality.
          </p>
        )}

        <div className="mt-6">
          <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">
            Accessible list alternative
          </h4>
          <ul className="mt-3 space-y-2">
            {zones.map((zone) => (
              <li key={zone.id}>
                <button
                  type="button"
                  onClick={() => onSelect(zone)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition",
                    selectedZoneCode === zone.code
                      ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                      : "border-white/10 bg-black/20 hover:border-white/25"
                  )}
                >
                  <span>
                    <span className="block text-sm font-semibold text-white">{zone.name}</span>
                    <span className="text-xs text-white/55">
                      {zone.categoryName} · {zone.viewingQuality}
                    </span>
                  </span>
                  <span className="text-sm font-bold text-[var(--brand)]">
                    {formatCurrency(zone.priceCents)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
