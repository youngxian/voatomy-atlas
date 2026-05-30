'use client';

import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
  CalendarDays,
  TrendingUp,
  GitBranch,
  AlertTriangle,
  BarChart3,
  Activity,
  Target,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const willDoItems = [
  {
    icon: TrendingUp,
    label: 'Track remaining velocity for Sprint 24',
    detail: 'Based on historical pace and current burndown',
  },
  {
    icon: GitBranch,
    label: 'Analyze code complexity for in-flight tickets',
    detail: 'Already scanning 23 active tickets',
  },
  {
    icon: AlertTriangle,
    label: 'Flag at-risk tickets before they slip',
    detail: 'Real-time risk detection using 6 signal types',
  },
];

const wontDoItems = [
  {
    icon: XCircle,
    label: 'Re-estimate already-committed tickets',
    detail: 'ATLAS respects your current sprint commitments',
  },
  {
    icon: XCircle,
    label: 'Move or reassign tickets mid-sprint',
    detail: 'Your sprint scope stays exactly as planned',
  },
  {
    icon: XCircle,
    label: 'Override your team\'s decisions',
    detail: 'ATLAS advises, your team decides',
  },
];

export default function MidSprintPage() {
  return (
    <Reveal>
      <div className="flex flex-col items-center text-center mt-4">
      {/* Sprint status badge */}
      <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/20 mb-6">
        <Activity className="w-5 h-5 text-[#3b82f6]" />
        <div className="text-left">
          <span className="text-sm text-[#3b82f6] font-semibold">
            Sprint 24 is in progress
          </span>
          <span className="text-xs text-[#3b82f6]/60 ml-2">
            Day 6 of 14
          </span>
        </div>
      </div>

      {/* Connected confirmation */}
      <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 mb-8">
        <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
        <span className="text-sm text-[#22c55e] font-medium">
          Jira connected &mdash; ACME Engineering
        </span>
      </div>

      {/* Heading */}
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
        You&apos;re joining mid-sprint.
        <br />
        <span className="text-[#8b8ba0] text-2xl md:text-3xl font-semibold">
          That&apos;s totally fine.
        </span>
      </h1>
      <p className="text-[#6b6b80] text-base mb-10 max-w-lg">
        ATLAS will observe your current sprint without disrupting it, building
        the intelligence needed to make your next sprint dramatically better.
      </p>

      {/* Sprint progress bar */}
      <div className="w-full max-w-lg mb-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#6b6b80]" />
            <span className="text-xs text-[#6b6b80]">Sprint 24 Progress</span>
          </div>
          <span className="text-xs text-[#8b8ba0] font-medium">
            Day 6 / 14
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-[#1a1a25] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#60a5fa]"
            style={{ width: '43%' }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-[#6b6b80]">Jan 13</span>
          <span className="text-xs text-[#6b6b80]">8 days remaining</span>
          <span className="text-xs text-[#6b6b80]">Jan 27</span>
        </div>
      </div>

      {/* Will do / Won't do card */}
      <div className="w-full max-w-lg rounded-2xl bg-[#12121a] border border-[#2a2a3a] overflow-hidden mb-8">
        {/* Will do section */}
        <div className="p-6 border-b border-[#2a2a3a]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" />
            </div>
            <h2 className="text-sm font-semibold text-[#22c55e]">
              What ATLAS does now
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {willDoItems.map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-3 text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-[#22c55e]/5 border border-[#22c55e]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon className="w-4 h-4 text-[#22c55e]" />
                </div>
                <div>
                  <p className="text-sm text-[#e8e8ed] font-medium">
                    {item.label}
                  </p>
                  <p className="text-xs text-[#6b6b80]">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Won't do section */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-[#ef4444]/10 flex items-center justify-center">
              <XCircle className="w-3.5 h-3.5 text-[#ef4444]" />
            </div>
            <h2 className="text-sm font-semibold text-[#ef4444]">
              What ATLAS won&apos;t do
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {wontDoItems.map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-3 text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-[#ef4444]/5 border border-[#ef4444]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon className="w-4 h-4 text-[#ef4444]/60" />
                </div>
                <div>
                  <p className="text-sm text-[#8b8ba0] font-medium">
                    {item.label}
                  </p>
                  <p className="text-xs text-[#6b6b80]">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* When Sprint 24 closes section */}
      <div className="w-full max-w-lg rounded-2xl bg-[#f16e2c]/5 border border-[#f16e2c]/15 p-6 mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-[#f16e2c]" />
          <h2 className="text-base font-semibold text-white">
            When Sprint 24 closes
          </h2>
        </div>
        <div className="flex flex-col gap-2 text-left">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#f16e2c]" />
            <span className="text-sm text-[#8b8ba0]">
              Full sprint accuracy analysis &mdash; see how close your estimates were
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#f16e2c]" />
            <span className="text-sm text-[#8b8ba0]">
              AI-generated Sprint 25 plan with calibrated estimates
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#f16e2c]" />
            <span className="text-sm text-[#8b8ba0]">
              Capacity-based recommendations for optimal team velocity
            </span>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
        <Link
          href="/dashboard"
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#12121a] border border-[#2a2a3a] text-white font-semibold hover:bg-[#1a1a25] transition-colors"
        >
          Continue to Dashboard
        </Link>
        <Link
          href="/dashboard"
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#f16e2c] text-white font-semibold hover:bg-[#c85a22] transition-colors shadow-lg shadow-[#f16e2c]/20"
        >
          View Sprint 24 Pacing
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      </div>
    </Reveal>
  );
}
