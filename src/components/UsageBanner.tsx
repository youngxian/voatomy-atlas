'use client';

import { useState } from 'react';
import { X, Zap } from 'lucide-react';
import { usePlan } from '@/lib/plan';

export default function UsageBanner() {
  const { isFreeTier, limits, usage } = usePlan();
  const [dismissed, setDismissed] = useState(false);

  if (!isFreeTier || dismissed) return null;

  const aiUsed = usage.aiPlansUsed;
  const aiMax = limits.aiPlansPerMonth;
  const pct = aiMax > 0 ? Math.min((aiUsed / aiMax) * 100, 100) : 0;
  const atLimit = aiUsed >= aiMax;

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 mb-4 ${atLimit ? 'border-warning/30 bg-warning/10' : 'border-border bg-card'}`}>
      <Zap className={`w-4 h-4 shrink-0 ${atLimit ? 'text-warning' : 'text-primary'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-foreground">
            {aiUsed} of {aiMax} AI sprint plans used this month
          </span>
          <span className="text-[10px] text-muted-foreground">{Math.round(pct)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-border/60 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              backgroundColor: atLimit ? 'var(--warning)' : 'var(--primary)',
            }}
          />
        </div>
        {atLimit && (
          <p className="mt-1 text-[10px] text-warning font-medium">
            You&apos;ve reached your monthly limit.{' '}
            <a href="#upgrade" className="underline hover:no-underline">
              Upgrade for unlimited
            </a>
          </p>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-border/40 transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
