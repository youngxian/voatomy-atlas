'use client';

import { BarChart3 } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { Card, EmptyState } from '@/components/ui';
import type { SprintVelocity } from '@/lib/analytics-mock';

interface VelocityChartProps {
  effectiveVelocityData: SprintVelocity[];
  maxVelocity: number;
  targetLine: number;
}

export function VelocityChart({ effectiveVelocityData, maxVelocity, targetLine }: VelocityChartProps) {
  if (effectiveVelocityData.length === 0) {
    return (
      <Reveal delay={0.2}>
        <div className="pb-6">
          <Card className="winboard-card p-6">
            <EmptyState
              icon={BarChart3}
              title="No velocity data yet"
              description="Complete sprints to see committed vs delivered velocity trends. Velocity data will appear here once you have sprint history."
              className="py-12"
            />
          </Card>
        </div>
      </Reveal>
    );
  }

  return (
    <Reveal delay={0.2}>
      <div className="pb-6">
        <Card className="winboard-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Velocity Trend</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Committed vs Delivered across {effectiveVelocityData.length} sprints</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-primary/40" />
                <span className="text-[10px] text-muted-foreground">Committed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                <span className="text-[10px] text-muted-foreground">Delivered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-px bg-destructive" style={{ borderTop: '2px dashed var(--destructive)' }} />
                <span className="text-[10px] text-muted-foreground">Target (42)</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-0 right-0" style={{ bottom: `${(targetLine / maxVelocity) * 200}px` }}>
              <div className="w-full border-t-2 border-dashed border-destructive/30" />
              <span className="absolute -top-4 right-0 text-[10px] text-destructive font-medium">{targetLine} pts</span>
            </div>

            <div className="flex items-end gap-4 h-[220px] px-2">
              {effectiveVelocityData.map((sprint, i) => {
                const isLatest = i === effectiveVelocityData.length - 1;
                const committedH = (sprint.committed / maxVelocity) * 200;
                const deliveredH = (sprint.delivered / maxVelocity) * 200;
                return (
                  <div key={`${sprint.sprint}-${i}`} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex items-center gap-0.5 mb-1">
                      <span className={`text-[10px] tabular-nums font-medium ${isLatest ? 'text-primary' : 'text-muted-foreground'}`}>
                        {sprint.delivered}
                      </span>
                      <span className="text-[10px] text-border">/</span>
                      <span className="text-[10px] tabular-nums text-muted-foreground">{sprint.committed}</span>
                    </div>
                    <div className="w-full flex gap-1 items-end" style={{ height: '200px' }}>
                      <div className="flex-1 relative">
                        <div
                          className="absolute bottom-0 left-0 right-0 rounded-t-md"
                          style={{
                            height: `${committedH}px`,
                            background: isLatest ? 'color-mix(in srgb, var(--primary) 20%, transparent)' : 'var(--secondary)',
                            border: isLatest ? '1px solid color-mix(in srgb, var(--primary) 30%, transparent)' : '1px solid var(--border)',
                            borderBottom: 'none',
                            transformOrigin: 'bottom',
                            animation: `analytics-bar-grow 0.8s ease-out ${i * 0.1}s both`,
                          }}
                        />
                      </div>
                      <div className="flex-1 relative">
                        <div
                          className="absolute bottom-0 left-0 right-0 rounded-t-md"
                          style={{
                            height: `${deliveredH}px`,
                            background: isLatest
                              ? 'linear-gradient(180deg, var(--primary), color-mix(in srgb, var(--primary) 67%, transparent))'
                              : 'linear-gradient(180deg, var(--muted-foreground), color-mix(in srgb, var(--muted-foreground) 50%, var(--secondary)))',
                            boxShadow: isLatest ? '0 0 16px color-mix(in srgb, var(--primary) 25%, transparent)' : 'none',
                            transformOrigin: 'bottom',
                            animation: `analytics-bar-grow 0.8s ease-out ${i * 0.1 + 0.05}s both`,
                          }}
                        />
                      </div>
                    </div>
                    <span className={`text-xs mt-1 font-medium ${isLatest ? 'text-primary' : 'text-muted-foreground'}`}>{sprint.sprint}</span>
                  </div>
                );
              })}
            </div>

            <div className="absolute bottom-5 left-0 right-0 pointer-events-none px-2">
              <svg className="w-full" height="200" viewBox="0 0 600 200" preserveAspectRatio="none">
                <polyline
                  points={effectiveVelocityData.map((s, i) => `${(i / Math.max(1, effectiveVelocityData.length - 1)) * 600},${200 - (s.delivered / maxVelocity) * 200}`).join(' ')}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.5"
                  strokeDasharray="4 4"
                />
              </svg>
            </div>
          </div>
        </Card>
      </div>
    </Reveal>
  );
}
