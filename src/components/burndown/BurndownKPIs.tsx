'use client';

import { Target, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

interface BurndownKPIsProps {
  completionPct: number;
  activeCompletedPoints: number;
  activeTotalPoints: number;
  actualVelocity: number;
  plannedVelocity: number;
  forecastPts: number;
  daysLeft: number;
}

export function BurndownKPIs({
  completionPct,
  activeCompletedPoints,
  activeTotalPoints,
  actualVelocity,
  plannedVelocity,
  forecastPts,
  daysLeft,
}: BurndownKPIsProps) {
  const stats = [
    { label: 'Completion', value: `${completionPct}%`, sub: `${activeCompletedPoints} of ${activeTotalPoints} pts`, gradient: 'from-primary to-primary', color: 'var(--primary)', pct: completionPct, icon: Target, iconBg: 'bg-primary/8 border-primary/12' },
    { label: 'Actual Velocity', value: `${actualVelocity.toFixed(1)}`, sub: `Plan: ${plannedVelocity.toFixed(1)} pts/day`, gradient: 'from-success to-success', color: 'var(--success)', pct: plannedVelocity > 0 ? (actualVelocity / plannedVelocity) * 100 : 0, unit: 'pts/day', icon: TrendingUp, iconBg: 'bg-success/8 border-success/12' },
    { label: 'Remaining', value: `${activeTotalPoints - activeCompletedPoints}`, sub: `${daysLeft} working day${daysLeft !== 1 ? 's' : ''} left`, gradient: 'from-primary to-primary', color: 'var(--primary)', pct: activeTotalPoints > 0 ? ((activeTotalPoints - activeCompletedPoints) / activeTotalPoints) * 100 : 0, unit: 'pts', icon: Clock, iconBg: 'bg-warning/8 border-warning/12' },
    { label: 'Forecast', value: `~${forecastPts}`, sub: forecastPts >= activeTotalPoints ? `+${forecastPts - activeTotalPoints} pts above target` : `${activeTotalPoints - forecastPts} pts below target`, gradient: 'from-primary to-primary', color: 'var(--primary)', pct: activeTotalPoints > 0 ? (forecastPts / activeTotalPoints) * 100 : 0, unit: 'pts', icon: Sparkles, iconBg: 'bg-primary/8 border-primary/12' },
  ];

  return (
    <Reveal delay={0.05}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const StatIcon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bd-card rounded-2xl border border-border/60 overflow-hidden bg-card bento-card"
              style={{ animationDelay: `${i * 0.08}s`, boxShadow: 'var(--shadow-bento, 0 1px 3px rgba(0,17,44,0.04), 0 1px 2px rgba(0,17,44,0.02))' }}
            >
              <div className={`h-1 bg-gradient-to-r ${stat.gradient}`} />
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${stat.iconBg}`}>
                    <StatIcon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{stat.label}</p>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-3xl font-bold tabular-nums bd-stat-value" style={{ color: stat.color, fontFamily: 'var(--font-serif, Georgia, serif)', animationDelay: `${0.2 + i * 0.1}s` }}>
                    {stat.value}
                  </p>
                  {stat.unit && <span className="text-xs text-muted-foreground">{stat.unit}</span>}
                </div>
                <p className="text-xs text-muted-foreground">{stat.sub}</p>
                <div className="h-1.5 bg-border/30 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: `${Math.min(stat.pct, 100)}%`,
                    backgroundColor: stat.color,
                    animation: `bd-bar-grow 1s ease-out ${0.3 + i * 0.1}s both`,
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Reveal>
  );
}
