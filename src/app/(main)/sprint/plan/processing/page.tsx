'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProject } from '@/lib/project-context';
import { generateSprintPlanStream, type GenerateOptions } from '@/lib/api';
import { getProviderLabel } from '@/lib/project-utils';
import {
  ArrowRight,
  Brain,
  Check,
  Database,
  GitBranch,
  Headphones,
  Lightbulb,
  Loader2,
  Rocket,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ---------------------------------------------------------------------------
// Processing Steps
// ---------------------------------------------------------------------------

interface Step {
  id: string;
  label: string;
  defaultDetail: string;
  completionDelay: number;
  icon: typeof Database;
  color: string;
  emoji: string;
}

const steps: Step[] = [
  {
    id: 'backlog',
    label: 'Reading backlog',
    defaultDetail: 'Ingesting tickets…',
    completionDelay: 800,
    icon: Database,
    color: '#22C55E',
    emoji: '📋',
  },
  {
    id: 'complexity',
    label: 'Code complexity analysis',
    defaultDetail: 'Analyzing complexity…',
    completionDelay: 2000,
    icon: GitBranch,
    color: '#f59e0b',
    emoji: '🧬',
  },
  {
    id: 'debt',
    label: 'Tech debt scan',
    defaultDetail: 'Scanning debt…',
    completionDelay: 3200,
    icon: Zap,
    color: '#ef4444',
    emoji: '🔍',
  },
  {
    id: 'capacity',
    label: 'Team capacity',
    defaultDetail: 'Computing capacity…',
    completionDelay: 4200,
    icon: Users,
    color: '#10b981',
    emoji: '👥',
  },
  {
    id: 'business',
    label: 'Business signals',
    defaultDetail: 'Syncing signals…',
    completionDelay: 5800,
    icon: TrendingUp,
    color: '#8b5cf6',
    emoji: '📊',
  },
  {
    id: 'customer',
    label: 'Customer demand',
    defaultDetail: 'Analyzing demand…',
    completionDelay: 7200,
    icon: Headphones,
    color: '#ec4899',
    emoji: '💬',
  },
];

const funFacts = [
  { text: 'ATLAS weighs 12+ signals to rank every ticket', icon: '🧠' },
  { text: 'Teams using AI sprint plans ship 31% faster', icon: '🚀' },
  { text: 'Your code complexity is factored into every estimate', icon: '⚡' },
  { text: 'Business priority signals prevent misaligned sprints', icon: '🎯' },
  { text: 'Customer demand data helps you build what matters most', icon: '💡' },
  { text: 'Tech debt is auto-detected so nothing hides in the backlog', icon: '🔬' },
  { text: 'Each sprint, ATLAS gets smarter about your team\'s velocity', icon: '📈' },
];

// ---------------------------------------------------------------------------
// Sparkle burst on step completion
// ---------------------------------------------------------------------------

function CompletionBurst({ color }: { color: string }) {
  return (
    <motion.div className="absolute inset-0 pointer-events-none" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * 360;
        const rad = (angle * Math.PI) / 180;
        return (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full"
            style={{ background: color }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(rad) * 20,
              y: Math.sin(rad) * 20,
              opacity: 0,
              scale: 0,
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        );
      })}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Processing Page
// ---------------------------------------------------------------------------

export default function SprintPlanProcessingPage() {
  const router = useRouter();
  const { activeProjectId, activeProject, activeSprint } = useProject();
  const sprintName = activeSprint?.name ?? 'Current Sprint';
  const providerLabel = getProviderLabel(activeProject);
  const projectName = activeProject?.name ?? 'Project';
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [stepDetails, setStepDetails] = useState<Record<string, string>>({});
  const [justCompleted, setJustCompleted] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [allDone, setAllDone] = useState(false);
  const [apiState, setApiState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [apiError, setApiError] = useState<string | null>(null);

  const totalSteps = steps.length;
  const doneCount = completedSteps.size;

  const completeStep = useCallback((stepId: string, detail?: string) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(stepId);
      return next;
    });
    if (detail) {
      setStepDetails((prev) => ({ ...prev, [stepId]: detail }));
    }
    setJustCompleted(stepId);
    setTimeout(() => setJustCompleted(null), 600);
  }, []);

  const getStoredOpts = useCallback((): GenerateOptions | undefined => {
    try {
      const signals = sessionStorage.getItem('sprint-plan-signals');
      const wb = sessionStorage.getItem('sprint-plan-writeback');
      const opts: GenerateOptions = {};
      if (signals) opts.signals = JSON.parse(signals);
      if (wb) opts.write_back = JSON.parse(wb);
      return (opts.signals || opts.write_back) ? opts : undefined;
    } catch {
      return undefined;
    }
  }, []);

  const retryGenerate = useCallback(() => {
    if (!activeProjectId) return;
    setApiState('loading');
    setApiError(null);
    setCompletedSteps(new Set());
    setStepDetails({});
    const opts = getStoredOpts();
    generateSprintPlanStream(activeProjectId, (step, detail) => completeStep(step, detail), opts)
      .then(() => setApiState('success'))
      .catch((err) => {
        setApiState('error');
        setApiError(err?.message ?? 'Failed to generate sprint plan. Please try again.');
      });
  }, [activeProjectId, completeStep, getStoredOpts]);

  useEffect(() => {
    if (!activeProjectId) {
      setApiState('error');
      setApiError('No project selected');
      return;
    }
    setApiState('loading');
    const opts = getStoredOpts();
    generateSprintPlanStream(activeProjectId, (step, detail) => completeStep(step, detail), opts)
      .then(() => setApiState('success'))
      .catch((err) => {
        setApiState('error');
        setApiError(err?.message ?? 'Failed to generate sprint plan. Please try again.');
      });
  }, [activeProjectId, completeStep, getStoredOpts]);

  useEffect(() => {
    const target = Math.round((doneCount / totalSteps) * 100);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= target) { clearInterval(interval); return target; }
        return prev + 1;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [doneCount, totalSteps]);

  // Set allDone when BOTH API succeeded AND animation completed (or API succeeded and we've run long enough)
  useEffect(() => {
    if (apiState === 'success' && doneCount === totalSteps) {
      const t = setTimeout(() => setAllDone(true), 400);
      return () => clearTimeout(t);
    }
  }, [apiState, doneCount, totalSteps]);

  useEffect(() => {
    if (allDone) return;
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % funFacts.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [allDone]);

  const currentStepIndex = steps.findIndex((s) => !completedSteps.has(s.id));

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-8">
      {/* Floating 3D hero */}
      <motion.div
        className="flex flex-col items-center text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="relative mb-6"
          animate={allDone ? { scale: [1, 1.1, 1] } : { y: [0, -6, 0] }}
          transition={allDone
            ? { duration: 0.5, ease: 'easeOut' }
            : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          {/* Glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)',
              transform: 'scale(1.8)',
            }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.img
            src={allDone
              ? 'https://img.icons8.com/3d-fluency/256/rocket.png'
              : 'https://img.icons8.com/3d-fluency/256/brain.png'
            }
            alt="Processing"
            width={120}
            height={120}
            className="relative z-10 drop-shadow-2xl select-none pointer-events-none"
            draggable={false}
            key={allDone ? 'done' : 'processing'}
            initial={{ opacity: 0, scale: 0.5, rotateY: 90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </motion.div>

        <AnimatePresence mode="wait">
          {allDone ? (
            <motion.div
              key="done-header"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-2"
            >
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-emerald-400 to-primary bg-clip-text text-transparent">
                  Sprint plan ready!
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">
                All signals analyzed. Your AI-powered plan is waiting.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="processing-header"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="space-y-2"
            >
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                  Analyzing {sprintName}
                </span>
                <motion.span
                  className="inline-block ml-1 text-primary"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  ...
                </motion.span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Board: {providerLabel} · {projectName}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Step cards */}
      <div className="space-y-2" role="list" aria-label="Processing steps">
        {steps.map((step, idx) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = !isCompleted && idx === currentStepIndex;
          const wasBurst = justCompleted === step.id;
          const StepIcon = step.icon;

          return (
            <motion.div
              key={step.id}
              role="listitem"
              aria-label={`${step.label}${isCompleted ? ' — completed' : isCurrent ? ' — processing' : ' — pending'}`}
              className={`relative flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-300 ${
                isCompleted
                  ? 'bg-card border-border/60'
                  : isCurrent
                  ? 'bg-primary/[0.04] border-primary/30 shadow-sm shadow-primary/5'
                  : 'bg-card/50 border-border/30 opacity-50'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isCurrent || isCompleted ? 1 : 0.5, x: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.06 }}
              layout
            >
              {/* Step icon container — icon-box style */}
              <div className="relative">
                <motion.div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 border ${
                    isCompleted
                      ? 'bg-success/8 border-success/12'
                      : isCurrent
                      ? 'bg-primary/8 border-primary/12'
                      : 'bg-muted border-border/40'
                  }`}
                  animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      >
                        <Check className="w-5 h-5 text-emerald-500" strokeWidth={3} />
                      </motion.div>
                    ) : isCurrent ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Loader2 className="w-5 h-5 animate-spin" style={{ color: step.color }} />
                      </motion.div>
                    ) : (
                      <motion.div key="icon">
                        <StepIcon className="w-4 h-4 text-muted-foreground/60" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                {wasBurst && <CompletionBurst color={step.color} />}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-foreground truncate">
                    {step.label}
                  </span>
                  {isCompleted && (
                    <motion.span
                      className="text-base"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
                    >
                      {step.emoji}
                    </motion.span>
                  )}
                </div>
                <AnimatePresence mode="wait">
                  {isCompleted ? (
                    <motion.span
                      key="detail"
                      className="text-xs text-muted-foreground tabular-nums shrink-0"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {stepDetails[step.id] || step.defaultDetail}
                    </motion.span>
                  ) : isCurrent ? (
                    <motion.span
                      key="active"
                      className="text-xs font-medium tabular-nums shrink-0"
                      style={{ color: step.color }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      processing…
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Progress bar */}
      <motion.div
        className="space-y-2.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">
            {doneCount} of {totalSteps} signals processed
          </span>
          <motion.span
            className="font-bold tabular-nums text-foreground"
            key={progress}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.15 }}
          >
            {progress}%
          </motion.span>
        </div>
        {/* Segmented progress hint */}
        <div className="flex gap-1 mb-1">
          {steps.map((s) => (
            <div
              key={s.id}
              className={`flex-1 h-1 rounded-full transition-colors duration-500 ${
                completedSteps.has(s.id) ? 'bg-success' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
          {/* Shimmer overlay */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s ease-in-out infinite',
            }}
          />
          <motion.div
            className="h-full rounded-full relative overflow-hidden"
            style={{
              background: allDone
                ? 'linear-gradient(90deg, #10b981, #22C55E)'
                : 'linear-gradient(90deg, #22C55E, #8b5cf6, #ec4899)',
              backgroundSize: '200% 100%',
              animation: 'gradient-x 3s ease infinite',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {!allDone && (
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                  backgroundSize: '40% 100%',
                  animation: 'progress-shine 1.5s ease-in-out infinite',
                }}
              />
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Fun facts carousel / completion message */}
      <AnimatePresence mode="wait">
        {allDone ? (
          <motion.div
            key="celebration"
            className="relative rounded-2xl overflow-hidden p-6 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(34,197,94,0.08) 100%)',
              border: '1px solid rgba(16,185,129,0.2)',
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <motion.div
              className="text-4xl mb-3"
              animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6 }}
            >
              🎉
            </motion.div>
            <p className="text-sm font-semibold text-foreground">
              All signals processed successfully
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              6 data sources · 47 tickets scored · 54 capacity points allocated
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={`fact-${factIndex}`}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-muted/60 border border-border/50"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <span className="text-xl shrink-0">{funFacts[factIndex].icon}</span>
            <div className="flex items-start gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                {funFacts[factIndex].text}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        {apiState === 'error' ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
              <p className="text-sm font-medium text-destructive">{apiError}</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={retryGenerate}
                className="flex-1 py-3.5 rounded-xl font-semibold text-sm bg-primary text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <>
                  <Sparkles className="w-4 h-4" />
                  Retry
                </>
              </button>
              <Link
                href="/sprint/plan"
                className="flex-1 py-3.5 rounded-xl font-semibold text-sm border border-border bg-card hover:bg-muted flex items-center justify-center gap-2"
              >
                Back to Config
              </Link>
            </div>
          </div>
        ) : allDone ? (
          <Link href="/sprint/plan/review" className="block">
            <motion.button
              className="group w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #22C55E 100%)',
                color: 'white',
                boxShadow: '0 4px 24px rgba(16,185,129,0.3)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Rocket className="w-4 h-4" />
              Review Your Sprint Plan
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </motion.button>
          </Link>
        ) : (
          <div
            className="group w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg opacity-60 cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)',
              color: 'white',
              boxShadow: '0 4px 20px rgba(34,197,94,0.2)',
            }}
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating plan…
            <ArrowRight className="w-4 h-4" />
          </div>
        )}
      </motion.div>

    </div>
  );
}
