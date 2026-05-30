'use client';

import { Info } from 'lucide-react';
import { Card } from '@/components/ui';
import { estimationBreakdown, assigneeColors, assigneeInitials } from '@/lib/sprint-review-config';

export function EstimationBreakdown() {
  return (
    <div className="space-y-3 pb-8">
      <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
        <Info className="w-4 h-4 text-primary" />
        Estimation Breakdown: {estimationBreakdown.ticketId}
      </h2>
      <div style={{ animation: 'sr-border-shimmer 3s ease-in-out infinite', borderColor: 'rgba(241,110,44,0.3)' }}>
        <Card className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-white">{estimationBreakdown.title}</p>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-xs text-muted-foreground">
                Module: <span className="text-foreground font-mono">{estimationBreakdown.module}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Assignee:
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: assigneeColors[estimationBreakdown.assignee] }}>
                  {assigneeInitials[estimationBreakdown.assignee]}
                </span>
                <span className="text-foreground">{estimationBreakdown.assignee}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-muted/50 border border-border p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Team Estimate</p>
              <p className="text-2xl font-bold text-muted-foreground">{estimationBreakdown.teamEstimate}</p>
            </div>
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-primary mb-1">ATLAS Estimate</p>
              <p className="text-2xl font-bold text-primary">{estimationBreakdown.atlasEstimate}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Signal Contributions</p>
            {estimationBreakdown.signals.map((signal, idx) => {
              const SigIcon = signal.icon;
              return (
                <div key={idx} className="flex items-start gap-3 py-2 border-b border-border last:border-b-0">
                  <SigIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{signal.name}</span>
                      <span className="text-xs font-semibold text-primary tabular-nums">{signal.impact}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{signal.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">Confidence</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-warning rounded-full" style={{ width: `${estimationBreakdown.confidence}%` }} />
              </div>
              <span className="text-xs font-semibold text-warning tabular-nums">{estimationBreakdown.confidence}%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
