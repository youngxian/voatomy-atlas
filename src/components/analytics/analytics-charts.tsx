'use client';

export function Avatar({ initials, color, size = 'sm' }: { initials: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-7 h-7 text-[10px]', md: 'w-9 h-9 text-xs', lg: 'w-11 h-11 text-sm' };
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}
    >
      {initials}
    </div>
  );
}

export function MiniSparkline({ values, color, height = 24 }: { values: number[]; color: string; height?: number }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 60;
  const h = height;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ strokeDasharray: 200, animation: 'analytics-sparkline-draw 1.5s ease-out forwards' }}
      />
      {values.length > 0 && (() => {
        const lastX = w;
        const lastY = h - ((values[values.length - 1] - min) / range) * (h - 4) - 2;
        return <circle cx={lastX} cy={lastY} r="2.5" fill={color} />;
      })()}
    </svg>
  );
}

export function WorkloadDonut({ data, size = 48 }: { data: { frontend: number; backend: number; infra: number }; size?: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const total = data.frontend + data.backend + data.infra;
  const segments = [
    { value: data.frontend, color: '#ec4899', label: 'FE' },
    { value: data.backend, color: 'var(--primary)', label: 'BE' },
    { value: data.infra, color: '#06b6d4', label: 'Infra' },
  ];

  let offset = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dashLen = pct * c;
        const dashGap = c - dashLen;
        const rotation = (offset / total) * 360 - 90;
        offset += seg.value;
        return (
          <circle
            key={i}
            cx="24" cy="24" r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="6"
            strokeDasharray={`${dashLen} ${dashGap}`}
            transform={`rotate(${rotation} 24 24)`}
            style={{ animation: `analytics-pie-fill 1s ease-out ${i * 0.2}s both` }}
            strokeLinecap="butt"
          />
        );
      })}
    </svg>
  );
}

export function HeatCell({ value, max }: { value: number; max: number }) {
  const intensity = max > 0 ? value / max : 0;
  return (
    <div
      className="w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-bold tabular-nums transition-all duration-200 hover:scale-110"
      style={{
        background: value === 0
          ? 'var(--secondary)'
          : `color-mix(in srgb, var(--primary) ${(0.1 + intensity * 0.6) * 100}%, transparent)`,
        color: value === 0 ? 'var(--border)' : intensity > 0.5 ? 'var(--primary-foreground)' : 'var(--primary)',
        border: `1px solid ${value === 0 ? 'var(--border)' : `color-mix(in srgb, var(--primary) ${(0.15 + intensity * 0.3) * 100}%, transparent)`}`,
      }}
    >
      {value || '-'}
    </div>
  );
}
