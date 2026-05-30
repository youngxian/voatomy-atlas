'use client';

import { Reveal } from '@/components/Reveal';
import { Card, Badge } from '@/components/ui';
import { estimationComparison, moduleAccuracy } from '@/lib/analytics-mock';
import type { AccuracyHistory, ModuleAccuracy } from '@/lib/api';

const PLACEHOLDER = '—';

interface AccuracyMatrixProps {
  apiAccuracyHistory?: AccuracyHistory | null;
  apiModuleAccuracy?: ModuleAccuracy | null;
}

export function AccuracyMatrix({ apiAccuracyHistory, apiModuleAccuracy }: AccuracyMatrixProps = {}) {
  const hasHistory = apiAccuracyHistory?.entries?.length && apiAccuracyHistory.entries.length > 0;
  const hasModules = apiModuleAccuracy?.modules?.length && apiModuleAccuracy.modules.length > 0;
  const historyEntries = hasHistory ? apiAccuracyHistory!.entries : estimationComparison;
  const moduleEntries = hasModules
    ? apiModuleAccuracy!.modules.map((m) => ({ module: m.label || PLACEHOLDER, atlas: Math.round(m.accuracy_pct), team: 0, actual: m.ticket_count }))
    : moduleAccuracy;

  return (
    <Reveal delay={0.35}>
      <div className="pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="winboard-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-foreground">{hasHistory ? 'Accuracy by Sprint' : 'ATLAS vs Team Estimation'}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{hasHistory ? 'Estimation accuracy per sprint' : 'Win/loss tracking per sprint'}</p>
              </div>
              {!hasHistory && <Badge variant="orange">ATLAS leads 28-10</Badge>}
            </div>
            <div className="space-y-3">
              {hasHistory
                ? historyEntries.map((entry: { sprint_name?: string; accuracy_pct?: number; sprint?: string; atlasWins?: number; teamWins?: number; ties?: number }, i) => {
                    const name = 'sprint_name' in entry ? entry.sprint_name : (entry as { sprint: string }).sprint;
                    const pct = 'accuracy_pct' in entry ? entry.accuracy_pct : undefined;
                    return (
                      <div key={`${name}-${i}`} style={{ animation: `analytics-slide-in 0.4s ease-out ${i * 0.1}s both` }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-muted-foreground font-medium">{name || PLACEHOLDER}</span>
                          <span className="text-[10px] font-bold text-primary tabular-nums">{pct != null ? `${Math.round(pct)}%` : PLACEHOLDER}</span>
                        </div>
                        <div className="h-2.5 rounded-full overflow-hidden bg-border">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct ?? 0}%`, animation: 'analytics-bar-grow-x 0.8s ease-out both' }} />
                        </div>
                      </div>
                    );
                  })
                : estimationComparison.map((sprint, i) => {
                const total = sprint.atlasWins + sprint.teamWins + sprint.ties;
                const atlasPct = (sprint.atlasWins / total) * 100;
                const teamPct = (sprint.teamWins / total) * 100;
                return (
                  <div key={sprint.sprint} style={{ animation: `analytics-slide-in 0.4s ease-out ${i * 0.1}s both` }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground font-medium">{sprint.sprint}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-primary font-bold">ATLAS {sprint.atlasWins}</span>
                        <span className="text-[10px] text-muted-foreground">Tie {sprint.ties}</span>
                        <span className="text-[10px] text-[#8b5cf6] font-bold">Team {sprint.teamWins}</span>
                      </div>
                    </div>
                    <div className="flex h-2.5 rounded-full overflow-hidden bg-border">
                      <div className="h-full rounded-l-full bg-primary" style={{ width: `${atlasPct}%`, animation: 'analytics-bar-grow-x 0.8s ease-out both' }} />
                      {sprint.ties > 0 && <div className="h-full" style={{ width: `${(sprint.ties / total) * 100}%`, background: 'var(--muted)' }} />}
                      <div className="h-full rounded-r-full" style={{ width: `${teamPct}%`, background: '#8b5cf6', animation: 'analytics-bar-grow-x 0.8s ease-out 0.1s both' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="winboard-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-foreground">By-Module Accuracy</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{hasModules ? 'Estimation accuracy by module' : 'ATLAS vs Team estimation accuracy'}</p>
              </div>
              {!hasModules && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm bg-primary" />
                    <span className="text-[10px] text-muted-foreground">ATLAS</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm bg-[#8b5cf6]" />
                    <span className="text-[10px] text-muted-foreground">Team</span>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {moduleEntries.length > 0 ? (
                moduleEntries.map((mod, i) => (
                  <div key={mod.module} style={{ animation: `analytics-slide-in 0.4s ease-out ${i * 0.08}s both` }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-foreground font-medium w-24 truncate">{mod.module}</span>
                      <div className="flex items-center gap-2">
                        {hasModules ? (
                          <span className="text-[10px] font-bold text-primary tabular-nums w-8 text-right">{mod.atlas}%</span>
                        ) : (
                          <>
                            <span className="text-[10px] font-bold text-primary tabular-nums w-8 text-right">{mod.atlas}%</span>
                            <span className="text-[10px] font-bold text-[#8b5cf6] tabular-nums w-8 text-right">{mod.team}%</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="relative h-2 bg-border rounded-full overflow-hidden">
                      <div className="absolute inset-y-0 left-0 rounded-full bg-primary/60" style={{ width: `${mod.atlas}%`, animation: 'analytics-bar-grow-x 0.8s ease-out both' }} />
                      {!hasModules && mod.team > 0 && (
                        <div className="absolute inset-y-0 left-0 rounded-full bg-[#8b5cf6]/40 h-full" style={{ width: `${mod.team}%`, animation: 'analytics-bar-grow-x 0.8s ease-out 0.1s both', left: `${mod.atlas}%` }} />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground py-4">{PLACEHOLDER}</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </Reveal>
  );
}
