'use client';

import { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import type { PlanTier } from '@/lib/plan';
import UpgradeModal from './UpgradeModal';

interface LockedFeatureOverlayProps {
  children: React.ReactNode;
  requiredTier: Exclude<PlanTier, 'starter'>;
  featureLabel: string;
}

export default function LockedFeatureOverlay({ children, requiredTier, featureLabel }: LockedFeatureOverlayProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const tierLabel = requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1);

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[6px] opacity-60 saturate-50">
        {children}
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[2px] rounded-xl">
        <div className="text-center max-w-sm px-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1A2F2A]/[0.06]">
            <Lock className="w-5 h-5 text-[#7A8B84]" />
          </div>
          <h3 className="text-base font-bold text-[#1A2F2A] mb-1">
            {featureLabel}
          </h3>
          <p className="text-sm text-[#7A8B84] mb-4">
            This feature is available on the {tierLabel} plan and above.
          </p>
          <button
            onClick={() => setUpgradeOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1A2F2A] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#1A2F2A]/90 active:scale-[0.98]"
          >
            Unlock with {tierLabel}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        targetTier={requiredTier}
        featureLabel={featureLabel}
      />
    </div>
  );
}
