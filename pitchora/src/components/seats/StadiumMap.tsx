"use client";

import { cn } from "@/lib/utils";

export type OfferedSeat = {
  id: string;
  section: string;
  block: string;
  row: string;
  number: number;
  category: string;
  price: number;
  label: string;
  mapZone: string;
  status: string;
};

const ZONES = ["north", "east", "south", "west"] as const;

export function StadiumMap({
  offered,
  selectedIds,
  onSelectZone,
  activeSeatId,
}: {
  offered: OfferedSeat[];
  selectedIds: string[];
  onSelectZone?: (zone: string) => void;
  activeSeatId?: string | null;
}) {
  const zonesWithOffers = new Set(offered.map((s) => s.mapZone));
  const selectedZones = new Set(
    offered.filter((s) => selectedIds.includes(s.id)).map((s) => s.mapZone)
  );
  const active = offered.find((s) => s.id === activeSeatId);

  return (
    <div className="relative overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-gradient-to-b from-[#07140f] via-[#050b09] to-black p-3 md:p-5">
      <div className="stadium-lights opacity-70" />
      <p className="relative z-10 mb-3 text-center text-xs uppercase tracking-[0.28em] text-[var(--gold)]">
        Football Stadium Map
      </p>

      <svg viewBox="0 0 640 480" className="relative z-10 h-auto w-full" role="img" aria-label="Football stadium seating map">
        <defs>
          <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d9488" />
            <stop offset="50%" stopColor="#047857" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>
          <radialGradient id="bowlGlow" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="rgba(212,175,55,0.18)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>

        {/* Outer bowl */}
        <ellipse cx="320" cy="240" rx="300" ry="220" fill="#111827" stroke="#374151" strokeWidth="3" />
        <ellipse cx="320" cy="240" rx="300" ry="220" fill="url(#bowlGlow)" />

        {/* Stands */}
        {ZONES.map((zone) => {
          const hasOffer = zonesWithOffers.has(zone);
          const isSelected = selectedZones.has(zone);
          const path =
            zone === "north"
              ? "M80 80 C180 30, 460 30, 560 80 L520 140 C420 100, 220 100, 120 140 Z"
              : zone === "south"
                ? "M80 400 C180 450, 460 450, 560 400 L520 340 C420 380, 220 380, 120 340 Z"
                : zone === "east"
                  ? "M560 80 C610 160, 610 320, 560 400 L500 360 C540 300, 540 180, 500 120 Z"
                  : "M80 80 C30 160, 30 320, 80 400 L140 360 C100 300, 100 180, 140 120 Z";
          return (
            <path
              key={zone}
              d={path}
              fill={isSelected ? "rgba(251,191,36,0.55)" : hasOffer ? "rgba(16,185,129,0.45)" : "rgba(55,65,81,0.85)"}
              stroke={isSelected ? "#fbbf24" : hasOffer ? "#10b981" : "#4b5563"}
              strokeWidth={isSelected || hasOffer ? 2.5 : 1}
              className={cn(hasOffer && "cursor-pointer transition-opacity hover:opacity-90")}
              onClick={() => hasOffer && onSelectZone?.(zone)}
            />
          );
        })}

        {/* Pitch */}
        <rect x="190" y="145" width="260" height="190" rx="8" fill="url(#pitchGrad)" stroke="#ecfdf5" strokeWidth="2" />
        <line x1="320" y1="145" x2="320" y2="335" stroke="#ecfdf5" strokeWidth="1.5" opacity="0.7" />
        <circle cx="320" cy="240" r="28" fill="none" stroke="#ecfdf5" strokeWidth="1.5" opacity="0.7" />
        <circle cx="320" cy="240" r="2.5" fill="#ecfdf5" />
        {/* Penalty boxes */}
        <rect x="190" y="195" width="40" height="90" fill="none" stroke="#ecfdf5" strokeWidth="1.2" opacity="0.65" />
        <rect x="410" y="195" width="40" height="90" fill="none" stroke="#ecfdf5" strokeWidth="1.2" opacity="0.65" />
        {/* Goals */}
        <rect x="182" y="220" width="8" height="40" fill="#f8fafc" opacity="0.9" />
        <rect x="450" y="220" width="8" height="40" fill="#f8fafc" opacity="0.9" />

        {/* Zone labels */}
        <text x="320" y="70" textAnchor="middle" fill="#d4af37" fontSize="12" fontFamily="Manrope, sans-serif">NORTH STAND</text>
        <text x="320" y="430" textAnchor="middle" fill="#d4af37" fontSize="12" fontFamily="Manrope, sans-serif">SOUTH STAND</text>
        <text x="575" y="245" textAnchor="middle" fill="#d4af37" fontSize="11" fontFamily="Manrope, sans-serif" transform="rotate(90 575 245)">EAST</text>
        <text x="55" y="245" textAnchor="middle" fill="#d4af37" fontSize="11" fontFamily="Manrope, sans-serif" transform="rotate(-90 55 245)">WEST</text>
        <text x="320" y="250" textAnchor="middle" fill="#ecfdf5" fontSize="14" fontFamily="Bebas Neue, sans-serif" letterSpacing="3" opacity="0.85">PITCH</text>

        {/* Offer markers */}
        {offered.map((seat, i) => {
          const pos = markerPosition(seat.mapZone, i, offered.filter((o) => o.mapZone === seat.mapZone).length);
          const selected = selectedIds.includes(seat.id);
          return (
            <g key={seat.id}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={selected ? 9 : 7}
                fill={selected ? "#fbbf24" : "#10b981"}
                stroke="#fff"
                strokeWidth="1.5"
              />
              <text x={pos.x} y={pos.y + 3.5} textAnchor="middle" fill="#04110c" fontSize="8" fontWeight="700">
                {i + 1}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="relative z-10 mt-3 flex flex-wrap gap-3 text-xs text-[var(--ink-muted)]">
        <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-[#10b981]" /> Available option</span>
        <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-[#fbbf24]" /> Selected</span>
        <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-[#4b5563]" /> Other stands</span>
      </div>

      {active ? (
        <div className="relative z-10 mt-3 rounded-xl border border-[var(--gold)]/40 bg-black/50 px-4 py-3 text-sm">
          <p className="text-[var(--gold)] font-semibold">{active.label}</p>
          <p className="text-[var(--ink-muted)]">
            {active.block} · {active.category === "CLOSER" ? "Closer View" : "Upper Side"} · ${active.price.toFixed(2)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function markerPosition(zone: string, index: number, countInZone: number) {
  const spread = Math.min(countInZone, 5);
  const offset = (index % spread) - (spread - 1) / 2;
  switch (zone) {
    case "north":
      return { x: 320 + offset * 28, y: 100 };
    case "south":
      return { x: 320 + offset * 28, y: 380 };
    case "east":
      return { x: 520, y: 240 + offset * 24 };
    case "west":
      return { x: 120, y: 240 + offset * 24 };
    default:
      return { x: 320, y: 240 };
  }
}
