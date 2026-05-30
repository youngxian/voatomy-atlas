'use client';

import { TrendingUp, ArrowUpRight, Gauge } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

interface VelocityCardProps {
  plannedVelocity: number;
  actualVelocity: number;
  activeTotalPoints: number;
  activeCompletedPoints: number;
  sprintTotalDays: number;
  safeTodayIndex: number;
  forecastPts: number;
}

export function VelocityCard({
  plannedVelocity,
  actualVelocity,
  activeTotalPoints,
  activeCompletedPoints,
  sprintTotalDays,
  safeTodayIndex,
  forecastPts,
}: VelocityCardProps) {
  const velocityPct = plannedVelocity > 0 ? Math.min(150, (actualVelocity / plannedVelocity) * 100) : 0;

  return (
    <Reveal delay={0.25}>
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden h-full" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="p-6">
          <h2 className="text-base font-bold text-foreground mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            Velocity vs Plan
          </h2>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Planned Velocity</span>
                <span className="text-sm font-mono font-bold text-foreground">{(plannedVelocity || 0).toFixed(1)} pts/day</span>
              </div>
              <div className="h-2.5 bg-border/30 rounded-full overflow-hidden">
                <div className="h-full bg-muted-foreground/30 rounded-full" style={{ width: '100%' }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{activeTotalPoints} pts over {sprintTotalDays} days</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Actual Velocity</span>
                <span className="text-sm font-mono font-bold text-success flex items-center gap-1">
                  {(actualVelocity || 0).toFixed(1)} pts/day
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="h-2.5 bg-border/30 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{
                  width: `${velocityPct}%`,
                  background: 'var(--primary)',
                  animation: 'bd-bar-grow 1s ease-out 0.5s both',
                }} />
              </div>
              <p className="text-xs text-success mt-1.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {activeCompletedPoints} pts completed in {safeTodayIndex} days — {forecastPts >= activeTotalPoints ? 'ahead of plan' : 'tracking'}
              </p>
            </div>

            <div className="rounded-xl p-4 border border-primary/15" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.04), transparent)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Forecast</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                At current pace, team will complete <span className={`font-bold ${forecastPts >= activeTotalPoints ? 'text-success' : 'text-warning'}`}>~{forecastPts} pts</span> by sprint end.
                {forecastPts >= activeTotalPoints
                  ? <> That is <span className="text-success font-bold">{forecastPts - activeTotalPoints} pts</span> above the {activeTotalPoints} pt commitment.</>
                  : <> That is <span className="text-warning font-bold">{activeTotalPoints - forecastPts} pts</span> below the {activeTotalPoints} pt commitment.</>
                }
              </p>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-1.5 bg-border/30 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: '100%',
                    background: 'var(--primary)',
                    animation: 'bd-bar-grow 1.2s ease-out 0.7s both',
                  }} />
                </div>
                <span className={`text-xs font-mono font-bold ${forecastPts >= activeTotalPoints ? 'text-success' : 'text-warning'}`}>{activeTotalPoints > 0 ? Math.round((forecastPts / activeTotalPoints) * 100) : 0}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
