'use client';

import { Plus, Ban, AlertTriangle, TrendingDown } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { Badge } from '@/components/ui';
import type { SprintTicket } from '@/lib/burndown-mock';

interface RiskIndicatorsProps {
  activeTickets: SprintTicket[];
  blockedTickets: SprintTicket[];
  actualVelocity: number;
  plannedVelocity: number;
}

export function RiskIndicators({
  activeTickets,
  blockedTickets,
  actualVelocity,
  plannedVelocity,
}: RiskIndicatorsProps) {
  const scopeAdded = 0;
  const blockedCount = blockedTickets.length;
  const atRiskTicket = activeTickets.find(t => t.status !== 'done' && t.confidence < 70);
  const lowVelocity = actualVelocity < plannedVelocity * 0.8;

  const risks = [
    {
      icon: Plus, title: 'Scope Creep',
      detail: scopeAdded > 0 ? `${scopeAdded} ticket${scopeAdded > 1 ? 's' : ''} added mid-sprint` : 'No tickets added mid-sprint',
      severity: (scopeAdded > 0 ? 'warning' : 'success') as 'warning' | 'success',
      bgClass: scopeAdded > 0 ? 'bg-warning/5' : 'bg-success/5',
      borderClass: scopeAdded > 0 ? 'border-warning/20' : 'border-success/20',
      iconBgClass: scopeAdded > 0 ? 'bg-warning/10' : 'bg-success/10',
      iconClass: scopeAdded > 0 ? 'text-warning' : 'text-success',
      badge: scopeAdded > 0 ? `+${scopeAdded}` : 'Clean',
    },
    {
      icon: Ban, title: 'Blocked Tickets',
      detail: blockedCount > 0 ? `${blockedTickets.map(t => t.id).join(', ')} blocked` : 'No blocked tickets',
      severity: (blockedCount > 0 ? 'danger' : 'success') as 'danger' | 'success',
      bgClass: blockedCount > 0 ? 'bg-destructive/5' : 'bg-success/5',
      borderClass: blockedCount > 0 ? 'border-destructive/20' : 'border-success/20',
      iconBgClass: blockedCount > 0 ? 'bg-destructive/10' : 'bg-success/10',
      iconClass: blockedCount > 0 ? 'text-destructive' : 'text-success',
      badge: blockedCount > 0 ? `${blockedCount} Blocked` : 'Clear',
    },
    {
      icon: AlertTriangle, title: 'At-Risk Tickets',
      detail: atRiskTicket ? `${atRiskTicket.id} — ${atRiskTicket.confidence}% completion confidence` : 'All active tickets on track',
      severity: (atRiskTicket ? 'warning' : 'success') as 'warning' | 'success',
      bgClass: atRiskTicket ? 'bg-warning/5' : 'bg-success/5',
      borderClass: atRiskTicket ? 'border-warning/20' : 'border-success/20',
      iconBgClass: atRiskTicket ? 'bg-warning/10' : 'bg-success/10',
      iconClass: atRiskTicket ? 'text-warning' : 'text-success',
      badge: atRiskTicket ? 'At Risk' : 'On Track',
    },
    {
      icon: TrendingDown, title: 'Velocity Health',
      detail: lowVelocity ? `Actual ${actualVelocity.toFixed(1)} vs planned ${plannedVelocity.toFixed(1)} pts/day` : `${actualVelocity.toFixed(1)} pts/day — meeting or exceeding plan`,
      severity: (lowVelocity ? 'warning' : 'success') as 'warning' | 'success',
      bgClass: lowVelocity ? 'bg-warning/5' : 'bg-success/5',
      borderClass: lowVelocity ? 'border-warning/20' : 'border-success/20',
      iconBgClass: lowVelocity ? 'bg-warning/10' : 'bg-success/10',
      iconClass: lowVelocity ? 'text-warning' : 'text-success',
      badge: lowVelocity ? 'Slow' : 'Healthy',
    },
  ];

  return (
    <Reveal delay={0.3}>
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden h-full" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="p-6">
          <h2 className="text-base font-bold text-foreground mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-warning/10 border border-warning/15 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-warning" />
            </div>
            Risk Indicators
          </h2>

          <div className="space-y-3">
            {risks.map((risk, i) => {
              const RiskIcon = risk.icon;
              return (
                <div
                  key={risk.title}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 hover:border-border/80 ${risk.bgClass} ${risk.borderClass}`}
                  style={{ animation: `bd-fade-in-up 0.4s ease-out ${i * 0.06}s both` }}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${risk.iconBgClass}`}>
                    <RiskIcon className={`w-4 h-4 ${risk.iconClass}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{risk.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{risk.detail}</p>
                  </div>
                  <Badge variant={risk.severity}>{risk.badge}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Reveal>
  );
}
