'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Sun, Moon, Monitor, Sparkles, ArrowRight, BarChart3, CalendarRange, Layers, Target, Users, SkipForward } from 'lucide-react';
import { useDashboardPrefs, DEFAULT_PREFS, type DashboardPrefs } from '@/lib/dashboard-prefs';
import { usePlan } from '@/lib/plan';
import { isTrialGuidedComplete } from '@/lib/trial-guided-setup';
import { useTheme, type Appearance } from '@/lib/theme';
import { updateSettings } from '@/lib/api';
import PlanOnboardingStep from './PlanOnboardingStep';
import TrialOnboardingStep from './TrialOnboardingStep';

const WELCOME_FLOW_KEY = 'atlas_welcome_flow';

function readWelcomeFlow(): { step?: string; choseTrial?: boolean } | null {
  try {
    return JSON.parse(sessionStorage.getItem(WELCOME_FLOW_KEY) || 'null');
  } catch {
    return null;
  }
}

function writeWelcomeFlow(partial: Record<string, unknown>) {
  try {
    const prev = readWelcomeFlow() ?? {};
    sessionStorage.setItem(WELCOME_FLOW_KEY, JSON.stringify({ ...prev, ...partial }));
  } catch {
    /* ignore */
  }
}

// ─── Option data ─────────────────────────────────────────────────────────────

const THEME_OPTIONS: { value: DashboardPrefs['theme']; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'auto', label: 'System', Icon: Monitor },
];

const SPRINT_OPTIONS: { value: string; label: string }[] = [
  { value: '1-week', label: '1 week' },
  { value: '2-week', label: '2 weeks' },
  { value: '3-week', label: '3 weeks' },
  { value: '4-week', label: '4 weeks' },
  { value: 'continuous', label: 'Continuous' },
];

const FREQUENCY_OPTIONS: { value: string; label: string }[] = [
  { value: 'realtime', label: 'Real-time' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

const AI_MODE_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: 'proactive', label: 'Proactive', description: 'AI actively suggests changes and flags risks before you ask' },
  { value: 'balanced', label: 'Balanced', description: 'AI assists when helpful but stays out of the way (recommended)' },
  { value: 'conservative', label: 'Conservative', description: 'AI only responds when explicitly asked, minimal automation' },
];

// ─── Toggle switch ───────────────────────────────────────────────────────────

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center justify-between gap-3 py-1 w-full">
      <span className="text-sm text-foreground">{label}</span>
      <span
        className={clsx(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200',
          checked ? 'bg-primary' : 'bg-muted',
        )}
      >
        <span
          className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200"
          style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
        />
      </span>
    </button>
  );
}

// ─── Tour feature highlights ────────────────────────────────────────────────

const TOUR_FEATURES = [
  {
    icon: CalendarRange,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    title: 'Dashboard',
    description: 'Your command center — sprint progress, velocity, team workload, and AI insights at a glance.',
    href: '/dashboard',
  },
  {
    icon: Sparkles,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    title: 'Sprint Planning',
    description: 'AI analyzes your backlog, capacity, and signals to compose a data-driven sprint plan.',
    href: '/sprint/plan',
  },
  {
    icon: Layers,
    iconBg: 'bg-sky-500/10',
    iconColor: 'text-sky-600 dark:text-sky-400',
    title: 'Backlog',
    description: 'Prioritize, groom, and rank your tickets. AI estimates story points and flags risks.',
    href: '/backlog',
  },
  {
    icon: Target,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    title: 'Accuracy Tracking',
    description: 'See how your estimations stack up against actuals. Each sprint, ATLAS learns and improves.',
    href: '/accuracy',
  },
  {
    icon: BarChart3,
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-600 dark:text-violet-400',
    title: 'Analytics',
    description: 'Velocity trends, burndown charts, and team performance — all in one place.',
    href: '/analytics',
  },
  {
    icon: Users,
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-600 dark:text-rose-400',
    title: 'Team',
    description: 'Monitor workload distribution, capacity, and individual contributions across sprints.',
    href: '/team',
  },
];

