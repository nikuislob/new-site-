"use client";

import { useMemo, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { useChat } from "@/components/providers/ChatProvider";
import { Button } from "@/components/ui/Button";

export type SeatView = {
  id: string;
  section: string;
  block: string;
  row: string;
  seatNumber: string;
  status: string;
  posX: number;
  posY: number;
  zoneId: string;
  zoneCode: string;
  zoneName: string;
  viewingQuality: string;
  svgPathId: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  priceCents: number;
  description: string;
  available: boolean;
};

type Props = {
  seats: SeatView[];
  selectedIds: string[];
  onToggle: (seat: SeatView) => void;
  maxSeats?: number;
  onBulkRequest?: () => void;
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

export function InteractiveStadium({
  seats,
  selectedIds,
  onToggle,
  maxSeats = 2,
  onBulkRequest,
}: Props) {
  const { openWithContext } = useChat();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobileSeat, setMobileSeat] = useState<SeatView | null>(null);
  const [groupOpen, setGroupOpen] = useState(false);
  const [scale, setScale] = useState(1);

  const hovered = seats.find((s) => s.id === hoveredId) || null;
  const selected = seats.filter((s) => selectedIds.includes(s.id));

  const zoneMeta = useMemo(() => {
    const map = new Map<string, { quality: string; svgPathId: string }>();
    for (const seat of seats) {
      if (!map.has(seat.svgPathId)) {
        map.set(seat.svgPathId, { quality: seat.viewingQuality, svgPathId: seat.svgPathId });
      }
    }
    return map;
  }, [seats]);

  const handleSeatClick = (seat: SeatView) => {
    if (!seat.available && !selectedIds.includes(seat.id)) return;
    if (!selectedIds.includes(seat.id) && selectedIds.length >= maxSeats) {
      setGroupOpen(true);
      onBulkRequest?.();
      return;
    }
    // Mobile: open bottom sheet first if not selected
    if (typeof window !== "undefined" && window.innerWidth < 768 && !selectedIds.includes(seat.id)) {
      setMobileSeat(seat);
      return;
    }
    onToggle(seat);
  };

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1.45fr_0.85fr]">
        <div className="glass-panel relative overflow-hidden p-3 md:p-5">
          <div className="pointer-events-none absolute inset-0">
            <div className="stadium-beam left-[8%]" />
            <div className="stadium-beam left-[55%]" style={{ animationDelay: "2.2s" }} />
          </div>

          <div className="relative z-10 mb-3 flex items-center justify-between gap-2">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">
              Pinch / zoom · Tap seats
            </div>
            <div className="flex gap-2">
              <button type="button" className="rounded-full border border-white/15 px-3 py-1 text-xs" onClick={() => setScale((s) => Math.max(0.8, s - 0.15))}>
                −
              </button>
              <button type="button" className="rounded-full border border-white/15 px-3 py-1 text-xs" onClick={() => setScale((s) => Math.min(1.8, s + 0.15))}>
                +
              </button>
            </div>
          </div>

          <div className="relative overflow-auto rounded-2xl">
            <svg
              viewBox="0 0 400 400"
              className="relative z-10 mx-auto h-auto w-full max-w-[620px] origin-center transition-transform duration-300"
              style={{ transform: `scale(${scale})` }}
              role="img"
              aria-label="Interactive stadium seat map"
            >
              <defs>
                <radialGradient id="pitchGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#4ade80" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#166534" stopOpacity="0.95" />
                </radialGradient>
                <linearGradient id="zoneStd" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.75" />
                </linearGradient>
                <linearGradient id="zoneGood" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#0f766e" stopOpacity="0.8" />
                </linearGradient>
                <filter id="seatGlow">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <ellipse cx="200" cy="200" rx="190" ry="190" fill="#0b1026" stroke="rgba(250,204,21,0.2)" />
              {[...zoneMeta.entries()].map(([svgId, meta]) => (
                <path
                  key={svgId}
                  d={ZONE_PATHS[svgId]}
                  fill={meta.quality === "GOOD" ? "url(#zoneGood)" : "url(#zoneStd)"}
                  stroke="rgba(255,255,255,0.18)"
                  className="animate-stadium-in"
                />
              ))}

              <rect x="130" y="130" width="140" height="140" rx="10" fill="url(#pitchGlow)" stroke="#facc15" strokeWidth="1.5" />
              <circle cx="200" cy="200" r="24" fill="none" stroke="rgba(255,255,255,0.65)" />
              <line x1="130" y1="200" x2="270" y2="200" stroke="rgba(255,255,255,0.5)" />
              <rect x="130" y="165" width="28" height="70" fill="none" stroke="rgba(255,255,255,0.45)" />
              <rect x="242" y="165" width="28" height="70" fill="none" stroke="rgba(255,255,255,0.45)" />

              {seats.map((seat) => {
                const isSelected = selectedIds.includes(seat.id);
                const isHovered = hoveredId === seat.id;
                const isAvail = seat.available || isSelected;
                const fill = isSelected
                  ? "#facc15"
                  : !isAvail
                    ? "rgba(148,163,184,0.28)"
                    : seat.viewingQuality === "GOOD"
                      ? "#22d3ee"
                      : "#818cf8";
                return (
                  <g key={seat.id}>
                    <circle
                      cx={seat.posX}
                      cy={seat.posY}
                      r={isSelected || isHovered ? 7.5 : 5.5}
                      fill={fill}
                      stroke={isSelected ? "#fff" : "rgba(255,255,255,0.35)"}
                      strokeWidth={isSelected ? 2 : 1}
                      filter={isSelected || isHovered ? "url(#seatGlow)" : undefined}
                      className={cn(
                        "transition-all duration-200",
                        isAvail ? "cursor-pointer" : "cursor-not-allowed"
                      )}
                      tabIndex={isAvail ? 0 : -1}
                      role="button"
                      aria-label={`Section ${seat.section}, Block ${seat.block}, Row ${seat.row}, Seat ${seat.seatNumber}, ${seat.categoryName}, ${formatCurrency(seat.priceCents)}, ${isAvail ? "available" : "unavailable"}`}
                      aria-pressed={isSelected}
                      onMouseEnter={() => setHoveredId(seat.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onFocus={() => setHoveredId(seat.id)}
                      onBlur={() => setHoveredId(null)}
                      onClick={() => handleSeatClick(seat)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSeatClick(seat);
                        }
                      }}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-xs text-white/65">
            <Legend color="#818cf8" label="Standard available" />
            <Legend color="#22d3ee" label="Good view available" />
            <Legend color="#facc15" label="Selected" />
            <Legend color="rgba(148,163,184,0.45)" label="Unavailable" />
          </div>
        </div>

        <div className="glass-panel hidden p-5 lg:block">
          <h3 className="font-display text-2xl tracking-[0.08em] text-white">Seat Details</h3>
          {(hovered || selected[selected.length - 1]) ? (
            <SeatInfoCard seat={(hovered || selected[selected.length - 1])!} />
          ) : (
            <p className="mt-4 text-sm text-white/60">
              Hover or tap an available seat to preview section, block, row, and price.
            </p>
          )}

          <div className="mt-6">
            <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">
              Accessible seat list
            </h4>
            <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
              {seats
                .filter((s) => s.available || selectedIds.includes(s.id))
                .map((seat) => (
                  <li key={seat.id}>
                    <button
                      type="button"
                      onClick={() => handleSeatClick(seat)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition",
                        selectedIds.includes(seat.id)
                          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                          : "border-white/10 bg-black/20 hover:border-white/25"
                      )}
                    >
                      <span>
                        <span className="block text-sm font-semibold text-white">
                          Sec {seat.section} · Row {seat.row} · Seat {seat.seatNumber}
                        </span>
                        <span className="text-xs text-white/55">
                          {seat.categoryName} · Block {seat.block}
                        </span>
                      </span>
                      <span className="text-sm font-bold text-[var(--brand)]">
                        {formatCurrency(seat.priceCents)}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Mobile bottom sheet */}
      {mobileSeat ? (
        <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border border-white/15 bg-[#0b1026]/96 p-5 backdrop-blur-xl lg:hidden">
          <SeatInfoCard seat={mobileSeat} />
          <div className="mt-4 flex gap-2">
            <Button
              fullWidth
              className="btn-glow"
              onClick={() => {
                onToggle(mobileSeat);
                setMobileSeat(null);
              }}
            >
              {selectedIds.includes(mobileSeat.id) ? "Remove seat" : "Select seat"}
            </Button>
            <Button variant="secondary" fullWidth onClick={() => setMobileSeat(null)}>
              Close
            </Button>
          </div>
        </div>
      ) : null}

      <Modal open={groupOpen} onClose={() => setGroupOpen(false)} title="Need more than 2 tickets?">
        <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
          For group or bulk ticket bookings, please contact our support team.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button
            fullWidth
            className="btn-glow"
            onClick={() => {
              setGroupOpen(false);
              openWithContext({
                tag: "BULK_TICKET_REQUEST",
                subject: "Bulk ticket request",
                message: "Customer is interested in purchasing more than 2 tickets.",
              });
            }}
          >
            CHAT NOW
          </Button>
          <Button fullWidth variant="secondary" onClick={() => setGroupOpen(false)}>
            Keep 2 seats
          </Button>
        </div>
      </Modal>
    </>
  );
}

function SeatInfoCard({ seat }: { seat: SeatView }) {
  return (
    <div className="mt-4 animate-fade-up rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/10 to-cyan-500/10 p-4">
      <div className="font-display text-3xl text-white">SECTION {seat.section}</div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-white/40">Block</div>
          <div className="font-bold text-white">{seat.block}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-white/40">Row</div>
          <div className="font-bold text-white">{seat.row}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-white/40">Seat</div>
          <div className="font-bold text-white">{seat.seatNumber}</div>
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="text-sm font-bold text-cyan-300">{seat.categoryName}</div>
          <div className="text-xs text-white/55">{seat.zoneName}</div>
        </div>
        <div className="text-right">
          <div className="font-display text-3xl text-[var(--accent)]">
            {formatCurrency(seat.priceCents)}
          </div>
          <span className={`badge ${seat.available ? "badge-success" : "badge-danger"}`}>
            {seat.available ? "AVAILABLE" : seat.status}
          </span>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
