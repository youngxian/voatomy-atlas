'use client';

import Link from 'next/link';
import { Settings, Sparkles, ClipboardList, Rocket, Check } from 'lucide-react';

const STEPS = [
  { id: 'configure', label: 'Configure', subtitle: 'Set up your preferences', href: '/sprint/plan', icon: Settings },
  { id: 'generate', label: 'Generate', subtitle: 'AI creates your plan', href: '/sprint/plan/processing', icon: Sparkles },
  { id: 'review', label: 'Review', subtitle: 'Adjust and refine', href: '/sprint/plan/review', icon: ClipboardList },
  { id: 'push', label: 'Push', subtitle: 'Sync to your board', href: '/sprint/plan/pushed', icon: Rocket },
] as const;

export type SprintPlanStep = (typeof STEPS)[number]['id'];

interface SprintPlanStepperProps {
  currentStep: SprintPlanStep;
}

export function SprintPlanStepper({ currentStep }: SprintPlanStepperProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
  const currentStepInfo = STEPS.find((s) => s.id === currentStep);
  const stepLabel = `Step ${currentIndex + 1} of ${STEPS.length}`;
  const stepText = currentStepInfo != null ? ((currentStepInfo as { subtitle?: string; label: string }).subtitle ?? (currentStepInfo as { subtitle?: string; label: string }).label) : null;

  return (
    <div className="space-y-2">
      {stepText && (
        <p className="text-center text-xs text-muted-foreground">{stepLabel}: {stepText}</p>
      )}
    <nav
      className="flex items-center justify-center gap-1 sm:gap-2 py-4"
      aria-label="Sprint planning progress"
      role="navigation"
    >
      <ol className="flex items-center gap-1 sm:gap-2 list-none m-0 p-0">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = step.id === currentStep;
          const isFuture = idx > currentIndex;
          const Icon = step.icon;

          return (
            <li key={step.id} className="flex items-center">
              <Link
                href={step.href}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`${step.label}${isCompleted ? ' (completed)' : isCurrent ? ' (current)' : ''}`}
                tabIndex={isFuture ? -1 : 0}
                className={`relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  isCurrent
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/5 ring-1 ring-primary/10'
                    : isCompleted
                      ? 'text-foreground hover:bg-muted/60 cursor-pointer'
                      : 'text-muted-foreground/50 pointer-events-none'
                }`}
              >
                {isCompleted ? (
                  <span className="w-4 h-4 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-success" strokeWidth={3} />
                  </span>
                ) : (
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="hidden sm:inline">{step.label}</span>
                {isCurrent && (
                  <span className="absolute -bottom-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" aria-hidden="true" />
                )}
              </Link>
              {idx < STEPS.length - 1 && (
                <div
                  className={`w-4 sm:w-8 h-px mx-0.5 transition-colors ${
                    idx < currentIndex ? 'bg-primary/40' : 'bg-border'
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
    </div>
  );
}