// ─── Full-screen onboarding ─────────────────────────────────────────────────

interface WelcomeSetupModalProps {
  onComplete: () => void;
  onSkip?: () => void;
}

type WelcomeStep = 'plan' | 'trial' | 'prefs' | 'tour';

export default function WelcomeSetupModal({ onComplete, onSkip }: WelcomeSetupModalProps) {
  const { prefs: savedPrefs, setPrefs } = useDashboardPrefs();
  const { isFreeTier, isTrialing, refresh: refreshPlan, loading: planLoading } = usePlan();
  const { appearance: currentAppearance, setAppearance } = useTheme();
  const needsPlanStep = isFreeTier;
  const [step, setStep] = useState<WelcomeStep>('plan');
  const [choseTrial, setChoseTrial] = useState(false);
  /** Keeps step counts correct after trial onboarding sets guided-complete in localStorage. */
  const [flowIncludesTrial, setFlowIncludesTrial] = useState(false);
  const restoredRef = useRef(false);

  useEffect(() => {
    if (planLoading || restoredRef.current) return;
    restoredRef.current = true;
    const f = readWelcomeFlow();
    const guidedComplete = isTrialGuidedComplete();
    const skipPlanForTrialing = isTrialing && !needsPlanStep && !guidedComplete;

    if (skipPlanForTrialing) {
      setFlowIncludesTrial(true);
      setChoseTrial(true);
      if (f?.step === 'prefs' || f?.step === 'tour') {
        setStep(f.step as WelcomeStep);
      } else {
        setStep('trial');
      }
      return;
    }

    if (!needsPlanStep) {
      setStep(f?.step === 'tour' ? 'tour' : 'prefs');
      return;
    }
    if (f?.choseTrial || f?.step === 'trial') setFlowIncludesTrial(true);
    if (f?.step === 'plan' || f?.step === 'trial' || f?.step === 'prefs' || f?.step === 'tour') {
      setStep(f.step as WelcomeStep);
      if (f.choseTrial || f.step === 'trial') setChoseTrial(true);
    } else {
      setStep('plan');
    }
  }, [planLoading, needsPlanStep, isTrialing]);

  useEffect(() => {
    if (planLoading) return;
    writeWelcomeFlow({ step, choseTrial });
  }, [step, choseTrial, planLoading]);

  const [theme, setThemeLocal] = useState<DashboardPrefs['theme']>(currentAppearance ?? savedPrefs.theme ?? DEFAULT_PREFS.theme);
  const [sprint, setSprint] = useState(savedPrefs.sprintCadence ?? DEFAULT_PREFS.sprintCadence);
  const [notif, setNotif] = useState(savedPrefs.notifications ?? DEFAULT_PREFS.notifications);
  const [ai, setAi] = useState(savedPrefs.aiMode ?? DEFAULT_PREFS.aiMode);

  const handleThemeChange = (value: DashboardPrefs['theme']) => {
    setThemeLocal(value);
    setAppearance(value as Appearance);
  };

  const handleSave = () => {
    const fullPrefs = { theme, sprintCadence: sprint, notifications: notif, aiMode: ai };
    setPrefs(fullPrefs);
    setAppearance(theme as Appearance);

    updateSettings('preferences', {
      theme,
      sprintCadence: sprint,
      notifications: notif,
      aiMode: ai,
    }).catch(() => {
      // Keep onboarding non-blocking when optional settings API is unavailable.
    });

    setStep('tour');
  };

  const handleFinish = () => {
    try {
      localStorage.setItem('atlas_tour_completed', 'true');
      sessionStorage.removeItem(WELCOME_FLOW_KEY);
      sessionStorage.removeItem('atlas_trial_onboard_phase');
    } catch {
      /* ignore */
    }
    onComplete();
  };

  const handlePlanContinue = (choice: 'starter' | 'trial') => {
    if (choice === 'trial') {
      refreshPlan();
      setChoseTrial(true);
      setFlowIncludesTrial(true);
      writeWelcomeFlow({ step: 'trial', choseTrial: true });
      setStep('trial');
    } else {
      setChoseTrial(false);
      setFlowIncludesTrial(false);
      writeWelcomeFlow({ step: 'prefs', choseTrial: false });
      setStep('prefs');
    }
  };

  const totalSteps = (() => {
    if (!needsPlanStep && flowIncludesTrial) return 3;
    if (!needsPlanStep) return 2;
    if (choseTrial || flowIncludesTrial) return 4;
    return 3;
  })();

  const currentStep = (() => {
    if (totalSteps === 2) {
      return step === 'prefs' ? 1 : 2;
    }
    if (totalSteps === 3 && !needsPlanStep && flowIncludesTrial) {
      const m: Record<WelcomeStep, number> = { plan: 1, trial: 1, prefs: 2, tour: 3 };
      return m[step];
    }
    if (totalSteps === 3 && needsPlanStep) {
      const m: Partial<Record<WelcomeStep, number>> = { plan: 1, prefs: 2, tour: 3 };
      return m[step] ?? 1;
    }
    const m: Record<WelcomeStep, number> = { plan: 1, trial: 2, prefs: 3, tour: 4 };
    return m[step];
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm pointer-events-auto">
      <motion.div
        className={clsx(
          'relative w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl',
          step === 'trial' ? 'max-w-2xl' : 'max-w-xl',
        )}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur px-6 py-4 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {step === 'plan'
                  ? 'Welcome to ATLAS'
                  : step === 'trial'
                    ? 'Trial setup'
                    : step === 'tour'
                      ? 'Quick tour'
                      : 'Personalize your experience'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {step === 'plan'
                  ? 'Pick the plan that fits your team'
                  : step === 'trial'
                    ? 'Connect board → repo → Slack or Teams, then personalize ATLAS'
                    : step === 'tour'
                      ? 'See what ATLAS can do for your team'
                      : 'Set up your workspace preferences'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip for now
              </button>
            )}
            {totalSteps > 1 && (
              <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
                Step {currentStep} of {totalSteps}
              </span>
            )}
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </div>

        <AnimatePresence mode="wait">
          {step === 'plan' ? (
            <motion.div
              key="plan"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="px-6 py-6"
            >
              <PlanOnboardingStep onContinue={handlePlanContinue} />
            </motion.div>
          ) : step === 'trial' ? (
            <motion.div
              key="trial"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="px-6 py-6"
            >
              <TrialOnboardingStep
                onComplete={() => {
                  setFlowIncludesTrial(true);
                  setChoseTrial(true);
                  writeWelcomeFlow({ step: 'prefs', choseTrial: true });
                  setStep('prefs');
                }}
              />
            </motion.div>
          ) : step === 'prefs' ? (
            <motion.div
              key="prefs"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Body */}
              <div className="space-y-6 px-6 py-5">

                {/* 1 ─ Dashboard Layout */}

                {/* 2 ─ Theme */}
                <section>
                  <SectionLabel label="Theme" />
                  <div className="flex gap-2">
                    {THEME_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleThemeChange(opt.value)}
                        className={clsx(
                          'flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 transition-all duration-200',
                          theme === opt.value
                            ? 'border-primary bg-primary/8 shadow-sm'
                            : 'border-border bg-card hover:border-muted',
                        )}
                      >
                        <opt.Icon className={clsx('h-4 w-4', theme === opt.value ? 'text-primary' : 'text-muted-foreground')} />
                        <span className={clsx('text-sm font-medium', theme === opt.value ? 'text-foreground' : 'text-muted-foreground')}>
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* 3 ─ Sprint cadence */}
                <section>
                  <SectionLabel label="Sprint cadence" />
                  <div className="flex flex-wrap gap-2">
                    {SPRINT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSprint(opt.value)}
                        className={clsx(
                          'rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200',
                          sprint === opt.value
                            ? 'border-primary bg-primary/8 text-foreground shadow-sm'
                            : 'border-border bg-card text-muted-foreground hover:border-muted',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </section>

                {/* 4 ─ Notifications */}
                <section className="rounded-xl border border-border bg-muted p-4">
                  <SectionLabel label="Notifications" />
                  <div className="space-y-2 mb-4">
                    <Toggle label="Email notifications" checked={notif.email} onChange={(v) => setNotif((p) => ({ ...p, email: v }))} />
                    <Toggle label="Slack notifications" checked={notif.slack} onChange={(v) => setNotif((p) => ({ ...p, slack: v }))} />
                    <Toggle label="In-app notifications" checked={notif.inApp} onChange={(v) => setNotif((p) => ({ ...p, inApp: v }))} />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Digest frequency</p>
                    <div className="flex gap-1.5">
                      {FREQUENCY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setNotif((p) => ({ ...p, frequency: opt.value }))}
                          className={clsx(
                            'flex-1 rounded-lg py-1.5 text-[11px] font-semibold transition-all',
                            notif.frequency === opt.value
                              ? 'bg-primary/10 text-foreground'
                              : 'bg-muted/50 text-muted-foreground hover:bg-muted',
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                {/* 5 ─ AI Assistant mode */}
                <section className="rounded-xl border border-border bg-muted p-4">
                  <SectionLabel label="AI assistant mode" hint="How active should AI be in your workflow?" />
                  <div className="space-y-2 mb-4">
                    {AI_MODE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAi((p) => ({ ...p, mode: opt.value }))}
                        className={clsx(
                          'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200',
                          ai.mode === opt.value
                            ? 'border-primary bg-primary/6 shadow-sm'
                            : 'border-border hover:border-muted',
                        )}
                      >
                        <span
                          className={clsx(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                            ai.mode === opt.value ? 'border-primary bg-primary' : 'border-muted',
                          )}
                        >
                          {ai.mode === opt.value && <span className="block h-1.5 w-1.5 rounded-full bg-white" />}
                        </span>
                        <div>
                          <p className={clsx('text-sm font-medium', ai.mode === opt.value ? 'text-foreground' : 'text-muted-foreground')}>
                            {opt.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{opt.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2 border-t border-border pt-3">
                    <Toggle label="Auto-suggest sprint improvements" checked={ai.autoSuggest} onChange={(v) => setAi((p) => ({ ...p, autoSuggest: v }))} />
                    <Toggle label="Auto-assign tasks based on capacity" checked={ai.autoAssign} onChange={(v) => setAi((p) => ({ ...p, autoAssign: v }))} />
                  </div>
                </section>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-border bg-card/95 backdrop-blur px-6 py-4 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setAppearance(DEFAULT_PREFS.theme as Appearance);
                    setPrefs(DEFAULT_PREFS);
                    try {
                      sessionStorage.removeItem(WELCOME_FLOW_KEY);
                    } catch {
                      /* ignore */
                    }
                    onComplete();
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Use defaults
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/15 transition-colors hover:bg-primary/90"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="tour"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="px-6 py-5 space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  Here&apos;s a quick overview of the key areas in ATLAS. You can always revisit these from the sidebar.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TOUR_FEATURES.map((feat, idx) => {
                    const Icon = feat.icon;
                    return (
                      <motion.div
                        key={feat.title}
                        className="flex items-start gap-3 p-3 rounded-xl border border-border/40 bg-muted/30 hover:bg-muted/50 transition-colors"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: 0.05 + idx * 0.04 }}
                      >
                        <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', feat.iconBg)}>
                          <Icon className={clsx('w-4.5 h-4.5', feat.iconColor)} strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-tight">{feat.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{feat.description}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-border bg-card/95 backdrop-blur px-6 py-4 rounded-b-2xl">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Skip tour
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/15 transition-colors hover:bg-primary/90"
                >
                  Get started
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SectionLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="mb-3">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
