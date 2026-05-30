'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Sparkles,
  GitBranch,
  Clock,
  Users,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const enrichments = [
  {
    icon: Sparkles,
    label: 'Code complexity scores added',
    detail: '47 tickets',
  },
  {
    icon: GitBranch,
    label: 'Linked to code modules',
    detail: '39 tickets',
  },
  {
    icon: Clock,
    label: 'AI effort estimates generated',
    detail: '47 tickets',
  },
  {
    icon: Users,
    label: 'Historical velocity calibrated',
    detail: '4 sprints',
  },
  {
    icon: AlertTriangle,
    label: 'Risk flags identified',
    detail: '8 tickets',
  },
  {
    icon: BarChart3,
    label: 'Sprint accuracy baseline set',
    detail: '72% current',
  },
];

const modules = [
  {
    name: 'payments/',
    complexity: 'HIGH',
    color: '#ef4444',
    bgColor: '#ef4444',
    files: 34,
    tickets: 12,
  },
  {
    name: 'auth/',
    complexity: 'MED',
    color: '#eab308',
    bgColor: '#eab308',
    files: 18,
    tickets: 8,
  },
  {
    name: 'dashboard/',
    complexity: 'LOW',
    color: '#22c55e',
    bgColor: '#22c55e',
    files: 22,
    tickets: 6,
  },
];

function ReadyContent() {
  const searchParams = useSearchParams();
  const providerName = searchParams.get('provider') || 'Your board';

  return (
    <Reveal>
      <div className="flex flex-col items-center text-center mt-4">
      {/* Big checkmark */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-[#22c55e]/20 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-[#22c55e]" />
          </div>
        </div>
        {/* Sparkle accents */}
        <div className="absolute -top-1 -right-1 w-4 h-4 text-[#f16e2c]">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="absolute -bottom-1 -left-2 w-3 h-3 text-[#f16e2c]/60">
          <Sparkles className="w-3 h-3" />
        </div>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
        {providerName} is now smarter.
      </h1>
      <p className="text-[#8b8ba0] text-lg mb-10 max-w-lg">
        ATLAS has analyzed your backlog and enriched every ticket with
        AI-powered intelligence.
      </p>

      {/* Stats card */}
      <div className="w-full max-w-lg rounded-2xl bg-[#12121a] border border-[#2a2a3a] p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">
            47 tickets enriched
          </h2>
          <span className="text-xs text-[#22c55e] bg-[#22c55e]/10 px-2.5 py-1 rounded-full font-medium">
            Complete
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {enrichments.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-[#1a1a25] flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4 text-[#f16e2c]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-[#e8e8ed]">{item.label}</span>
              </div>
              <span className="text-xs text-[#6b6b80] shrink-0">
                {item.detail}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Code Complexity Overview */}
      <div className="w-full max-w-lg rounded-2xl bg-[#12121a] border border-[#2a2a3a] p-6 mb-10">
        <h2 className="text-lg font-semibold text-white mb-1 text-left">
          Code Complexity Overview
        </h2>
        <p className="text-xs text-[#6b6b80] mb-5 text-left">
          Top modules by estimated complexity from your repository analysis
        </p>

        <div className="flex flex-col gap-3">
          {modules.map((mod) => (
            <div
              key={mod.name}
              className="flex items-center gap-4 px-4 py-3.5 rounded-xl bg-[#0a0a0f] border border-[#2a2a3a]"
            >
              {/* Module name */}
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <code className="text-sm font-mono text-[#e8e8ed]">
                  {mod.name}
                </code>
              </div>

              {/* File & ticket counts */}
              <div className="flex items-center gap-3 text-xs text-[#6b6b80]">
                <span>{mod.files} files</span>
                <span>{mod.tickets} tickets</span>
              </div>

              {/* Complexity badge */}
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-md"
                style={{
                  color: mod.color,
                  backgroundColor: `${mod.bgColor}15`,
                  border: `1px solid ${mod.bgColor}30`,
                }}
              >
                {mod.complexity}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
        <Link
          href="#"
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#12121a] border border-[#2a2a3a] text-white font-semibold hover:bg-[#1a1a25] transition-colors"
        >
          Open your {providerName} board
          <ExternalLink className="w-4 h-4 text-[#6b6b80]" />
        </Link>
        <Link
          href="/sprint/plan"
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#f16e2c] text-white font-semibold hover:bg-[#c85a22] transition-colors shadow-lg shadow-[#f16e2c]/20"
        >
          Generate Sprint Plan
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      </div>
    </Reveal>
  );
}

export default function ReadyPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <div className="w-10 h-10 rounded-full border-2 border-[#f16e2c]/30 border-t-[#f16e2c] animate-spin" />
      </div>
    }>
      <ReadyContent />
    </Suspense>
  );
}
