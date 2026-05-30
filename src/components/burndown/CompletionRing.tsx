'use client';

interface CompletionRingProps {
  pct: number;
  size?: number;
}

export function CompletionRing({ pct, size = 56 }: CompletionRingProps) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width={size} height={size} className="shrink-0" style={{ animation: 'bd-glow-ring 3s ease-in-out infinite' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={4} className="text-border/40" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="url(#ringGrad)" strokeWidth={4} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ animation: `bd-progress-fill 1.5s ease-out both`, ['--target-offset' as string]: offset }}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--primary)" />
        </linearGradient>
      </defs>
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="fill-foreground text-xs font-bold" style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}>
        {pct}%
      </text>
    </svg>
  );
}
