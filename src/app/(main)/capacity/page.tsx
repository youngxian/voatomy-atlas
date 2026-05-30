'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Cloud,
  PenLine,
  ArrowRight,
  Users,
  TrendingUp,
  Zap,
  Clock,
  Palmtree,
  Cpu,
  Code2,
  Server,
  Shield,
  BarChart3,
  Target,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { ErrorBanner } from '@/components/ErrorBanner';
import * as atlas from '@/lib/api';
import { useProject } from '@/lib/project-context';

type AvailabilityStatus = 'available' | 'partial' | 'ooo';
type SkillLevel = 'expert' | 'proficient' | 'learning' | 'none';

interface DisplayMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  avatarColor: string;
  capacityPercent: number;
  sprintAllocation: number;
  status: AvailabilityStatus;
  leaveNote?: string;
  skills: { backend: SkillLevel; frontend: SkillLevel; devops: SkillLevel; qa: SkillLevel };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function statusConfig(status: AvailabilityStatus) {
  switch (status) {
    case 'available':
      return { label: 'Available', color: 'text-success', bg: 'bg-success/15', border: 'border-success/20', dot: 'bg-success' };
    case 'partial':
      return { label: 'Partial', color: 'text-warning', bg: 'bg-warning/15', border: 'border-warning/20', dot: 'bg-warning' };
    case 'ooo':
      return { label: 'OOO', color: 'text-destructive', bg: 'bg-destructive/15', border: 'border-destructive/20', dot: 'bg-destructive' };
  }
}

function skillDot(level: SkillLevel) {
  switch (level) {
    case 'expert': return 'bg-success';
    case 'proficient': return 'bg-primary';
    case 'learning': return 'bg-warning';
    case 'none': return 'bg-muted';
  }
}

function skillLabel(level: SkillLevel) {
  switch (level) {
    case 'expert': return 'Expert';
    case 'proficient': return 'Proficient';
    case 'learning': return 'Learning';
    case 'none': return '--';
  }
}

