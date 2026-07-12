export function HeroStadium() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(26,143,74,0.28),transparent_55%),linear-gradient(180deg,#050b14_0%,#071525_45%,#050b14_100%)]" />
      <div className="stadium-beam left-[8%] animate-lights" />
      <div className="stadium-beam left-[42%]" style={{ animationDelay: "1.2s" }} />
      <div className="stadium-beam left-[72%]" style={{ animationDelay: "2.4s" }} />

      <svg
        className="absolute inset-x-0 bottom-[-8%] mx-auto h-[70%] w-[140%] max-w-none opacity-90 md:bottom-[-12%] md:h-[78%] md:w-[110%]"
        viewBox="0 0 1200 700"
        fill="none"
      >
        <ellipse cx="600" cy="520" rx="520" ry="140" fill="#07111d" stroke="rgba(240,199,94,0.2)" />
        <ellipse cx="600" cy="500" rx="460" ry="118" fill="#0b1a2c" />
        <ellipse cx="600" cy="480" rx="390" ry="95" fill="#102338" />
        <rect x="420" y="390" width="360" height="190" rx="18" fill="#146b3a" />
        <rect x="420" y="390" width="360" height="190" rx="18" stroke="#2ee59d" strokeOpacity="0.55" />
        <line x1="600" y1="390" x2="600" y2="580" stroke="rgba(255,255,255,0.35)" />
        <circle cx="600" cy="485" r="42" stroke="rgba(255,255,255,0.4)" />
        <path d="M180 430 C 320 250, 880 250, 1020 430" stroke="rgba(232,244,255,0.18)" strokeWidth="18" />
        <path d="M220 450 C 340 290, 860 290, 980 450" stroke="rgba(240,199,94,0.12)" strokeWidth="10" />
        {[200, 320, 440, 560, 680, 800, 920].map((x, i) => (
          <g key={x}>
            <rect x={x} y={120 + (i % 2) * 20} width="10" height="90" fill="rgba(232,244,255,0.25)" />
            <circle cx={x + 5} cy={118 + (i % 2) * 20} r="14" fill="rgba(232,244,255,0.55)" />
          </g>
        ))}
        <ellipse cx="600" cy="560" rx="480" ry="40" fill="rgba(0,0,0,0.35)" />
      </svg>

      <div className="absolute inset-0 bg-gradient-to-t from-[#050b14] via-transparent to-[#050b14]/55" />
    </div>
  );
}
