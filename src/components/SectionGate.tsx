'use client';

import { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { usePlan, TIER_RANK } from '@/lib/plan';
import type { PlanTier } from '@/lib/plan';
import UpgradeModal from './UpgradeModal';

interface SectionGateProps {
  children: React.ReactNode;
  requiredTier: Exclude<PlanTier, 'starter'>;
  label?: string;
}

export default function SectionGate({ children, requiredTier, label }: SectionGateProps) {
  const { tier } = usePlan();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const hasAccess = TIER_RANK[tier] >= TIER_RANK[requiredTier];

  if (hasAccess) return <>{children}</>;

  const tierLabel = requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1);

  return (
    <div className="relative rounded-xl overflow-hidden">
      <div className="pointer-events-none select-none blur-[6px] opacity-50 saturate-50">
        {children}
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[2px] rounded-xl">
        <button
          onClick={() => setUpgradeOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/90 border border-border shadow-lg text-sm font-semibold text-foreground hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          <Lock className="w-3.5 h-3.5 text-muted-foreground" />
          {label ? `Unlock ${label}` : `Unlock with ${tierLabel}`}
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        targetTier={requiredTier}
        featureLabel={label}
      />
    </div>
  );
}
