'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { X, Sparkles, CreditCard } from 'lucide-react';
import { usePlan } from '@/lib/plan';

const BANNER_DISMISSED_KEY = 'atlas_post_trial_banner_dismissed_v1';

interface TrialEndedBannerProps {
  /** True once the full-screen “trial ended” modal was dismissed (session). */
  remindAfterModal: boolean;
  onSubscribe: () => void;
}

/** Slim reminder after the user closes the “trial ended” modal — re-engage without blocking the app */
export default function TrialEndedBanner({ remindAfterModal, onSubscribe }: TrialEndedBannerProps) {
  const { postTrialOnStarter, loading } = usePlan();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    try {
      setBannerDismissed(localStorage.getItem(BANNER_DISMISSED_KEY) === 'true');
    } catch {
      setBannerDismissed(false);
    }
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    } catch {
      /* ignore */
    }
    setBannerDismissed(true);
  }, []);

  if (loading || !postTrialOnStarter || !remindAfterModal || bannerDismissed) return null;

  return (
    <div className="border-b border-primary/20 bg-primary/[0.06] px-4 py-2.5">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 min-w-0">
          <Sparkles className="w-4 h-4 shrink-0 text-primary mt-0.5" />
          <p className="text-sm text-foreground">
            <span className="font-semibold">Your Pro trial has ended.</span>{' '}
            <span className="text-muted-foreground">
              You&apos;re on Starter — upgrade anytime to restore unlimited repos, integrations, and AI sprint plans.
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onSubscribe}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            Subscribe to Pro
          </button>
          <Link
            href="/settings?tab=billing"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/60 transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Billing
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
