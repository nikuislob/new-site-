"use client";

import type { TicketType } from "@/lib/utils";

type Props = {
  ticketType: TicketType;
  quantity: number;
};

export function StadiumSeatMap({ ticketType, quantity }: Props) {
  const premium = ticketType === "premium";
  return (
    <div className="glass-panel overflow-hidden p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-black uppercase tracking-[0.16em] text-lime-400">
          Stadium Seat Map
        </div>
        <div className="text-xs font-bold text-slate-400">
          Highlighting {premium ? "Premium" : "Standard"} · {quantity} seat
          {quantity > 1 ? "s" : ""}
        </div>
      </div>

      <div className="relative mx-auto aspect-square max-w-xl">
        <svg viewBox="0 0 400 400" className="h-full w-full drop-shadow-xl">
          <defs>
            <radialGradient id="pitch" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4ade80" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#14532d" />
            </radialGradient>
          </defs>
          <ellipse cx="200" cy="200" rx="188" ry="188" fill="#0f172a" stroke="#a3e635" strokeOpacity="0.35" />
          {/* Outer standard rings */}
          <path d="M70 40 H330 L300 85 H100 Z" fill={premium ? "#1e293b" : "#22c55e"} opacity={premium ? 0.35 : 0.55} />
          <path d="M100 315 H300 L330 360 H70 Z" fill={premium ? "#1e293b" : "#22c55e"} opacity={premium ? 0.35 : 0.55} />
          <path d="M40 70 V330 L85 300 V100 Z" fill={premium ? "#1e293b" : "#16a34a"} opacity={premium ? 0.35 : 0.5} />
          <path d="M360 70 V330 L315 300 V100 Z" fill={premium ? "#1e293b" : "#16a34a"} opacity={premium ? 0.35 : 0.5} />
          {/* Inner premium rings */}
          <path d="M110 95 H290 L270 130 H130 Z" fill={premium ? "#a3e635" : "#334155"} opacity={premium ? 0.75 : 0.45} />
          <path d="M130 270 H270 L290 305 H110 Z" fill={premium ? "#a3e635" : "#334155"} opacity={premium ? 0.75 : 0.45} />
          <path d="M95 130 V270 L130 250 V150 Z" fill={premium ? "#84cc16" : "#334155"} opacity={premium ? 0.7 : 0.4} />
          <path d="M305 130 V270 L270 250 V150 Z" fill={premium ? "#84cc16" : "#334155"} opacity={premium ? 0.7 : 0.4} />

          <rect x="135" y="135" width="130" height="130" rx="12" fill="url(#pitch)" stroke="#f8fafc" strokeWidth="2" />
          <circle cx="200" cy="200" r="22" fill="none" stroke="white" strokeOpacity="0.8" />
          <line x1="135" y1="200" x2="265" y2="200" stroke="white" strokeOpacity="0.7" />
          <rect x="135" y="170" width="24" height="60" fill="none" stroke="white" strokeOpacity="0.65" />
          <rect x="241" y="170" width="24" height="60" fill="none" stroke="white" strokeOpacity="0.65" />

          {/* Selected seat dots */}
          {Array.from({ length: quantity }).map((_, i) => {
            const cx = premium ? 200 + (i === 0 ? -18 : 18) : 200 + (i === 0 ? -70 : 70);
            const cy = premium ? 118 : 58;
            return (
              <g key={i} className="float-y">
                <circle cx={cx} cy={cy} r="9" fill="#facc15" stroke="white" strokeWidth="2" />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-lime-400" /> Premium zones
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Standard zones
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" /> Selected
        </span>
      </div>
    </div>
  );
}
