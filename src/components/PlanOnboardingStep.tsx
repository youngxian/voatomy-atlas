'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, ArrowRight, Sparkles, Loader2, Crown, Zap,
  Users, GitBranch, Brain, Shield,
} from 'lucide-react';
import { startTrial, type TrialOutput } from '@/lib/api';

interface PlanOnboardingStepProps {
  onContinue: (choice: 'starter' | 'trial') => void;
}

const FREE_FEATURES = [
  { icon: Users, text: '1 team (up to 8 members)' },
  { icon: GitBranch, text: '1 connected repo' },
  { icon: Brain, text: '2 AI sprint plans / month' },
  { icon: Shield, text: 'GitHub / GitLab + 1 PM tool (Jira, Linear, or ClickUp)' },
];

const PRO_EXTRAS = [
  'Unlimited teams & repos',
  'Unlimited AI sprint plans',
  'Jira, Slack, Figma & 15+ integrations',
  'Advanced accuracy analytics',
  'Customer demand signals',
  'Slack & Teams notifications',
];

export default function PlanOnboardingStep({ onContinue }: PlanOnboardingStepProps) {
  const [selected, setSelected] = useState<'starter' | 'pro' | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [trialStarted, setTrialStarted] = useState(false);

  const handleStartTrial = useCallback(async () => {
    setStarting(true);
    setError('');
    try {
      await startTrial('pro');
      setTrialStarted(true);
      setTimeout(() => onContinue('trial'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start trial');
      setStarting(false);
    }
  }, [onContinue]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Choose your plan</h2>
        <p className="text-sm text-muted-foreground">
          Start free and upgrade anytime, or try Pro for 14 days — no credit card needed.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Starter Card */}
        <button
          onClick={() => setSelected('starter')}
          className={`relative text-left rounded-2xl border-2 p-5 transition-all duration-200 ${
            selected === 'starter'
              ? 'border-foreground bg-foreground/[0.02] shadow-md'
              : 'border-border bg-card hover:border-border hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Free</span>
            {selected === 'starter' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground"
              >
                <Check className="w-3 h-3 text-white" />
              </motion.div>
            )}
          </div>
          <div className="mb-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">$0</span>
              <span className="text-sm text-muted-foreground">forever</span>
            </div>
          </div>
          <div className="space-y-2.5">
            {FREE_FEATURES.map((f) => (
              <div key={f.text} className="flex items-center gap-2.5">
                <f.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground">{f.text}</span>
              </div>
            ))}
          </div>
        </button>

        {/* Pro Trial Card */}
        <button
          onClick={() => setSelected('pro')}
          className={`relative text-left rounded-2xl border-2 p-5 transition-all duration-200 ${
            selected === 'pro'
              ? 'border-primary bg-primary/[0.02] shadow-md'
              : 'border-border bg-card hover:border-primary/40 hover:shadow-sm'
          }`}
        >
          <div className="absolute -top-2.5 right-4 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            <Crown className="w-2.5 h-2.5" /> Recommended
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Pro Trial</span>
            {selected === 'pro' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-primary"
              >
                <Check className="w-3 h-3 text-white" />
              </motion.div>
            )}
          </div>
          <div className="mb-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">$0</span>
              <span className="text-sm text-muted-foreground">for 14 days</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">then $14/user/mo or switch to Free</p>
          </div>
          <div className="space-y-2.5">
            {PRO_EXTRAS.map((text) => (
              <div key={text} className="flex items-center gap-2.5">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Check className="w-2.5 h-2.5 text-primary" />
                </div>
                <span className="text-sm text-foreground">{text}</span>
              </div>
            ))}
          </div>
        </button>
      </div>

      {selected === 'pro' && !trialStarted && !starting && (
        <p className="text-center text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
          After you start: connect your{' '}
          <span className="font-semibold text-foreground">project board</span>,{' '}
          <span className="font-semibold text-foreground">one Git repository</span>, then{' '}
          <span className="font-semibold text-foreground">Slack or Teams</span> — then theme and notifications. Skip any step and finish from the trial banner.
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {trialStarted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-sm font-medium text-primary"
          >
            <Check className="w-4 h-4" /> Pro trial activated! Continuing…
          </motion.div>
        ) : (
          <motion.div key="cta" className="flex flex-col items-center gap-3">
            <button
              onClick={() => {
                if (selected === 'pro') {
                  handleStartTrial();
                } else if (selected === 'starter') {
                  onContinue('starter');
                }
              }}
              disabled={!selected || starting}
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl px-8 text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40 ${
                selected === 'pro'
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-foreground text-white hover:bg-foreground/90'
              }`}
            >
              {starting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Starting trial…</>
              ) : selected === 'pro' ? (
                <><Sparkles className="w-4 h-4" /> Start 14-day Pro Trial</>
              ) : (
                <>Continue with Free <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
            {selected === 'starter' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <Zap className="w-3 h-3 text-[#D4A843]" />
                You can start a Pro trial anytime from the dashboard
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
