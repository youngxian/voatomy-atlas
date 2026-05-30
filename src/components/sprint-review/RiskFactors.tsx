'use client';

import { AlertTriangle } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { riskFactors, slideInStyle, barGrowStyle } from '@/lib/sprint-review-config';

export function RiskFactors() {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        Risk Factors
      </h2>
      <div className="space-y-3">
        {riskFactors.map((risk, idx) => {
          const RiskIcon = risk.icon;
          const severityColors: Record<string, string> = {
            critical: 'border-destructive/40 bg-destructive/5',
            high: 'border-warning/30 bg-warning/5',
            medium: 'border-warning/20 bg-warning/5',
            low: 'border-border bg-transparent',
          };
          return (
            <Card key={idx} className={`relative overflow-hidden ${severityColors[risk.severity] || ''}`}>
              {risk.severity === 'critical' && (
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.06), transparent)', backgroundSize: '200% 100%', animation: 'sr-shimmer 2s ease-in-out infinite' }} />
              )}
              <div className="flex items-start gap-3" style={slideInStyle(0.1 + idx * 0.1)}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${risk.severity === 'critical' ? 'bg-destructive/20' : risk.severity === 'high' ? 'bg-warning/20' : risk.severity === 'medium' ? 'bg-warning/20' : 'bg-muted'}`}>
                  <RiskIcon className={`w-4 h-4 ${risk.severity === 'critical' ? 'text-destructive' : risk.severity === 'high' ? 'text-warning' : risk.severity === 'medium' ? 'text-warning' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{risk.title}</span>
                    <Badge variant={risk.severity === 'critical' || risk.severity === 'high' ? 'danger' : risk.severity === 'medium' ? 'warning' : 'success'}>
                      {risk.impact}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{risk.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-muted-foreground">Probability</span>
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${risk.probability > 70 ? 'bg-destructive' : risk.probability > 40 ? 'bg-warning' : 'bg-success'}`} style={{ width: `${risk.probability}%`, ...barGrowStyle(0.5 + idx * 0.1) }} />
                    </div>
                    <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">{risk.probability}%</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
