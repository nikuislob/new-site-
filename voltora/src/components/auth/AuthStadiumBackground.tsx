"use client";

export function AuthStadiumBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(91,33,182,0.45),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(37,99,235,0.4),transparent_45%),linear-gradient(160deg,#0b1026_0%,#1a0b3a_40%,#071428_100%)]" />
      <div className="stadium-beam left-[12%] opacity-70" />
      <div className="stadium-beam left-[48%]" style={{ animationDelay: "1.6s" }} />
      <div className="stadium-beam left-[78%]" style={{ animationDelay: "3s" }} />

      {/* Floating particles */}
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="particle"
          style={{
            left: `${(i * 17) % 100}%`,
            top: `${(i * 29) % 90}%`,
            animationDelay: `${i * 0.35}s`,
            width: i % 3 === 0 ? 6 : 4,
            height: i % 3 === 0 ? 6 : 4,
          }}
        />
      ))}

      <svg className="absolute bottom-[-8%] left-1/2 h-[55%] w-[140%] -translate-x-1/2 opacity-80" viewBox="0 0 1200 500">
        <defs>
          <linearGradient id="authPitch" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>
        </defs>
        <ellipse cx="600" cy="360" rx="480" ry="110" fill="rgba(99,102,241,0.18)" />
        <rect x="390" y="250" width="420" height="180" rx="16" fill="url(#authPitch)" opacity="0.85" />
        <rect x="390" y="250" width="420" height="180" rx="16" fill="none" stroke="rgba(250,204,21,0.45)" />
        <circle cx="600" cy="340" r="36" fill="none" stroke="rgba(255,255,255,0.45)" />
        <line x1="600" y1="250" x2="600" y2="430" stroke="rgba(255,255,255,0.35)" />
        {[220, 360, 500, 640, 780, 920].map((x, i) => (
          <g key={x}>
            <rect x={x} y={80 + (i % 2) * 18} width="8" height="70" fill="rgba(224,242,254,0.35)" />
            <circle cx={x + 4} cy={78 + (i % 2) * 18} r="12" fill="rgba(250,204,21,0.55)" className="animate-pulse-soft" />
          </g>
        ))}
      </svg>

      <div className="absolute inset-0 bg-gradient-to-t from-[#070b1c] via-transparent to-[#070b1c]/40" />
    </div>
  );
}
