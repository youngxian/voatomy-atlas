'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CreditCard,
  Minus,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const LOST_ON_STARTER = [
  'Unlimited teams & repos',
  'Unlimited AI sprint plans',
  'Advanced analytics & customer signals',
  'Slack, Teams, Figma & extended integrations',
];

const STILL_HAVE = [
  'All projects, tickets & sprint history stay in your workspace',
  'Starter limits: 1 team, 1 repo, 2 AI plans / month',
  'Core GitHub / GitLab + one PM tool (e.g. Jira or Linear)',
];

interface TrialExpiredModalProps {
  onUpgrade: () => void;
  onDismiss: () => void;
  trialTier?: string;
}

export default function TrialExpiredModal({ onUpgrade, onDismiss, trialTier = 'Pro' }: TrialExpiredModalProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const finishDismiss = () => {
    setVisible(false);
    onDismiss();
  };

  const finishUpgrade = () => {
    setVisible(false);
    onUpgrade();
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="trial-expired-title"
          >
            <div className="pointer-events-auto relative w-full max-w-lg rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden">
              <div className="relative px-6 pt-6 pb-4 border-b border-border/60 bg-muted/30">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/25">
                  <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 id="trial-expired-title" className="text-xl font-bold text-foreground tracking-tight">
                  Your {trialTier} trial has ended
                </h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Thanks for trying ATLAS on {trialTier}. Your workspace is now on the{' '}
                  <span className="font-semibold text-foreground">Starter</span> plan. Choose how you&apos;d like to
                  continue.
                </p>
              </div>

              <div className="px-6 py-5 space-y-5 max-h-[min(52vh,420px)] overflow-y-auto">
                <div>
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Minus className="w-3.5 h-3.5 text-destructive/80" />
                    Not on Starter
                  </p>
                  <ul className="space-y-2">
                    {LOST_ON_STARTER.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-destructive/50" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    What stays the same
                  </p>
                  <ul className="space-y-2">
                    {STILL_HAVE.map((line) => (
                      <li key={line} className="flex items-start gap-2.5 text-sm text-foreground/90">
                        <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>

                <ol className="rounded-xl border border-border/80 bg-secondary/40 px-4 py-3 space-y-2 text-[13px] text-muted-foreground">
                  <li>
                    <span className="font-semibold text-foreground">1.</span> Subscribe to keep every {trialTier}{' '}
                    feature and limits.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">2.</span> Or stay on Starter and trim integrations
                    to match the limits above.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">3.</span> Billing & invoices live in Settings when
                    you&apos;re ready.
                  </li>
                </ol>
              </div>

              <div className="px-6 pb-6 pt-2 space-y-2 border-t border-border/60 bg-card">
                <button
                  type="button"
                  onClick={finishUpgrade}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.99]"
                >
                  <Sparkles className="w-4 h-4" />
                  Subscribe to {trialTier}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <Link
                  href="/settings?tab=billing"
                  onClick={finishDismiss}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary/60 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  Open billing &amp; plans
                </Link>
                <button
                  type="button"
                  onClick={finishDismiss}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  Continue on Starter — I&apos;ll upgrade later
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
