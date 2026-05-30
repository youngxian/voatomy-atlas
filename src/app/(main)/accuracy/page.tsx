'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  Brain,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Minus,
  Lightbulb,
  Activity,
  Users,
  Layers,
  Sparkles,
  Gauge,
  PieChart,
} from 'lucide-react';
import { SuccessIcon } from '@/components/ui/animated-state-icons';
import { Card, Badge } from '@/components/ui';
import { Reveal } from '@/components/Reveal';
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Cell } from 'recharts';
import { useProject } from '@/lib/project-context';
import { getProviderLabel } from '@/lib/project-utils';
import * as api from '@/lib/api';

const AVATAR_COLORS = ['#22C55E', '#06b6d4', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#f16e2c'];

/* ------------------------------------------------------------------ */
/*  Animated Gauge                                                     */
/* ------------------------------------------------------------------ */

function AccuracyGauge({ value, target = 80 }: { value: number; target?: number }) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const radius = 80;
  const strokeWidth = 12;
  const circumference = Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;

  const getColor = (v: number) => {
    if (v >= 80) return 'var(--success)';
    if (v >= 60) return 'var(--warning)';
    return 'var(--destructive)';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 200, height: 120 }}>
        <svg width="200" height="120" viewBox="0 0 200 120" className="overflow-visible">
          <defs>
            <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={getColor(animatedValue)} stopOpacity="0.8" />
              <stop offset="100%" stopColor={getColor(animatedValue)} />
            </linearGradient>
            <filter id="gaugeGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path d="M 20 110 A 80 80 0 0 1 180 110" fill="none" stroke="var(--muted)" strokeWidth={strokeWidth} strokeLinecap="round" />
          <path
            d="M 20 110 A 80 80 0 0 1 180 110"
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            filter="url(#gaugeGlow)"
            style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease' }}
          />
          {/* Target marker */}
          {(() => {
            const angle = Math.PI - (target / 100) * Math.PI;
            const mx = 100 + radius * Math.cos(angle);
            const my = 110 - radius * Math.sin(angle);
            return (
              <g>
                <circle cx={mx} cy={my} r={4} fill="white" stroke="var(--muted-foreground)" strokeWidth={1.5} />
                <text x={mx} y={my - 10} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)" fontWeight="600">{target}%</text>
              </g>
            );
          })()}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className="text-4xl font-bold tabular-nums" style={{ color: getColor(animatedValue), transition: 'color 0.5s ease', fontFamily: 'var(--font-serif, Georgia, serif)' }}>
            {animatedValue}%
          </span>
          <span className="text-xs text-muted-foreground mt-0.5">Overall Accuracy</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Breakdown Bar                                                      */
/* ------------------------------------------------------------------ */

function BreakdownBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-secondary-foreground">{label}</span>
        <span className="text-sm font-semibold tabular-nums" style={{ color }}>{value}%</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AccuracyPage() {
  const { activeProjectId, activeProject, activeSprint } = useProject();
  const [viewMode, setViewMode] = useState<'overview' | 'stories' | 'team' | 'modules'>('overview');
  const [loading, setLoading] = useState(true);

  const [apiOverview, setApiOverview] = useState<api.AccuracyOverview | null>(null);
  const [apiHistory, setApiHistory] = useState<api.AccuracyHistory | null>(null);
  const [apiTickets, setApiTickets] = useState<api.TicketAccuracyDetail[]>([]);
  const [apiTeam, setApiTeam] = useState<api.TeamAccuracy | null>(null);
  const [apiModules, setApiModules] = useState<api.ModuleAccuracy | null>(null);

  useEffect(() => {
    if (!activeProjectId) { setLoading(false); return; }
    setLoading(true);
    const sprintId = activeSprint?.id;
    Promise.all([
      api.getAccuracyOverview(activeProjectId).catch(() => null),
      api.getAccuracyHistory(activeProjectId).catch(() => null),
      sprintId ? api.getSprintAccuracyTickets(activeProjectId, sprintId).catch(() => []) : Promise.resolve([]),
      api.getTeamAccuracy(activeProjectId).catch(() => null),
      api.getModuleAccuracy(activeProjectId).catch(() => null),
    ]).then(([ov, hist, tix, team, mods]) => {
      setApiOverview(ov);
      setApiHistory(hist);
      setApiTickets(Array.isArray(tix) ? tix : []);
      setApiTeam(team);
      setApiModules(mods);
    }).finally(() => setLoading(false));
  }, [activeProjectId, activeSprint?.id]);

  const entries = apiHistory?.entries ?? [];
  const currentEntry = entries.length > 0 ? entries[entries.length - 1] : null;
  const previousEntry = entries.length > 1 ? entries[entries.length - 2] : null;

  const currentAccuracy = apiOverview?.current_accuracy ?? currentEntry?.accuracy_pct ?? 0;
  const targetAccuracy = apiOverview?.target_accuracy ?? 80;
  const trendDelta = apiOverview
    ? apiOverview.current_accuracy - apiOverview.previous_accuracy
    : currentEntry && previousEntry
      ? Math.round(currentEntry.accuracy_pct - previousEntry.accuracy_pct)
      : 0;
  const firstEntry = entries.length > 0 ? entries[0] : null;
  const improvementSinceFirst = firstEntry ? Math.round(currentAccuracy - firstEntry.accuracy_pct) : 0;

  const providerLabel = getProviderLabel(activeProject);

  const tickets = apiTickets;
  const accurateCount = tickets.filter(t => Math.abs(t.variance) <= 1).length;
  const overCount = tickets.filter(t => t.variance > 1).length;
  const underCount = tickets.filter(t => t.variance < -1).length;

  const teamMembers = apiTeam?.members ?? [];
  const modules = apiModules?.modules ?? [];

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Gauge },
    { id: 'stories' as const, label: 'Story-Level', icon: Layers },
    { id: 'team' as const, label: 'Team', icon: Users },
    { id: 'modules' as const, label: 'Modules', icon: PieChart },
  ];

  return (
    <Reveal>
      <div className="space-y-6">
        {/* ---- Header ---- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
              <SuccessIcon size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>Sprint Accuracy</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="info">{providerLabel}</Badge>
                <span className="text-sm text-muted-foreground">{activeProject?.name ?? 'Project'}</span>
              </div>
            </div>
          </div>
          {improvementSinceFirst > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/15">
              <TrendingUp className="w-3.5 h-3.5" />
              +{improvementSinceFirst}% since ATLAS connected
            </span>
          )}
        </div>

        {/* ---- Tab Switcher ---- */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/50 border border-border/50 w-fit">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === tab.id
                    ? 'bg-card text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-secondary-foreground'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ================================================================ */}
        {/*  OVERVIEW TAB                                                    */}
        {/* ================================================================ */}
        {viewMode === 'overview' && (
          <div className="space-y-6">
            {/* Gauge + Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bento-card rounded-2xl flex flex-col items-center justify-center py-6 lg:col-span-1">
                <AccuracyGauge value={currentAccuracy} target={targetAccuracy} />
                <div className="flex items-center gap-2 mt-4">
                  <Badge variant={currentAccuracy >= targetAccuracy ? 'success' : 'warning'}>
                    {currentAccuracy >= targetAccuracy ? 'Above Target' : 'Below Target'}
                  </Badge>
                  {trendDelta !== 0 && (
                    <div className="flex items-center gap-1 text-xs">
                      {trendDelta > 0 ? (
                        <ArrowUp className="w-3 h-3 text-success" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-destructive" />
                      )}
                      <span className={trendDelta > 0 ? 'text-success' : 'text-destructive'}>
                        {trendDelta > 0 ? '+' : ''}{trendDelta}% vs prev sprint
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="bento-card rounded-2xl space-y-5 lg:col-span-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Sprint Summary</h2>
                  {currentEntry && <Badge variant="muted">{currentEntry.sprint_name}</Badge>}
                </div>
                {currentEntry ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: 'Planned', value: `${currentEntry.planned_points} pts`, color: 'var(--primary)' },
                        { label: 'Actual', value: `${currentEntry.actual_points} pts`, color: 'var(--success)' },
                        { label: 'Completed', value: `${currentEntry.completed}`, color: 'var(--success)' },
                        { label: 'Carried Over', value: `${currentEntry.carried_over}`, color: currentEntry.carried_over > 0 ? 'var(--warning)' : 'var(--muted-foreground)' },
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg bg-secondary border border-border p-3 text-center">
                          <p className="text-[10px] text-secondary-foreground uppercase tracking-wider">{item.label}</p>
                          <p className="text-lg font-bold mt-0.5" style={{ color: item.color }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <BreakdownBar label="Accuracy" value={Math.round(currentEntry.accuracy_pct)} color={currentEntry.accuracy_pct >= targetAccuracy ? 'var(--success)' : 'var(--warning)'} />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No sprint data available yet.</p>
                )}
              </Card>
            </div>

            {/* Sprint Comparison */}
            {entries.length > 0 && (
              <Card className="bento-card rounded-2xl !p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">Sprint Comparison</h2>
                  </div>
                  <Badge variant="muted">{entries.length} sprint{entries.length !== 1 ? 's' : ''}</Badge>
                </div>
                {(() => {
                  const barData = entries.map((e, i) => ({
                    label: e.sprint_name || `Sprint ${i + 1}`,
                    accuracy: Math.round(e.accuracy_pct),
                    aboveTarget: e.accuracy_pct >= targetAccuracy,
                    isFirst: i === 0 && entries.length > 1,
                  }));
                  const barConfig: ChartConfig = {
                    accuracy: { label: 'Accuracy', color: 'var(--primary)' },
                  };
                  return (
                    <ChartContainer config={barConfig} className="h-52 w-full">
                      <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
                        <defs>
                          <linearGradient id="barGradGood" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="var(--primary)" />
                            <stop offset="100%" stopColor="var(--primary)" />
                          </linearGradient>
                          <linearGradient id="barGradWarn" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="var(--warning)" />
                            <stop offset="100%" stopColor="var(--warning)" />
                          </linearGradient>
                          <linearGradient id="barGradBase" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="var(--muted)" />
                            <stop offset="100%" stopColor="var(--muted)" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 8" stroke="var(--border)" horizontal vertical={false} />
                        <ReferenceLine
                          y={targetAccuracy}
                          stroke="var(--primary)"
                          strokeDasharray="6 4"
                          strokeWidth={1.5}
                          strokeOpacity={0.5}
                          label={{ value: `${targetAccuracy}% target`, position: 'insideTopRight', fill: 'var(--primary)', fontSize: 10, fontWeight: 600 }}
                        />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickMargin={8} />
                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => `${v}%`} width={36} />
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0]?.payload;
                            const color = d.aboveTarget ? 'var(--primary)' : 'var(--warning)';
                            return (
                              <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg">
                                <p className="text-xs text-muted-foreground">{d.label}</p>
                                <p className="text-sm font-bold" style={{ color }}>{d.accuracy}% accuracy</p>
                              </div>
                            );
                          }}
                          cursor={{ fill: 'var(--primary)', fillOpacity: 0.04, radius: 4 }}
                        />
                        <Bar dataKey="accuracy" radius={[8, 8, 0, 0]} maxBarSize={56}>
                          {barData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.isFirst ? 'url(#barGradBase)' : entry.aboveTarget ? 'url(#barGradGood)' : 'url(#barGradWarn)'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  );
                })()}
                <div className="relative h-1 bg-muted rounded-full overflow-hidden">
                  <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-destructive via-warning to-primary" style={{ width: '100%' }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-secondary-foreground">
                  {firstEntry && <span>First: {Math.round(firstEntry.accuracy_pct)}%</span>}
                  <span className="text-primary font-medium">Current: {currentAccuracy}%</span>
                </div>
              </Card>
            )}

            {/* AI Insights */}
            {(() => {
              const generatedInsights: { type: 'success' | 'warning' | 'info'; title: string; description: string; icon: typeof CheckCircle2 }[] = [];

              if (entries.length >= 2 && improvementSinceFirst > 0) {
                generatedInsights.push({
                  type: 'success', icon: CheckCircle2,
                  title: 'Estimation accuracy improving',
                  description: `Your team improved by ${improvementSinceFirst}% over the last ${entries.length} sprint${entries.length !== 1 ? 's' : ''}.`,
                });
              }

              const worstModule = [...modules].sort((a, b) => a.accuracy_pct - b.accuracy_pct)[0];
              if (worstModule && worstModule.accuracy_pct < targetAccuracy) {
                generatedInsights.push({
                  type: 'warning', icon: AlertTriangle,
                  title: `${worstModule.label} underestimated`,
                  description: `${worstModule.label} has the lowest accuracy at ${Math.round(worstModule.accuracy_pct)}% with an average variance of ${worstModule.avg_variance > 0 ? '+' : ''}${worstModule.avg_variance.toFixed(1)} pts. Consider adding a complexity buffer.`,
                });
              }

              if (entries.length >= 3) {
                const avg = entries.reduce((s, e) => s + e.planned_points, 0) / entries.length;
                generatedInsights.push({
                  type: 'info', icon: Lightbulb,
                  title: 'Average planned velocity',
                  description: `Your team averages ${Math.round(avg)} points/sprint across ${entries.length} sprints.`,
                });
              }

              const carryOverRate = entries.length > 0
                ? entries.reduce((s, e) => s + e.carried_over, 0) / entries.reduce((s, e) => s + e.ticket_count, 0) * 100
                : 0;
              if (carryOverRate > 0 && carryOverRate < 20) {
                generatedInsights.push({
                  type: 'success', icon: CheckCircle2,
                  title: 'Low carry-over rate',
                  description: `Only ${Math.round(carryOverRate)}% of tickets are carried over between sprints.`,
                });
              } else if (carryOverRate >= 20) {
                generatedInsights.push({
                  type: 'warning', icon: AlertTriangle,
                  title: 'High carry-over rate',
                  description: `${Math.round(carryOverRate)}% of tickets are carried over between sprints. Consider reducing sprint scope.`,
                });
              }

              if (generatedInsights.length === 0) return null;

              return (
                <Card className="bento-card rounded-2xl !p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">Accuracy Insights</h2>
                    <Badge variant="accent">AI-Generated</Badge>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {generatedInsights.map((insight, i) => {
                      const InsightIcon = insight.icon;
                      return (
                        <div
                          key={i}
                          className={`rounded-lg border p-4 space-y-2 ${
                            insight.type === 'success' ? 'bg-success/5 border-success/15' :
                            insight.type === 'warning' ? 'bg-warning/5 border-warning/15' :
                            'bg-primary/5 border-primary/15'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <InsightIcon className={`w-3.5 h-3.5 ${
                              insight.type === 'success' ? 'text-success' :
                              insight.type === 'warning' ? 'text-warning' :
                              'text-primary'
                            }`} />
                            <h3 className={`text-sm font-semibold ${
                              insight.type === 'success' ? 'text-success' :
                              insight.type === 'warning' ? 'text-warning' :
                              'text-primary'
                            }`}>{insight.title}</h3>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })()}

            {/* Sprint History Table */}
            {entries.length > 0 && (
              <Card className="bento-card rounded-2xl !p-0 overflow-hidden">
                <div className="px-5 pt-5 pb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Sprint History</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y border-border bg-secondary">
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">Sprint</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">Accuracy</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">Planned</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">Actual</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">Delta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...entries].reverse().map((entry) => {
                        const delta = entry.actual_points - entry.planned_points;
                        const acc = Math.round(entry.accuracy_pct);
                        return (
                          <tr key={entry.sprint_id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                            <td className="px-5 py-3">
                              <Link href={`/accuracy/${entry.sprint_id}`} className="inline-flex items-center gap-1.5 text-primary font-medium hover:text-accent-foreground transition-colors">
                                {entry.sprint_name || entry.sprint_id}
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${acc}%`, backgroundColor: acc >= targetAccuracy ? 'var(--success)' : 'var(--warning)' }} />
                                </div>
                                <span className="font-medium text-foreground tabular-nums">{acc}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-muted-foreground tabular-nums">{entry.planned_points} pts</td>
                            <td className="px-4 py-3 text-center text-muted-foreground tabular-nums">{entry.actual_points} pts</td>
                            <td className="px-5 py-3 text-right">
                              <span className={`font-medium tabular-nums ${delta < 0 ? 'text-destructive' : delta > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                                {delta > 0 ? '+' : ''}{delta} pts
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/*  STORY-LEVEL TAB                                                 */}
        {/* ================================================================ */}
        {viewMode === 'stories' && (
          <div className="space-y-6">
            {/* Summary bar */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bento-card rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{accurateCount}</p>
                    <p className="text-xs text-muted-foreground">Accurate (±1 pt)</p>
                  </div>
                </div>
              </Card>
              <Card className="bento-card rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <ArrowUp className="w-4 h-4 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{overCount}</p>
                    <p className="text-xs text-muted-foreground">Over-estimated</p>
                  </div>
                </div>
              </Card>
              <Card className="bento-card rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ArrowDown className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{underCount}</p>
                    <p className="text-xs text-muted-foreground">Under-estimated</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Story Table */}
            <Card className="!p-0 overflow-hidden">
              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Ticket-Level Accuracy</h2>
                  {activeSprint && <Badge variant="muted">{activeSprint.name}</Badge>}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-success" /> Accurate</span>
                  <span className="flex items-center gap-1"><ArrowUp className="w-3 h-3 text-destructive" /> Over</span>
                  <span className="flex items-center gap-1"><ArrowDown className="w-3 h-3 text-primary" /> Under</span>
                </div>
              </div>
              {tickets.length === 0 ? (
                <div className="px-5 pb-5">
                  <p className="text-sm text-muted-foreground py-8 text-center">No ticket accuracy data available for the current sprint.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y border-border bg-secondary">
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">Ticket</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">Planned</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">Actual</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">Variance</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">Status</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">Assignee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((ticket, idx) => {
                        const status: 'accurate' | 'over' | 'under' = Math.abs(ticket.variance) <= 1 ? 'accurate' : ticket.variance > 1 ? 'over' : 'under';
                        const displayName = ticket.assignee_name || 'Unassigned';
                        const initials = displayName !== 'Unassigned'
                          ? displayName.split(/[\s._-]+/).map(p => p[0]?.toUpperCase()).join('').slice(0, 2)
                          : '?';
                        const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                        return (
                          <tr key={ticket.ticket_id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                            <td className="px-5 py-3">
                              <span className="text-[10px] text-secondary-foreground font-mono block">{ticket.external_id || ticket.ticket_id}</span>
                              <p className="text-sm text-foreground font-medium truncate max-w-xs">{ticket.title}</p>
                            </td>
                            <td className="px-4 py-3 text-center text-muted-foreground tabular-nums">{ticket.planned_points} pts</td>
                            <td className="px-4 py-3 text-center text-foreground tabular-nums font-medium">{ticket.actual_points} pts</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-semibold tabular-nums ${
                                Math.abs(ticket.variance) <= 1 ? 'text-success' : ticket.variance > 1 ? 'text-destructive' : 'text-primary'
                              }`}>
                                {ticket.variance > 0 ? '+' : ''}{ticket.variance}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {status === 'accurate' && <Badge variant="success"><CheckCircle2 className="w-2.5 h-2.5" /> Accurate</Badge>}
                              {status === 'over' && <Badge variant="danger"><ArrowUp className="w-2.5 h-2.5" /> Over</Badge>}
                              {status === 'under' && <Badge variant="info"><ArrowDown className="w-2.5 h-2.5" /> Under</Badge>}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="inline-flex items-center gap-2">
                                <div className="inline-flex w-7 h-7 rounded-full items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: color }}>
                                  {initials}
                                </div>
                                <span className="text-xs text-muted-foreground truncate max-w-[100px]">{displayName}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ================================================================ */}
        {/*  TEAM TAB                                                        */}
        {/* ================================================================ */}
        {viewMode === 'team' && (
          <div className="space-y-6">
            <Card className="!p-6">
              <div className="flex items-center gap-2 mb-5">
                <Users className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Team Estimation Accuracy</h2>
                {activeSprint && <Badge variant="muted">{activeSprint.name}</Badge>}
              </div>
              {teamMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No team accuracy data available yet.</p>
              ) : (
                <div className="space-y-4">
                  {[...teamMembers]
                    .sort((a, b) => b.accuracy_pct - a.accuracy_pct)
                    .map((member, idx) => {
                      const acc = Math.round(member.accuracy_pct);
                      const displayName = member.assignee_name || member.assignee_id;
                      const initials = (member.assignee_name || '')
                        .split(/[\s._-]+/)
                        .map(p => p[0]?.toUpperCase())
                        .join('')
                        .slice(0, 2) || '?';
                      const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                      return (
                        <div key={member.assignee_id} className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border/50 hover:shadow-sm transition-all">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: color }}>
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-foreground">{displayName}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold tabular-nums ${acc >= 80 ? 'text-success' : acc >= 70 ? 'text-warning' : 'text-destructive'}`}>
                                  {acc}%
                                </span>
                                {member.avg_variance < -0.5 && <ArrowDown className="w-3 h-3 text-primary" />}
                                {member.avg_variance > 0.5 && <ArrowUp className="w-3 h-3 text-destructive" />}
                                {Math.abs(member.avg_variance) <= 0.5 && <Minus className="w-3 h-3 text-secondary-foreground" />}
                              </div>
                            </div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${acc}%`, backgroundColor: acc >= 80 ? 'var(--success)' : acc >= 70 ? 'var(--warning)' : 'var(--destructive)' }} />
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-[10px] text-secondary-foreground">{member.total_tickets} tickets · {member.delivered} delivered</p>
                              <p className={`text-[10px] font-medium ${member.avg_variance > 0 ? 'text-destructive' : 'text-success'}`}>
                                avg {member.avg_variance > 0 ? '+' : ''}{member.avg_variance.toFixed(1)} pts
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </Card>

            {/* AI Coaching */}
            {(() => {
              const struggling = [...teamMembers]
                .filter(m => m.accuracy_pct < targetAccuracy)
                .sort((a, b) => a.accuracy_pct - b.accuracy_pct)
                .slice(0, 2);
              if (struggling.length === 0) return null;
              return (
                <Card className="!p-5 !bg-gradient-to-br !from-card !to-primary/5 !border-primary/15">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">AI Coaching Recommendations</h3>
                      {struggling.map(m => (
                        <p key={m.assignee_id} className="text-xs text-muted-foreground leading-relaxed">
                          <strong className="text-foreground">{m.assignee_name || m.assignee_id}</strong> is at {Math.round(m.accuracy_pct)}% accuracy
                          with avg variance of {m.avg_variance > 0 ? '+' : ''}{m.avg_variance.toFixed(1)} pts.
                          {m.avg_variance > 1 ? ' Consider adding a complexity buffer for their estimates.' : ' Pair estimations may help improve accuracy.'}
                        </p>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })()}
          </div>
        )}

        {/* ================================================================ */}
        {/*  MODULES TAB                                                     */}
        {/* ================================================================ */}
        {viewMode === 'modules' && (
          <div className="space-y-6">
            {modules.length === 0 ? (
              <Card className="!p-6">
                <p className="text-sm text-muted-foreground py-8 text-center">No module accuracy data available yet.</p>
              </Card>
            ) : (
              <>
                {/* Module Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[...modules].sort((a, b) => b.accuracy_pct - a.accuracy_pct).map((mod) => {
                    const acc = Math.round(mod.accuracy_pct);
                    const color = acc >= 80 ? 'var(--success)' : acc >= 60 ? 'var(--warning)' : 'var(--destructive)';
                    return (
                      <div key={mod.label} className="bento-card rounded-2xl border border-border/50 bg-card overflow-hidden transition-all group" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        <div className="h-1" style={{ background: color }} />
                        <div className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-mono font-semibold text-foreground bg-secondary px-2.5 py-1 rounded-md border border-border">{mod.label}</span>
                            <span className="text-2xl font-bold tabular-nums" style={{ color, fontFamily: 'var(--font-serif, Georgia, serif)' }}>
                              {acc}%
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${acc}%`, backgroundColor: color }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <span className="w-4 h-4 rounded bg-secondary flex items-center justify-center text-[9px] font-bold text-foreground">{mod.ticket_count}</span>
                              tickets
                            </span>
                            <span className={`font-medium ${mod.avg_variance > 0 ? 'text-destructive' : 'text-success'}`}>
                              {mod.avg_variance > 0 ? '+' : ''}{mod.avg_variance.toFixed(1)} pts avg
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Module insight — derived from worst modules */}
                {(() => {
                  const risky = [...modules]
                    .filter(m => m.accuracy_pct < targetAccuracy)
                    .sort((a, b) => a.accuracy_pct - b.accuracy_pct)
                    .slice(0, 2);
                  if (risky.length === 0) return null;
                  return (
                    <Card className="!p-5 !bg-gradient-to-br !from-card !to-warning/5 !border-warning/15">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-warning/10 border border-warning/15 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-5 h-5 text-warning" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold text-foreground">Module Risk Alert</h3>
                          {risky.map(m => (
                            <p key={m.label} className="text-xs text-muted-foreground leading-relaxed">
                              <strong className="text-foreground">{m.label}</strong> has {Math.round(m.accuracy_pct)}% accuracy
                              with an average variance of {m.avg_variance > 0 ? '+' : ''}{m.avg_variance.toFixed(1)} pts across {m.ticket_count} ticket{m.ticket_count !== 1 ? 's' : ''}.
                              {m.avg_variance > 2 ? ' Consider adding a complexity buffer for this area.' : ' Recommend breaking larger stories into smaller sub-tasks.'}
                            </p>
                          ))}
                        </div>
                      </div>
                    </Card>
                  );
                })()}
              </>
            )}
          </div>
        )}
      </div>
    </Reveal>
  );
}