function capacityBarColor(pct: number) {
  if (pct === 0) return 'bg-muted';
  if (pct < 50) return 'bg-destructive';
  if (pct < 100) return 'bg-warning';
  return 'bg-success';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const COLORS = ['#f16e2c', '#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

export default function TeamCapacityPage() {
  const { activeProjectId } = useProject();
  const [importSource, setImportSource] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'grid' | 'skills'>('grid');
  const [apiCapacity, setApiCapacity] = useState<atlas.TeamCapacity | null>(null);
  const [teamOverview, setTeamOverview] = useState<atlas.TeamOverview | null>(null);
  const [displayMembers, setDisplayMembers] = useState<DisplayMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!activeProjectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    atlas.getTeamOverview(activeProjectId)
      .then(overview => {
        setTeamOverview(overview);
        const teamId = overview.team?.id;
        if (!teamId) {
          setDisplayMembers([]);
          return;
        }
        return atlas.getTeamCapacity(teamId).then(capacity => ({ overview, capacity }));
      })
      .then(result => {
        if (!result) return;
        const { overview, capacity } = result;
        setApiCapacity(capacity);
          const members: DisplayMember[] = capacity.members.map((m, i) => {
            const tm = overview.members.find(mem => mem.id === m.member_id);
            const capacityPct = m.base_capacity > 0 ? Math.round((m.effective_capacity / m.base_capacity) * 100) : 100;
            const status: AvailabilityStatus = capacityPct >= 90 ? 'available' : capacityPct >= 25 ? 'partial' : 'ooo';
            const leaveNote = m.adjustments.find(a => a.type === 'leave')?.label;
            return {
              id: m.member_id,
              name: tm?.name ?? 'Unknown',
              initials: tm?.initials ?? (m.member_id?.slice(0, 2)?.toUpperCase() ?? '??'),
              role: tm?.role ?? '',
              avatarColor: COLORS[i % COLORS.length],
              capacityPercent: capacityPct,
              sprintAllocation: Math.round(m.effective_capacity),
              status,
              leaveNote,
              skills: { backend: 'proficient', frontend: 'proficient', devops: 'proficient', qa: 'proficient' },
            };
          });
          setDisplayMembers(members);
      })
      .catch(() => setErrorMsg('Failed to load capacity data. Please try again.'))
      .finally(() => setLoading(false));
  }, [activeProjectId]);

  const activeTotalCapacity = apiCapacity?.total_capacity ?? 0;
  const activeAllocatedPoints = apiCapacity?.adjusted_capacity ?? 0;
  const activeRemainingPoints = activeTotalCapacity - activeAllocatedPoints;
  const activeUtilization = activeTotalCapacity > 0 ? Math.round((activeAllocatedPoints / activeTotalCapacity) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!activeProjectId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <Users className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-1">Select a project</h2>
        <p className="text-sm text-muted-foreground">Choose a project to view team capacity.</p>
      </div>
    );
  }

  return (
    <Reveal>
      <div className="space-y-8">
        {errorMsg && <ErrorBanner message={errorMsg} onRetry={() => window.location.reload()} onDismiss={() => setErrorMsg(null)} />}
        {/* ---- Animated Header ---- */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center"
              style={{ animation: 'headerPulse 3s ease-in-out infinite' }}
            >
              <Users className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1
                className="text-3xl font-extrabold text-foreground"
                style={{ animation: 'fadeSlideIn 0.6s ease-out forwards' }}
              >
                Team Capacity
              </h1>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                Sprint 25 &middot; Feb 24 &ndash; Mar 7
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedView('grid')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                selectedView === 'grid'
                  ? 'bg-primary/15 border-primary/30 text-primary'
                  : 'bg-secondary border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              Capacity Grid
            </button>
            <button
              onClick={() => setSelectedView('skills')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                selectedView === 'skills'
                  ? 'bg-primary/15 border-primary/30 text-primary'
                  : 'bg-secondary border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              Skills Matrix
            </button>
          </div>
        </div>

        {/* ---- Capacity Overview ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="bento-card rounded-xl bg-card border border-border p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Capacity</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-foreground">{activeTotalCapacity}</span>
              <span className="text-lg text-muted-foreground">pts</span>
            </div>
            <p className="text-xs text-muted-foreground">{displayMembers.length} team members</p>
          </div>

          <div className="bento-card rounded-xl bg-card border border-border p-5 space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Allocated</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-primary">{activeAllocatedPoints}</span>
              <span className="text-lg text-muted-foreground">pts</span>
            </div>
            <p className="text-xs text-muted-foreground">{activeAllocatedPoints} of {activeTotalCapacity} committed</p>
          </div>

          <div className="bento-card rounded-xl bg-card border border-border p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-success" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Remaining</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-success">{activeRemainingPoints}</span>
              <span className="text-lg text-muted-foreground">pts</span>
            </div>
            <p className="text-xs text-muted-foreground">Available for allocation</p>
          </div>

          <div className="bento-card rounded-xl bg-card border border-border p-5 space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Utilization</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-primary">{activeUtilization}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-1000"
                style={{
                  width: `${activeUtilization}%`,
                  animation: 'barFillIn 1.5s ease-out forwards',
                }}
              />
            </div>
          </div>
        </div>

        {/* ---- Import availability ---- */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-card border border-border px-5 py-4">
          <span className="text-sm text-muted-foreground">Import availability from:</span>
          <div className="flex items-center gap-2">
            {[
              { id: 'gcal', label: 'Google Calendar', icon: Calendar },
              { id: 'bamboo', label: 'Bamboo HR', icon: Cloud },
              { id: 'manual', label: 'Manual', icon: PenLine },
            ].map((source) => {
              const Icon = source.icon;
              const active = importSource === source.id;
              return (
                <button
                  key={source.id}
                  onClick={() => setImportSource(active ? null : source.id)}
                  className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                    active
                      ? 'bg-primary/15 border-primary/30 text-primary shadow-sm shadow-primary/10'
                      : 'bg-secondary border-border text-muted-foreground hover:bg-muted hover:border-border/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {source.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ---- Team Member Capacity Grid ---- */}
        {selectedView === 'grid' && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Team Members</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayMembers.map((member, i) => {
                const sc = statusConfig(member.status);
                return (
                  <div
                    key={member.id}
                    className="bento-card group rounded-xl bg-card border border-border p-5 space-y-4 transition-all duration-300 hover:border-border/80 hover:bg-muted/50"
                    style={{ animation: `cardSlideUp 0.4s ease-out ${i * 0.06}s both` }}
                  >
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: member.avatarColor + '30', color: member.avatarColor }}
                      >
                        {member.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground truncate">{member.name}</span>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${sc.bg} ${sc.color} ${sc.border}`}>
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}
                              style={member.status === 'available' ? { animation: 'dotPulse 2s ease-in-out infinite' } : {}}
                            />
                            {sc.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                      </div>
                    </div>

                    {/* Capacity Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Capacity</span>
                        <span className="text-foreground font-bold">{member.capacityPercent}%</span>
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${capacityBarColor(member.capacityPercent)}`}
                          style={{
                            width: `${member.capacityPercent}%`,
                            animation: `barFillIn 1s ease-out ${i * 0.1}s both`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Sprint Allocation & Leave */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <Zap className="w-3.5 h-3.5 text-primary" />
                        <span className="text-muted-foreground">Sprint Pts:</span>
                        <span className="text-foreground font-bold">{member.sprintAllocation}</span>
                      </div>
                      {member.leaveNote && (
                        <div className="flex items-center gap-1 text-xs text-warning">
                          <Palmtree className="w-3 h-3" />
                          <span>{member.leaveNote}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---- Skills Matrix ---- */}
        {selectedView === 'skills' && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Skills Matrix</h2>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-success" /> Expert</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary" /> Proficient</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-warning" /> Learning</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-muted" /> None</span>
            </div>

            <div className="rounded-xl bg-card border border-border overflow-hidden overflow-x-auto">
              <div className="min-w-[640px]">
              {/* Header */}
              <div className="grid grid-cols-[200px_1fr_1fr_1fr_1fr] text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                <div className="px-4 py-3">Team Member</div>
                <div className="px-4 py-3 border-l border-border text-center flex items-center justify-center gap-1.5">
                  <Server className="w-3.5 h-3.5" /> Backend
                </div>
                <div className="px-4 py-3 border-l border-border text-center flex items-center justify-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" /> Frontend
                </div>
                <div className="px-4 py-3 border-l border-border text-center flex items-center justify-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" /> DevOps
                </div>
                <div className="px-4 py-3 border-l border-border text-center flex items-center justify-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> QA
                </div>
              </div>

              {/* Rows */}
              {displayMembers.map((member, i) => (
                <div
                  key={member.id}
                  className="grid grid-cols-[200px_1fr_1fr_1fr_1fr] border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors"
                  style={{ animation: `rowFadeIn 0.3s ease-out ${i * 0.05}s both` }}
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ backgroundColor: member.avatarColor + '30', color: member.avatarColor }}
                    >
                      {member.initials}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground block truncate">{member.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate">{member.role}</span>
                    </div>
                  </div>
                  {(['backend', 'frontend', 'devops', 'qa'] as const).map((skill) => (
                    <div key={skill} className="flex items-center justify-center gap-2 px-4 py-3 border-l border-border">
                      <span className={`w-3.5 h-3.5 rounded-full ${skillDot(member.skills[skill])}`} />
                      <span className="text-xs text-muted-foreground">{skillLabel(member.skills[skill])}</span>
                    </div>
                  ))}
                </div>
              ))}
              </div>
            </div>
          </div>
        )}

        {/* Capacity forecast removed - API does not provide sprint forecasts; use sprint planning for forecasts */}

        {/* ---- Save button ---- */}
        <div className="flex items-center justify-between rounded-xl bg-card border border-border px-6 py-4">
          <div className="text-sm text-muted-foreground">
            <span className="text-foreground font-semibold">{activeAllocatedPoints} pts</span> allocated of{' '}
            <span className="text-foreground font-semibold">{activeTotalCapacity} pts</span> total capacity
          </div>
          <button className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg bg-primary hover:bg-primary/90 text-white transition-all shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30">
            Save &amp; Generate Sprint Plan
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* ---- Keyframes ---- */}
        <style>{`
          @keyframes headerPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.85; }
          }
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes barFillIn {
            from { width: 0%; }
          }
          @keyframes cardSlideUp {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes dotPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.4); }
          }
          @keyframes rowFadeIn {
            from { opacity: 0; transform: translateX(-8px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}</style>
      </div>
    </Reveal>
  );
}
