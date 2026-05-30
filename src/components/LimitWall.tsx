'use client';

import { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import UpgradeModal from './UpgradeModal';

interface LimitWallProps {
  used: number;
  max: number;
  noun: string;
  onUpgrade?: () => void;
  children?: React.ReactNode;
}

export default function LimitWall({ used, max, noun, onUpgrade, children }: LimitWallProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const atLimit = max >= 0 && used >= max;

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      setUpgradeOpen(true);
    }
  };

  if (!atLimit) return <>{children}</>;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {children && (
        <div className="pointer-events-none opacity-60 shrink-0">{children}</div>
      )}

      <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5">
        <Lock className="w-4 h-4 text-warning shrink-0" />
        <p className="text-sm font-medium text-warning whitespace-nowrap">
          You&apos;ve used {used} of {max} {noun}.
        </p>
        <button
          onClick={handleUpgrade}
          className="inline-flex items-center gap-1.5 rounded-lg bg-warning px-3.5 py-2 text-xs font-semibold text-white hover:bg-warning/90 transition-colors shrink-0"
        >
          Upgrade
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        targetTier="pro"
        featureLabel={`unlimited ${noun}`}
      />
    </div>
  );
}
