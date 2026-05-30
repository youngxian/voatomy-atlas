'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Users,
  Save,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import * as atlas from '@/lib/api';

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

interface Allocation {
  project: string;
  boardType: string;
  percentage: number;
  effectivePts: number;
}

interface SharedMember {
  name: string;
  role: string;
  allocations: Allocation[];
  total: number;
  hasConflict: boolean;
  conflictMessage?: string;
}

interface FullTimeMember {
  name: string;
  project: string;
  percentage: number;
  label?: string;
}

const sharedMembers: SharedMember[] = [
  {
    name: 'Alex Chen',
    role: 'EM / TL',
    allocations: [
      { project: 'ACME Backend', boardType: 'Jira', percentage: 60, effectivePts: 7.2 },
      { project: 'Mobile App', boardType: 'Linear', percentage: 40, effectivePts: 4.8 },
    ],
    total: 100,
    hasConflict: true,
    conflictMessage: 'Sprint 25 has overlapping deadlines between ACME Backend and Mobile App. Consider shifting 10% from Mobile to avoid context-switching overhead.',
  },
  {
    name: 'Jordan Patel',
    role: 'EM / TL',
    allocations: [
      { project: 'ACME Backend', boardType: 'Jira', percentage: 70, effectivePts: 8.4 },
      { project: 'Data Pipeline', boardType: 'ClickUp', percentage: 30, effectivePts: 3.6 },
    ],
    total: 100,
    hasConflict: false,
  },
];

const fullTimeMembers: FullTimeMember[] = [
  { name: 'Sarah', project: 'ACME Backend', percentage: 100 },
  { name: 'Priya', project: 'ACME Backend', percentage: 100 },
  { name: 'Marcus', project: 'ACME Backend', percentage: 50, label: '0.5x FTE' },
  { name: 'David', project: 'Mobile App', percentage: 100 },
  { name: 'Lisa', project: 'Mobile App', percentage: 100 },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function boardBadgeColor(boardType: string) {
  switch (boardType) {
    case 'Jira':
      return 'bg-primary';
    case 'Linear':
      return 'bg-primary';
    case 'ClickUp':
      return 'bg-primary';
    default:
      return 'bg-muted';
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function MultiProjectCapacityPage() {
  const [apiCapacity, setApiCapacity] = useState<atlas.TeamCapacity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const teamId = localStorage.getItem('atlas_active_team');
    if (!teamId) { setLoading(false); return; }
    atlas.getTeamCapacity(teamId)
      .then(setApiCapacity)
      .catch((err) => console.error('Failed to load capacity data', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Reveal>
      <div className="space-y-8">
      {/* ---- Header ---- */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Multi-Project Capacity</h1>
        <p className="text-sm text-muted-foreground mt-1">Members shared across projects</p>
      </div>

      {/* ---- Shared member cards ---- */}
      <div className="space-y-4">
        {sharedMembers.map((member) => (
          <div key={member.name} className="bento-card rounded-xl bg-card border border-border overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-sm font-bold text-white border border-border">
                  {member.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{member.name}</div>
                  <div className="text-xs text-muted-foreground">{member.role}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Total:</span>
                <span className={`text-sm font-bold ${member.total > 100 ? 'text-destructive' : 'text-foreground'}`}>
                  {member.total}%
                </span>
              </div>
            </div>

            {/* Allocations */}
            <div className="px-5 py-4 space-y-4">
              {member.allocations.map((alloc) => (
                <div key={alloc.project} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${boardBadgeColor(alloc.boardType)}`} />
                      <span className="text-sm font-medium text-foreground">{alloc.project}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded text-white ${boardBadgeColor(alloc.boardType)}`}>
                        {alloc.boardType}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-bold text-foreground tabular-nums">{alloc.percentage}%</span>
                      <span className="text-xs text-muted-foreground">{alloc.effectivePts} pts/wk</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
                      style={{ width: `${alloc.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Conflict / status */}
            <div className={`px-5 py-3 border-t border-border ${member.hasConflict ? 'bg-warning/5' : 'bg-success/5'}`}>
              {member.hasConflict ? (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <p className="text-xs text-warning/80 leading-relaxed">{member.conflictMessage}</p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-xs text-success">No conflicts</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ---- Full-time members ---- */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          Full-Time Members
        </h2>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-card border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Member</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project</th>
                <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Allocation</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Note</th>
              </tr>
            </thead>
            <tbody>
              {fullTimeMembers.map((fm, i) => (
                <tr key={`${fm.name}-${i}`} className="border-b border-border last:border-b-0 hover:bg-muted/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-white">
                        {fm.name[0]}
                      </div>
                      <span className="font-medium text-foreground">{fm.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{fm.project}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${fm.percentage === 100 ? 'bg-success' : 'bg-warning'}`}
                          style={{ width: `${fm.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium tabular-nums">{fm.percentage}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {fm.label ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/15 text-primary border border-primary/20">
                        {fm.label}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">&mdash;</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---- Save button ---- */}
      <div className="flex justify-end">
        <button className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors shadow-sm shadow-primary/20">
          <Save className="w-4 h-4" />
          Save All Allocations
        </button>
      </div>
      </div>
    </Reveal>
  );
}
