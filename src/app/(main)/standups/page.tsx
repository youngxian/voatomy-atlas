'use client';

import { useState, useEffect } from 'react';
import {
  Radio,
  Plus,
  Clock,
  Users,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  BarChart3,
  Timer,
  CircleDot,
  ArrowRight,
  MessageSquare,
  Target,
  CalendarDays,
  User,
  Zap,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { Reveal } from '@/components/Reveal';
import { ErrorBanner } from '@/components/ErrorBanner';
import * as atlas from '@/lib/api';
import { todayMembers, standupHistory } from '@/lib/standups-mock';
import type { TeamMember, StandupRecord, ActionItem } from '@/lib/standups-mock';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const energyConfig = {
  high: { color: 'bg-success', label: 'High', textColor: 'text-success' },
  medium: { color: 'bg-warning', label: 'Medium', textColor: 'text-warning' },
  low: { color: 'bg-destructive', label: 'Low', textColor: 'text-destructive' },
};

const statusConfig = {
  open: { bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary/20', label: 'Open' },
  'in-progress': { bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary/20', label: 'In Progress' },
  done: { bg: 'bg-success/15', text: 'text-success', border: 'border-success/20', label: 'Done' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StandupsPage() {
  const [expandedMembers, setExpandedMembers] = useState<Record<number, boolean>>({
    0: true, 1: true, 2: true, 3: true, 4: true,
  });
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null);
  const [actionFilter, setActionFilter] = useState<'all' | 'open' | 'in-progress' | 'done'>('all');
  const [apiTodayStandups, setApiTodayStandups] = useState<atlas.StandupEntry[] | null>(null);
  const [apiHistory, setApiHistory] = useState<atlas.StandupEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const teamId = localStorage.getItem('atlas_active_team');
    if (!teamId) { setLoading(false); return; }
    Promise.all([
      atlas.getTodayStandups(teamId).catch(() => null),
      atlas.getStandups(teamId).catch(() => null),
    ]).then(([today, history]) => {
      if (!today && !history) setErrorMsg('Failed to load data. Please try again.');
      if (today) setApiTodayStandups(today);
      if (history) setApiHistory(history);
    }).finally(() => setLoading(false));
  }, []);

  const avatarColors = ['#f16e2c', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'];

  const displayMembers: TeamMember[] = apiTodayStandups && apiTodayStandups.length > 0
    ? apiTodayStandups.map((entry, i) => ({
        name: entry.user_id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        role: 'IC',
        avatar: avatarColors[i % avatarColors.length],
        yesterday: entry.yesterday,
        today: entry.today,
        blockers: entry.blockers || null,
      }))
    : todayMembers;

  const displayHistory: StandupRecord[] = apiHistory && apiHistory.length > 0
    ? (() => {
        const byDate: Record<string, atlas.StandupEntry[]> = {};
        apiHistory.forEach(e => {
          const d = e.entry_date.split('T')[0];
          (byDate[d] ??= []).push(e);
        });
        return Object.entries(byDate)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([dateStr, entries], i) => {
            const d = new Date(dateStr + 'T00:00:00');
            return {
              id: i + 1,
              date: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
              dateShort: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              day: d.toLocaleDateString('en-US', { weekday: 'long' }),
              duration: Math.round(8 + entries.length * 2),
              attendees: entries.length,
              totalMembers: entries.length,
              summary: entries.map(e => e.today).filter(Boolean).join('. '),
              blockerCount: entries.filter(e => e.blockers).length,
              energy: (entries.filter(e => e.blockers).length > 2 ? 'low' : entries.filter(e => e.blockers).length > 0 ? 'medium' : 'high') as 'high' | 'medium' | 'low',
            };
          });
      })()
    : standupHistory;

  const apiActionItems: ActionItem[] = (() => {
    const allEntries = [...(apiTodayStandups ?? []), ...(apiHistory ?? [])];
    const withBlockers = allEntries.filter(e => e.blockers && e.blockers.trim());
    const seen = new Set<string>();
    const items: ActionItem[] = [];
    let id = 0;
    for (const e of withBlockers) {
      const key = `${e.entry_date}-${e.user_id}-${e.blockers}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const dateStr = e.entry_date.split('T')[0];
      const d = new Date(dateStr + 'T00:00:00');
      items.push({
        id: ++id,
        title: e.blockers!.trim(),
        owner: e.user_id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        ownerColor: avatarColors[items.length % avatarColors.length],
        status: 'open' as const,
        sourceDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }
    return items;
  })();

  const toggleMember = (idx: number) =>
    setExpandedMembers((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const filteredActions =
    actionFilter === 'all'
      ? apiActionItems
      : apiActionItems.filter((a) => a.status === actionFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {errorMsg && <ErrorBanner message={errorMsg} onRetry={() => window.location.reload()} onDismiss={() => setErrorMsg(null)} />}
      <style>{`
        @keyframes standup-pulse {
          0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--primary) 0%, transparent); }
          50% { box-shadow: 0 0 20px 6px color-mix(in srgb, var(--primary) 15%, transparent); }
        }
        @keyframes standup-slide-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes standup-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes standup-scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes standup-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes standup-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes standup-border-glow {
          0%, 100% { border-color: color-mix(in srgb, var(--primary) 20%, transparent); }
          50% { border-color: color-mix(in srgb, var(--primary) 50%, transparent); }
        }
        .standup-glass {
          background: hsl(var(--card));
        }
        .standup-shimmer-bg {
          background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--primary) 4%, transparent), transparent);
          background-size: 200% 100%;
          animation: standup-shimmer 4s linear infinite;
        }
      `}</style>

      {/* ----------------------------------------------------------------- */}
      {/* Header */}
      {/* ----------------------------------------------------------------- */}
      <Reveal>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center"
              style={{ animation: 'standup-pulse 3s ease-in-out infinite' }}
            >
              <Radio className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Daily Standups</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Team Sync Hub
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="orange">Sprint 25</Badge>
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4" />
              New Standup
            </Button>
          </div>
        </div>
      </Reveal>

      {/* ----------------------------------------------------------------- */}
      {/* Today's Standup - Featured Card */}
      {/* ----------------------------------------------------------------- */}
      <Reveal delay={0.05}>
        <div
          className="rounded-2xl border border-primary/30 overflow-hidden"
          style={{ animation: 'standup-border-glow 4s ease-in-out infinite' }}
        >
          {/* Top banner */}
          <div className="standup-shimmer-bg px-6 py-4 border-b border-primary/20 bg-primary/5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <h2 className="text-lg font-bold text-foreground">
                  Today&apos;s Standup
                </h2>
                <Badge variant="success">Completed</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Feb 21, 2025
                </span>
                <span className="flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5" />
                  12 min
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  5/5
                </span>
              </div>
            </div>
          </div>

          {/* Team member updates */}
          <div className="bg-card divide-y divide-border/60">
            {displayMembers.map((member, idx) => {
              const isOpen = expandedMembers[idx] ?? false;
              return (
                <div
                  key={member.name}
                  className="px-6 py-0"
                  style={{
                    animation: `standup-slide-up 0.4s ease-out ${idx * 0.07}s both`,
                  }}
                >
                  <button
                    onClick={() => toggleMember(idx)}
                    className="w-full flex items-center gap-3 py-4 text-left group"
                  >
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ring-background"
                      style={{ backgroundColor: member.avatar }}
                    >
                      {member.name.split(' ').map((n) => n[0]).join('')}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {member.name}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted/50">
                          {member.role}
                        </span>
                        {member.blockers && (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-destructive">
                            <AlertTriangle className="w-3 h-3" />
                            Blocker
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div
                      className="pb-4 pl-12 space-y-3"
                      style={{ animation: 'standup-fade-in 0.25s ease-out' }}
                    >
                      {/* Yesterday */}
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 w-5 h-5 rounded flex items-center justify-center bg-muted/50 shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-success" />
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                            Yesterday
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {member.yesterday}
                          </p>
                        </div>
                      </div>

                      {/* Today */}
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 w-5 h-5 rounded flex items-center justify-center bg-primary/10 shrink-0">
                          <Target className="w-3 h-3 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                            Today
                          </p>
                          <p className="text-sm text-foreground leading-relaxed">
                            {member.today}
                          </p>
                        </div>
                      </div>

                      {/* Blockers */}
                      {member.blockers && (
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 w-5 h-5 rounded flex items-center justify-center bg-destructive/10 shrink-0">
                            <AlertTriangle className="w-3 h-3 text-destructive" />
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-destructive/80 uppercase tracking-wider mb-0.5">
                              Blocker
                            </p>
                            <p className="text-sm text-destructive/90 leading-relaxed">
                              {member.blockers}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>

      {/* ----------------------------------------------------------------- */}
      {/* AI Summary */}
      {/* ----------------------------------------------------------------- */}
      <Reveal delay={0.1}>
        <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center"
              style={{ animation: 'standup-float 3s ease-in-out infinite' }}
            >
              <Sparkles className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">ATLAS AI Summary</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Auto-generated from today&apos;s standup
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-muted/60 border border-border p-4 space-y-3">
            <p className="text-sm text-foreground leading-relaxed">
              2 blockers identified (infrastructure dependencies), velocity on track, 3 tickets progressed.
              Team alignment is strong with no scope changes. Key risk: Elasticsearch and Sendgrid provisioning
              delays could impact search autocomplete and email notification deliverables by mid-sprint.
            </p>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                <AlertTriangle className="w-3 h-3" />
                2 Active Blockers
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success/10 border border-success/20 text-xs text-success">
                <TrendingUp className="w-3 h-3" />
                Velocity On Track
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary">
                <Zap className="w-3 h-3" />
                3 Tickets Progressed
              </span>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground italic">
            Recommendation: Escalate Elasticsearch provisioning to unblock COMP-223 before Wed.
          </p>
        </div>
      </Reveal>

      {/* ----------------------------------------------------------------- */}
      {/* Metrics Panel */}
      {/* ----------------------------------------------------------------- */}
      <Reveal delay={0.15}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Avg Duration',
              value: '11',
              unit: 'min',
              icon: Timer,
              color: 'var(--primary)',
              trend: '-8% vs last sprint',
              trendPositive: true,
            },
            {
              label: 'Avg Blockers/Day',
              value: '1.4',
              unit: '',
              icon: AlertTriangle,
              color: 'var(--destructive)',
              trend: '+0.2 from last week',
              trendPositive: false,
            },
            {
              label: 'Attendance Rate',
              value: '96',
              unit: '%',
              icon: Users,
              color: 'var(--success)',
              trend: 'Consistent',
              trendPositive: true,
            },
            {
              label: 'Blocker Resolution',
              value: '1.2',
              unit: 'days',
              icon: Zap,
              color: 'var(--primary)',
              trend: '-0.4 days improved',
              trendPositive: true,
            },
          ].map((metric, idx) => (
            <div
              key={metric.label}
              className="standup-glass bento-card rounded-xl border border-border p-5 space-y-3"
              style={{
                animation: `standup-scale-in 0.4s ease-out ${idx * 0.08}s both`,
              }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `color-mix(in srgb, ${metric.color} 15%, transparent)`, border: `1px solid color-mix(in srgb, ${metric.color} 30%, transparent)` }}
                >
                  <metric.icon className="w-4 h-4" style={{ color: metric.color }} />
                </div>
                <div
                  className={`text-[10px] font-medium ${
                    metric.trendPositive ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {metric.trend}
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground tabular-nums">
                    {metric.value}
                  </span>
                  {metric.unit && (
                    <span className="text-xs text-muted-foreground">{metric.unit}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{metric.label}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ----------------------------------------------------------------- */}
      {/* Standup History Timeline */}
      {/* ----------------------------------------------------------------- */}
      <Reveal delay={0.2}>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Standup History</h2>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-primary/40 via-border to-border/30" />

            <div className="space-y-3">
              {displayHistory.map((standup, idx) => {
                const isExpanded = expandedHistory === standup.id;
                const energy = energyConfig[standup.energy];

                return (
                  <div
                    key={standup.id}
                    className="relative pl-10"
                    style={{
                      animation: `standup-slide-up 0.4s ease-out ${idx * 0.06}s both`,
                    }}
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-4">
                        <div className={`w-[30px] h-[30px] rounded-full border-2 border-border bg-card flex items-center justify-center`}>
                        <CircleDot className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedHistory(isExpanded ? null : standup.id)}
                      className="w-full text-left"
                    >
                      <div
                        className={`bento-card rounded-xl border transition-all duration-300 overflow-hidden ${
                          isExpanded
                            ? 'bg-muted/50 border-border/80'
                            : 'bg-card border-border hover:border-border/80'
                        }`}
                      >
                        <div className="p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="text-center shrink-0">
                              <p className="text-xs text-muted-foreground">{standup.day}</p>
                              <p className="text-sm font-bold text-foreground">{standup.dateShort}</p>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm text-muted-foreground truncate">
                                {standup.summary}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {standup.duration} min
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {standup.attendees}/{standup.totalMembers}
                                </span>
                                {standup.blockerCount > 0 && (
                                  <span className="flex items-center gap-1 text-destructive">
                                    <AlertTriangle className="w-3 h-3" />
                                    {standup.blockerCount} blocker{standup.blockerCount !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {/* Energy indicator */}
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full ${energy.color}`} />
                              <span className={`text-[10px] font-medium ${energy.textColor}`}>
                                {energy.label}
                              </span>
                            </div>

                            <ChevronRight
                              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                                isExpanded ? 'rotate-90' : ''
                              }`}
                            />
                          </div>
                        </div>

                        {isExpanded && (
                          <div
                            className="border-t border-border px-4 py-4 space-y-3"
                            style={{ animation: 'standup-fade-in 0.25s ease-out' }}
                          >
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div className="rounded-lg bg-muted border border-border p-3 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Duration</p>
                                <p className="text-lg font-bold text-foreground tabular-nums">{standup.duration}<span className="text-xs text-muted-foreground"> min</span></p>
                              </div>
                              <div className="rounded-lg bg-muted border border-border p-3 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Attendance</p>
                                <p className="text-lg font-bold text-success tabular-nums">{standup.attendees}/{standup.totalMembers}</p>
                              </div>
                              <div className="rounded-lg bg-muted border border-border p-3 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Blockers</p>
                                <p className={`text-lg font-bold tabular-nums ${standup.blockerCount > 0 ? 'text-destructive' : 'text-success'}`}>{standup.blockerCount}</p>
                              </div>
                              <div className="rounded-lg bg-muted border border-border p-3 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Energy</p>
                                <div className="flex items-center justify-center gap-1.5">
                                  <div className={`w-2.5 h-2.5 rounded-full ${energy.color}`} />
                                  <span className={`text-sm font-bold ${energy.textColor}`}>{energy.label}</span>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-lg bg-muted/50 border border-border/50 p-3">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Summary</p>
                              <p className="text-sm text-muted-foreground leading-relaxed">{standup.summary}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Reveal>

      {/* ----------------------------------------------------------------- */}
      {/* Action Items Tracker */}
      {/* ----------------------------------------------------------------- */}
      <Reveal delay={0.25}>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Action Items</h2>
              <span className="text-xs text-muted-foreground">
                {apiActionItems.filter((a) => a.status !== 'done').length} open
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {(['all', 'open', 'in-progress', 'done'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActionFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    actionFilter === filter
                      ? 'bg-primary text-white'
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground border border-border'
                  }`}
                >
                  {filter === 'all' ? 'All' : filter === 'in-progress' ? 'In Progress' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filteredActions.map((item, idx) => {
              const config = statusConfig[item.status];
              return (
                <div
                  key={item.id}
                  className="bento-card rounded-xl bg-card border border-border hover:border-border/80 transition-colors p-4 flex items-start gap-3"
                  style={{
                    animation: `standup-slide-up 0.3s ease-out ${idx * 0.05}s both`,
                  }}
                >
                  {/* Status indicator */}
                  <div className="mt-0.5">
                    {item.status === 'done' ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : item.status === 'in-progress' ? (
                      <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-border/80" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-relaxed ${
                        item.status === 'done'
                          ? 'text-muted-foreground line-through'
                          : 'text-foreground'
                      }`}
                    >
                      {item.title}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white"
                          style={{ backgroundColor: item.ownerColor }}
                        >
                          {item.owner.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <span className="text-xs text-muted-foreground">{item.owner}</span>
                      </div>
                      <span className="text-xs text-muted-foreground/40">|</span>
                      <span className="text-xs text-muted-foreground">from {item.sourceDate}</span>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${config.bg} ${config.text} ${config.border}`}
                      >
                        {config.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredActions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No action items match this filter.</p>
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}
