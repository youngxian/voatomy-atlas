'use client';

import { GitBranch, Server } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { Card, Badge } from '@/components/ui';
import { HeatCell } from './analytics-charts';

export interface ReviewMatrixRow {
  reviewer: string;
  reviews: Record<string, number>;
}

export interface PairProgrammingRow {
  pair: string;
  hours: number;
}

export interface CollaborationSectionProps {
  reviewMatrix?: ReviewMatrixRow[];
  pairProgramming?: PairProgrammingRow[];
}

export function CollaborationSection({ reviewMatrix = [], pairProgramming = [] }: CollaborationSectionProps) {
  const cols = reviewMatrix.length > 0
    ? Array.from(new Set(reviewMatrix.flatMap(r => Object.keys(r.reviews))))
    : [];

  return (
    <Reveal delay={0.45}>
      <div className="pb-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20">
            <GitBranch className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Team Collaboration Metrics</h2>
        </div>

        {(reviewMatrix.length > 0 || pairProgramming.length > 0) ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reviewMatrix.length > 0 && (
          <Card className="winboard-card p-6">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground">Code Review Participation</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Who reviews whom (last sprint)</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="w-12" />
                    {cols.map(col => (
                      <th key={col} className="px-1 py-2">
                        <span className="text-[10px] font-bold text-muted-foreground">{col}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reviewMatrix.map((row) => {
                    const vals = Object.values(row.reviews);
                    const maxR = Math.max(1, ...vals.filter(v => v > 0));
                    return (
                      <tr key={row.reviewer}>
                        <td className="py-1 pr-2">
                          <span className="text-[10px] font-bold text-muted-foreground">{row.reviewer}</span>
                        </td>
                        {cols.map(col => (
                          <td key={col} className="px-1 py-1">
                            <HeatCell value={row.reviews[col] ?? 0} max={maxR} />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <span className="text-[10px] text-muted-foreground">Intensity:</span>
              <div className="flex items-center gap-1">
                {[0.15, 0.3, 0.45, 0.6, 0.75].map((op, i) => (
                  <div key={i} className="w-4 h-3 rounded-sm" style={{ background: `color-mix(in srgb, var(--primary) ${op * 100}%, transparent)` }} />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground">Low to High</span>
            </div>
          </Card>
          )}

          <div className="space-y-6">
            {pairProgramming.length > 0 && (
            <Card className="winboard-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Pair Programming Hours</h3>
              <div className="space-y-2.5">
                {[...pairProgramming].sort((a, b) => b.hours - a.hours).map((pair, i) => {
                  const maxH = Math.max(...pairProgramming.map(p => p.hours));
                  const pct = (pair.hours / maxH) * 100;
                  return (
                    <div key={pair.pair} style={{ animation: `analytics-slide-in 0.4s ease-out ${i * 0.08}s both` }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-foreground">{pair.pair}</span>
                        <span className="text-xs font-bold text-muted-foreground tabular-nums">{pair.hours}h</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)',
                            animation: 'analytics-bar-grow-x 0.8s ease-out both',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">Total:</span>
                <span className="text-xs font-bold text-foreground">{pairProgramming.reduce((s, p) => s + p.hours, 0)} hours</span>
              </div>
            </Card>
            )}

            <Card className="winboard-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Cross-Team Dependencies</h3>
              <div className="space-y-2">
                {[
                  { team: 'Platform Team', tickets: 3, status: 'resolved', color: '#10b981' },
                  { team: 'Data Pipeline', tickets: 1, status: 'in-progress', color: '#eab308' },
                  { team: 'Mobile', tickets: 2, status: 'resolved', color: '#10b981' },
                ].map((dep, i) => (
                  <div key={dep.team} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary border border-border" style={{ animation: `analytics-fade-in-up 0.3s ease-out ${i * 0.1}s both` }}>
                    <div className="flex items-center gap-2">
                      <Server className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-foreground">{dep.team}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{dep.tickets} tickets</span>
                      <Badge variant={dep.status === 'resolved' ? 'success' : 'warning'}>
                        {dep.status === 'resolved' ? 'Resolved' : 'In Progress'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No collaboration data yet. Connect your code review and pair programming tools.</p>
        )}
      </div>
    </Reveal>
  );
}
