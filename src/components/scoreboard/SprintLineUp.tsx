'use client';

import Link from 'next/link';
import { Target } from 'lucide-react';

const AVATAR_GRADIENTS = [
  'from-emerald-500 to-teal-600',
  'from-primary to-emerald-600',
  'from-violet-500 to-purple-600',
  'from-sky-500 to-blue-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-teal-500',
  'from-indigo-500 to-violet-600',
];

export interface LineUpMember {
  id: string;
  name: string;
  initials: string;
  ticketCount: number;
  points: number;
  load: number;
  colorIndex: number;
}

interface SprintLineUpProps {
  members: LineUpMember[];
  sprintName?: string;
}

export function SprintLineUp({ members, sprintName }: SprintLineUpProps) {
  const sorted = [...members].sort((a, b) => b.points - a.points);
  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl bg-card border border-border/40">
        <div className="inline-block mb-4" style={{ perspective: '500px' }}>
          <div style={{ transform: 'rotateX(10deg) rotateY(-5deg)', transformStyle: 'preserve-3d' }}>
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-800/20 border border-emerald-200/50 dark:border-emerald-700/30 flex items-center justify-center shadow-md">
              <Target className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-center">No team members with assigned tickets.</p>
        <Link href="/sprint/plan" className="mt-4 text-sm font-medium text-primary hover:underline">
          Plan your sprint
        </Link>
      </div>
    );
  }

  const frontRow = sorted.slice(0, Math.ceil(sorted.length / 2));
  const backRow = sorted.slice(Math.ceil(sorted.length / 2));
  const overloadedCount = sorted.filter((m) => m.load > 90).length;
  const avgLoad = sorted.length > 0
    ? Math.round(sorted.reduce((s, m) => s + m.load, 0) / sorted.length)
    : 0;

  return (
    <div className="space-y-6">
      {sprintName && (
        <p className="text-sm text-muted-foreground text-center">Sprint: {sprintName}</p>
      )}
      {sorted.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-4 rounded-xl bg-muted/40 border border-border/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Avg load</span>
            <span className="text-sm font-bold tabular-nums text-foreground">{avgLoad}%</span>
          </div>
          {overloadedCount > 0 && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Over 90%</span>
              <span className="text-sm font-bold tabular-nums">{overloadedCount} member{overloadedCount !== 1 ? 's' : ''}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            {sorted.map((m) => (
              <div
                key={m.id}
                title={`${m.name}: ${m.load}%`}
                className={`w-2 h-6 rounded-sm transition-colors ${
                  m.load > 95 ? 'bg-destructive' : m.load > 80 ? 'bg-amber-500' : m.load > 50 ? 'bg-emerald-500' : 'bg-muted-foreground/40'
                }`}
                style={{ opacity: 0.4 + (m.load / 200) }}
              />
            ))}
          </div>
        </div>
      )}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#2d5a27]/10 to-[#1a3d16]/5 border border-border/40 p-6 sm:p-8 min-h-[280px]">
        {/* Pitch lines */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-border" />
          <div className="absolute top-1/2 left-1/2 w-16 h-16 rounded-full border-2 border-border -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative flex flex-col justify-between h-full gap-8">
          {/* Front row - most loaded */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {frontRow.map((m) => (
              <LineUpSlot key={m.id} member={m} />
            ))}
          </div>
          {/* Back row */}
          {backRow.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              {backRow.map((m) => (
                <LineUpSlot key={m.id} member={m} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sorted.map((m) => (
          <Link key={m.id} href="/team" className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40 hover:border-primary/30 hover:shadow-sm transition-all">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br ${AVATAR_GRADIENTS[m.colorIndex % AVATAR_GRADIENTS.length]}`}>
              {m.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {m.ticketCount} ticket{m.ticketCount !== 1 ? 's' : ''} · {m.points} pts · {m.load}% load
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function LineUpSlot({ member }: { member: LineUpMember }) {
  const gradient = AVATAR_GRADIENTS[member.colorIndex % AVATAR_GRADIENTS.length];
  return (
    <div className="group flex flex-col items-center gap-1.5">
      <div className="relative">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br ${gradient} shadow-md group-hover:scale-105 transition-transform`}>
          {member.initials}
        </div>
        {member.ticketCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center border-2 border-card">
            {member.ticketCount}
          </span>
        )}
      </div>
      <p className="text-[11px] font-medium text-foreground truncate max-w-[80px] text-center">{member.name}</p>
      <p className="text-[10px] text-muted-foreground tabular-nums">{member.points} pts</p>
    </div>
  );
}
