'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, X, Zap, Users, GitBranch, Brain, Check, Loader2 } from 'lucide-react';
import { usePlan } from '@/lib/plan';
import { startTrial, type TrialOutput } from '@/lib/api';

type BannerStage = 'banner' | 'confirm' | 'success';

export default function FreeTierBanner() {
  const { isFreeTier, isTrialing, postTrialOnStarter, usage, limits, loading, refresh } = usePlan();
  const [dismissed, setDismissed] = useState(false);
  const [stage, setStage] = useState<BannerStage>('banner');
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [trialResult, setTrialResult] = useState<TrialOutput | null>(null);

  const handleStartTrial = useCallback(async () => {
    setStarting(true);
    setError('');
    try {
      const result = await startTrial('pro');
      await refresh();
      setTrialResult(result);
      setStage('success');
      window.dispatchEvent(new CustomEvent('atlas-open-welcome-setup'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start trial';
      if (msg.includes('already')) {
        setError('A trial has already been used for this organization.');
      } else {
        setError(msg);
      }
    } finally {
      setStarting(false);
    }
  }, [refresh]);

  const finishTrialSuccess = useCallback(() => {
    window.dispatchEvent(new CustomEvent('atlas-open-welcome-setup'));
    setDismissed(true);
  }, []);

  if (loading || !isFreeTier || isTrialing || postTrialOnStarter || dismissed) return null;

  const usageItems = [
    {
      icon: Users,
      label: 'Teams',
      used: usage.teamsUsed,
      max: limits.maxTeams,
      color: 'var(--primary)',
    },
    {
      icon: GitBranch,
      label: 'Repos',
      used: usage.reposUsed,
      max: limits.maxRepos,
      color: '#D4A843',
    },
    {
      icon: Brain,
      label: 'AI Plans',
      used: usage.aiPlansUsed,
      max: limits.aiPlansPerMonth,
      color: 'var(--primary)',
    },
  ];

  const PRO_HIGHLIGHTS = [
    'Unlimited teams, repos & AI plans',
    'Jira, Slack, Figma & 15+ integrations',
    'Advanced accuracy analytics',
    'Customer demand signals',
  ];

  return (
    <AnimatePresence>
      {stage === 'banner' && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden border-b border-primary/10"
        >
            <div className="relative bg-gradient-to-r from-primary/[0.04] via-accent/30 to-primary/[0.06] px-4 py-3">
            <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(ellipse_at_30%_50%,var(--primary),transparent_60%)]" />
            <div className="relative flex items-center gap-4">
              {/* Usage meters */}
              <div className="hidden sm:flex items-center gap-3">
                {usageItems.map((item) => {
                  const pct = item.max > 0 ? Math.min((item.used / item.max) * 100, 100) : 0;
                  const atLimit = item.max > 0 && item.used >= item.max;
                  return (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                      <div className="flex items-center gap-1">
                        <div className="w-12 h-1.5 rounded-full bg-border overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: atLimit ? 'var(--destructive)' : item.color,
                            }}
                          />
                        </div>
                        <span className={`text-[10px] font-semibold tabular-nums ${atLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {item.used}/{item.max}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px h-6 bg-border" />

              {/* Message */}
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <Zap className="w-4 h-4 shrink-0" style={{ color: '#D4A843' }} />
                <p className="text-sm font-medium text-foreground truncate">
                  You&apos;re on the <span className="font-bold">Free</span> plan.
                  Unlock unlimited with a 14-day Pro trial.
                </p>
              </div>

              {/* CTA */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setStage('confirm')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all"
                >
                  <Sparkles className="w-3 h-3" />
                  Try Pro Free
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/5 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {stage === 'confirm' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-full max-w-sm rounded-2xl bg-card shadow-2xl overflow-hidden"
          >
            <div className="relative px-6 pt-6 pb-4">
              <div className="absolute inset-0 opacity-[0.05] bg-gradient-to-br from-primary to-transparent" />
              <div className="relative">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Start your 14-day Pro trial</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  No credit card required. Full Pro access for 14 days, then back to Free automatically.
                </p>
              </div>
            </div>

            <div className="px-6 pb-4">
              <div className="space-y-2">
                {PRO_HIGHLIGHTS.map((h) => (
                  <div key={h} className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Check className="w-2.5 h-2.5 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="mx-6 mb-3 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <div className="px-6 pb-6 space-y-2">
              <button
                onClick={handleStartTrial}
                disabled={starting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
              >
                {starting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Starting trial…</>
                ) : (
                  <>Activate Pro Trial <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
              <button
                onClick={() => { setStage('banner'); setError(''); }}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {stage === 'success' && trialResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-full max-w-sm rounded-2xl bg-card shadow-2xl overflow-hidden text-center"
          >
            <div className="px-6 pt-8 pb-4">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Check className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">You&apos;re on Pro!</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Your 14-day Pro trial is active. {trialResult.days_left} days of unlimited access.
              </p>
            </div>

            <div className="px-6 pb-6">
              <button
                type="button"
                onClick={finishTrialSuccess}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition-all hover:bg-primary/90 active:scale-[0.98]"
              >
                Start exploring <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
