'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { X, Zap, AlertTriangle, Clock, LayoutGrid, GitBranch, CreditCard, Sparkles } from 'lucide-react';
import { usePlan } from '@/lib/plan';
import { isTrialGuidedComplete, TRIAL_GUIDED_UPDATED_EVENT } from '@/lib/trial-guided-setup';

type BannerVariant = 'green' | 'amber' | 'red';

function getVariant(daysLeft: number): BannerVariant {
  if (daysLeft <= 2) return 'red';
  if (daysLeft <= 7) return 'amber';
  return 'green';
}

const VARIANT_STYLES: Record<BannerVariant, { bg: string; border: string; text: string; icon: string; btn: string }> = {
  green: {
    bg: 'bg-success/10',
    border: 'border-success/30',
    text: 'text-success',
    icon: 'text-success',
    btn: 'bg-success hover:bg-success/90 text-white',
  },
  amber: {
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    text: 'text-warning',
    icon: 'text-warning',
    btn: 'bg-warning hover:bg-warning/90 text-white',
  },
  red: {
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    text: 'text-destructive',
    icon: 'text-destructive',
    btn: 'bg-destructive hover:bg-destructive/90 text-white',
  },
};

interface TrialBannerProps {
  onUpgrade: () => void;
}

function formatTrialEnd(d: Date | null): string | null {
  if (!d || Number.isNaN(d.getTime())) return null;
  try {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return null;
  }
}

export default function TrialBanner({ onUpgrade }: TrialBannerProps) {
  const { isTrialing, trialDaysLeft, tier, trialEndsAt } = usePlan();
  const [dismissed, setDismissed] = useState(false);
  const [showFinishProSetup, setShowFinishProSetup] = useState(false);

  const refreshFinishProSetup = useCallback(() => {
    if (typeof window === 'undefined') return;
    setShowFinishProSetup(
      isTrialing &&
        !isTrialGuidedComplete() &&
        localStorage.getItem('voatomy_setup_complete') === 'true',
    );
  }, [isTrialing]);

  useEffect(() => {
    refreshFinishProSetup();
    const onUpdated = () => refreshFinishProSetup();
    window.addEventListener('focus', refreshFinishProSetup);
    window.addEventListener(TRIAL_GUIDED_UPDATED_EVENT, onUpdated);
    return () => {
      window.removeEventListener('focus', refreshFinishProSetup);
      window.removeEventListener(TRIAL_GUIDED_UPDATED_EVENT, onUpdated);
    };
  }, [refreshFinishProSetup]);

  const openTrialSetup = () => {
    window.dispatchEvent(new CustomEvent('atlas-open-welcome-setup'));
  };

  if (!isTrialing || dismissed) return null;

  const variant = getVariant(trialDaysLeft);
  const styles = VARIANT_STYLES[variant];
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

  const Icon = variant === 'red' ? AlertTriangle : variant === 'amber' ? Clock : Zap;

  let message: string;
  let ctaText: string;
  if (variant === 'red') {
    message = trialDaysLeft <= 0
      ? `Your ${tierLabel} trial expires today!`
      : trialDaysLeft === 1
        ? `Your ${tierLabel} trial expires tomorrow!`
        : `Your ${tierLabel} trial expires in ${trialDaysLeft} days!`;
    ctaText = 'Upgrade to keep access';
  } else if (variant === 'amber') {
    message = `Your trial ends in ${trialDaysLeft} days`;
    ctaText = 'Upgrade now';
  } else {
    message = `You're on your 14-day ${tierLabel} trial — ${trialDaysLeft} days remaining`;
    ctaText = 'Upgrade now';
  }

  const endLabel = formatTrialEnd(trialEndsAt);

  return (
    <div className={`border-b ${styles.bg} ${styles.border}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-2.5">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <Icon className={`h-4 w-4 shrink-0 mt-0.5 sm:mt-0 ${styles.icon}`} />
          <div className="min-w-0">
            <span className={`text-sm font-medium ${styles.text}`}>{message}</span>
            {endLabel && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Trial access ends <span className="font-semibold text-foreground/80">{endLabel}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0 sm:pl-2">
          {showFinishProSetup && (
            <button
              type="button"
              onClick={openTrialSetup}
              className="inline-flex items-center gap-1 rounded-lg border border-primary/35 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/15 transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              Finish Pro setup
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1 mr-1 pr-2 border-r border-border/60">
            <Link
              href="/integrations"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-foreground/80 hover:bg-black/5 dark:hover:bg-white/10"
            >
              <LayoutGrid className="h-3 w-3 opacity-70" />
              Integrations
            </Link>
            <Link
              href="/repos"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-foreground/80 hover:bg-black/5 dark:hover:bg-white/10"
            >
              <GitBranch className="h-3 w-3 opacity-70" />
              Repos
            </Link>
            <Link
              href="/settings?tab=billing"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-foreground/80 hover:bg-black/5 dark:hover:bg-white/10"
            >
              <CreditCard className="h-3 w-3 opacity-70" />
              Billing
            </Link>
          </div>
          <button
            type="button"
            onClick={onUpgrade}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${styles.btn}`}
          >
            {ctaText}
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className={`p-1 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${styles.text}`}
            aria-label="Dismiss trial banner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="flex sm:hidden items-center gap-2 px-4 pb-2.5 pt-0 overflow-x-auto">
        {showFinishProSetup && (
          <button
            type="button"
            onClick={openTrialSetup}
            className="inline-flex items-center gap-1 rounded-md border border-primary/35 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary whitespace-nowrap"
          >
            <Sparkles className="h-3 w-3" />
            Finish Pro setup
          </button>
        )}
        <Link
          href="/integrations"
          className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-card/60 px-2.5 py-1 text-[11px] font-medium text-foreground whitespace-nowrap"
        >
          <LayoutGrid className="h-3 w-3" />
          Integrations
        </Link>
        <Link
          href="/repos"
          className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-card/60 px-2.5 py-1 text-[11px] font-medium text-foreground whitespace-nowrap"
        >
          <GitBranch className="h-3 w-3" />
          Repos
        </Link>
        <Link
          href="/settings?tab=billing"
          className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-card/60 px-2.5 py-1 text-[11px] font-medium text-foreground whitespace-nowrap"
        >
          <CreditCard className="h-3 w-3" />
          Billing
        </Link>
      </div>
    </div>
  );
}
