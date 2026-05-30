'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  Loader2,
  Timer,
} from 'lucide-react';
import { Card } from '@/components/ui';
import * as api from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { delayRiskConfig, mapAPIDelayRiskToMock } from '@/lib/ticket-utils';
import { DelayCard } from './ticket-cards';

export function AnticipateDelaysTab({ apiDelayRisks }: { apiDelayRisks: api.DelayRisk[] | null }) {
  const { activeProjectId } = useProject();

  if (!activeProjectId) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No active project selected</p>
      </div>
    );
  }

  if (apiDelayRisks === null) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Loading delay risks...</span>
      </div>
    );
  }

  const delays = apiDelayRisks.map(mapAPIDelayRiskToMock);
  const imminent = delays.filter((d) => d.risk === 'imminent');
  const likely = delays.filter((d) => d.risk === 'likely');
  const possible = delays.filter((d) => d.risk === 'possible');

  const totalDelayDays = delays.reduce((s, d) => s + d.delayDays, 0);
  const totalRevenueAtRisk = delays.reduce((s, d) => s + (d.revenueAtRisk || 0), 0);
  const avgProbability = delays.length > 0 ? Math.round(delays.reduce((s, d) => s + d.probability, 0) / delays.length) : 0;

  if (delays.length === 0) {
    return (
      <div className="text-center py-16">
        <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
        <h3 className="text-base font-semibold text-foreground mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
          No delay risks detected
        </h3>
        <p className="text-sm text-muted-foreground">
          ATLAS did not flag any tickets with elevated delay probability for this project.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bento-card rounded-2xl">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">At-Risk Tickets</p>
          <p className="text-2xl font-bold text-destructive" style={{ fontFamily: 'var(--font-serif)' }}>
            {delays.length}
          </p>
        </Card>
        <Card className="bento-card rounded-2xl">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total Delay Risk</p>
          <p className="text-2xl font-bold text-warning" style={{ fontFamily: 'var(--font-serif)' }}>
            {totalDelayDays}<span className="text-sm text-secondary-foreground ml-0.5">days</span>
          </p>
        </Card>
        <Card className="bento-card rounded-2xl">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Revenue at Risk</p>
          <p className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>
            ${(totalRevenueAtRisk / 1000).toFixed(0)}K
          </p>
        </Card>
        <Card className="bento-card rounded-2xl">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Avg Probability</p>
          <p className="text-2xl font-bold text-warning" style={{ fontFamily: 'var(--font-serif)' }}>
            {avgProbability}%
          </p>
        </Card>
      </div>

      {/* Risk heatmap */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>Delay Risk Heatmap</h3>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {delays.map((d) => {
            const cfg = delayRiskConfig[d.risk];
            return (
              <div key={d.id} className={`rounded-lg ${cfg.bg} border ${cfg.border} p-3 text-center`}>
                <span className="text-xs font-mono font-bold text-primary">{d.ticketId}</span>
                <p className={`text-lg font-bold tabular-nums mt-1 ${cfg.color}`}>{d.probability}%</p>
                <p className="text-[10px] text-muted-foreground">+{d.delayDays}d</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Delay cards grouped by severity */}
      {imminent.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-destructive uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" />
            Imminent ({imminent.length})
          </h3>
          {imminent.map((d, i) => <DelayCard key={d.id} delay={d} index={i} />)}
        </div>
      )}

      {likely.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-warning uppercase tracking-wider flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5" />
            Likely ({likely.length})
          </h3>
          {likely.map((d, i) => <DelayCard key={d.id} delay={d} index={i} />)}
        </div>
      )}

      {possible.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-warning uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Possible ({possible.length})
          </h3>
          {possible.map((d, i) => <DelayCard key={d.id} delay={d} index={i} />)}
        </div>
      )}
    </div>
  );
}
