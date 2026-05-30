'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  CheckCircle2,
  Sparkles,
  GitBranch,
  BarChart3,
  Brain,
  Zap,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const ANALYSIS_STEPS = [
  { icon: GitBranch, label: 'Importing tasks & sprints', duration: 2200 },
  { icon: Brain, label: 'Mapping code complexity', duration: 1800 },
  { icon: Sparkles, label: 'Generating AI effort estimates', duration: 2000 },
  { icon: BarChart3, label: 'Calibrating sprint accuracy baseline', duration: 1500 },
  { icon: Zap, label: 'Building intelligence index', duration: 1200 },
];

function AnalyzingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const providerName = searchParams.get('provider') ?? '';
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const runStep = (index: number) => {
      if (index >= ANALYSIS_STEPS.length) {
        const qs = providerName ? `?provider=${encodeURIComponent(providerName)}` : '';
        timeout = setTimeout(() => router.push(`/onboarding/ready${qs}`), 800);
        return;
      }
      setActiveStep(index);
      timeout = setTimeout(() => {
        setCompletedSteps((prev) => [...prev, index]);
        runStep(index + 1);
      }, ANALYSIS_STEPS[index].duration);
    };
    runStep(0);
    return () => clearTimeout(timeout);
  }, [router, providerName]);

  const progress = Math.round(((completedSteps.length) / ANALYSIS_STEPS.length) * 100);

  return (
    <div className="min-h-screen bg-[#09090f] flex items-center justify-center p-4">
      <div className="w-full max-w-lg flex flex-col items-center text-center">

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i <= 1
                    ? 'w-8 bg-[#f16e2c]'
                    : 'w-1.5 bg-[#2a2a3a]'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-[#6b6b80] ml-2">Step 2 of 4</span>
        </div>

        {/* Animated brain icon */}
        <Reveal variant="scale">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#f16e2c]/10 border border-[#f16e2c]/20 flex items-center justify-center">
              <Brain className="w-8 h-8 text-[#f16e2c] animate-pulse" />
            </div>
          </div>
        </Reveal>

        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Analyzing your backlog
        </h1>
        <p className="text-[#8b8ba0] text-sm mb-8 max-w-sm">
          ATLAS is scanning your board and building intelligence. This takes just a moment.
        </p>

        {/* Progress bar */}
        <div className="w-full max-w-md mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-[#6b6b80]">Analyzing…</span>
            <span className="text-xs font-medium text-[#f16e2c]">{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#1a1a25] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#f16e2c] to-[#ff9a5c] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Analysis steps */}
        <div className="w-full max-w-md rounded-2xl bg-[#12121a] border border-[#2a2a3a] p-5">
          <div className="flex flex-col gap-3">
            {ANALYSIS_STEPS.map((step, i) => {
              const isCompleted = completedSteps.includes(i);
              const isActive = activeStep === i && !isCompleted;

              return (
                <div
                  key={step.label}
                  className={`flex items-center gap-3 transition-opacity duration-300 ${
                    i > activeStep && !isCompleted ? 'opacity-30' : 'opacity-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300 ${
                    isCompleted
                      ? 'bg-[#22c55e]/10 border border-[#22c55e]/20'
                      : isActive
                      ? 'bg-[#f16e2c]/10 border border-[#f16e2c]/20'
                      : 'bg-[#1a1a25] border border-[#2a2a3a]'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                    ) : isActive ? (
                      <Loader2 className="w-4 h-4 text-[#f16e2c] animate-spin" />
                    ) : (
                      <step.icon className="w-4 h-4 text-[#4a4a5a]" />
                    )}
                  </div>
                  <span className={`text-sm text-left ${
                    isCompleted
                      ? 'text-[#22c55e]'
                      : isActive
                      ? 'text-[#e8e8ed]'
                      : 'text-[#4a4a5a]'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalyzingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090f] flex items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-[#f16e2c]/10 border border-[#f16e2c]/20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#f16e2c] animate-spin" />
        </div>
      </div>
    }>
      <AnalyzingContent />
    </Suspense>
  );
}
