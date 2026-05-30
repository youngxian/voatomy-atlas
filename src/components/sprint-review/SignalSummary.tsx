'use client';

import { Shield, Zap, Users, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui';

export function SignalSummary() {
  return (
    <Card className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Shield className="w-4 h-4 text-primary" />
        Signal Summary
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">Code Signal</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Adjusted 3 tickets upward due to module complexity in payments/ and auth/ (debt multipliers 2.8x and 1.4x).
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">Capacity Signal</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Reduced effective capacity from 56 to 54 pts after accounting for Sarah&apos;s PTO (wk 1) and Jordan&apos;s on-call (wk 2).
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-xs font-semibold text-foreground">Customer Signal</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Elevated COMP-218 and COMP-220 priority due to 12 support tickets and a P1 enterprise escalation.
          </p>
        </div>
      </div>
    </Card>
  );
}
