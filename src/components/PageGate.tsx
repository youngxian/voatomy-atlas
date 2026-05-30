'use client';

import { usePathname } from 'next/navigation';
import { usePlan } from '@/lib/plan';
import { isRouteLocked, getRouteGate } from '@/lib/plan-gates';
import LockedFeatureOverlay from './LockedFeatureOverlay';
import type { PlanTier } from '@/lib/plan';

interface PageGateProps {
  children: React.ReactNode;
}

export default function PageGate({ children }: PageGateProps) {
  const pathname = usePathname();
  const { tier } = usePlan();

  const locked = isRouteLocked(pathname, tier);
  const gate = getRouteGate(pathname);

  if (locked && gate) {
    return (
      <LockedFeatureOverlay
        requiredTier={gate.minTier as Exclude<PlanTier, 'starter'>}
        featureLabel={gate.label}
      >
        {children}
      </LockedFeatureOverlay>
    );
  }

  return <>{children}</>;
}
