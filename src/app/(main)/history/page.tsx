'use client';

import { useState, useMemo } from 'react';
import {
  Calendar,
  Target,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowRight,
  Loader2,
  ChevronRight,
  Layers,
  Users,
  Zap,
  Brain,
  Sparkles,
  AlertTriangle,
  Repeat,
  Fingerprint,
  Search,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { Card, Badge, EmptyState } from '@/components/ui';
import { HistoryIllustration } from '@/components/EmptyIllustrations';
import { Reveal } from '@/components/Reveal';
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import { type AccuracyHistoryEntry } from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { useSprints, useAccuracyHistory } from '@/lib/queries';
import { useQueryClient } from '@tanstack/react-query';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SprintRow {
  id: string;
  index: number;
  label: string;
  dateRange: string;
  stories: number;
  accuracy: number;
  status: 'in-progress' | 'completed';
  pointsCommitted: number;
  pointsDelivered: number;
  highlights: string[];
  velocity: number;
  carryOver: number;
  scopeCreep: number;
  tags: string[];
}

interface SimilarityMatch {
  sprintAId: string;
  sprintBId: string;
  similarity: number;
  commonPatterns: string[];
  keyDifference: string;
}

interface RepeatPattern {
  pattern: string;
  frequency: string;
  impact: string;
  type: 'success' | 'warning' | 'info';
}

/* ------------------------------------------------------------------ */
/*  Derived analytics helpers                                          */
/* ------------------------------------------------------------------ */

function computeSimilarity(a: SprintRow, b: SprintRow): number {
  const accDiff = Math.abs(a.accuracy - b.accuracy);
  const deliveryA = a.pointsCommitted > 0 ? a.pointsDelivered / a.pointsCommitted : 0;
  const deliveryB = b.pointsCommitted > 0 ? b.pointsDelivered / b.pointsCommitted : 0;
  const deliveryDiff = Math.abs(deliveryA - deliveryB);
  const carryDiff = Math.abs(a.carryOver - b.carryOver);
  const scopeDiff = Math.abs(a.scopeCreep - b.scopeCreep);

  const score = 100
    - accDiff * 1.2
    - deliveryDiff * 30
    - carryDiff * 4
    - scopeDiff * 3;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildSimilarityMatches(sprints: SprintRow[]): SimilarityMatch[] {
  if (sprints.length < 2) return [];
  const pairs: { a: SprintRow; b: SprintRow; sim: number }[] = [];
  for (let i = 0; i < sprints.length; i++) {
    for (let j = i + 1; j < sprints.length; j++) {
      pairs.push({ a: sprints[i], b: sprints[j], sim: computeSimilarity(sprints[i], sprints[j]) });
    }
  }
  pairs.sort((x, y) => y.sim - x.sim);

  return pairs.slice(0, 3).map(({ a, b, sim }) => {
    const patterns: string[] = [];
    if (a.carryOver === 0 && b.carryOver === 0) patterns.push('Zero carry-over');
    if (a.carryOver > 0 && b.carryOver > 0) patterns.push('Carry-over present');
    if (a.scopeCreep === 0 && b.scopeCreep === 0) patterns.push('Clean scope');
    if (a.scopeCreep > 0 && b.scopeCreep > 0) patterns.push('Scope creep present');
    if (a.accuracy >= 90 && b.accuracy >= 90) patterns.push('High accuracy (>90%)');
    if (a.accuracy < 80 && b.accuracy < 80) patterns.push('Below-target accuracy');
    const ratioA = a.pointsCommitted > 0 ? a.pointsDelivered / a.pointsCommitted : 0;
    const ratioB = b.pointsCommitted > 0 ? b.pointsDelivered / b.pointsCommitted : 0;
    if (Math.abs(ratioA - ratioB) < 0.1) patterns.push('Similar delivery rate');
    if (patterns.length === 0) patterns.push('Comparable sprint composition');

    const diffs: string[] = [];
    if (a.accuracy !== b.accuracy) diffs.push(`${a.label} had ${a.accuracy > b.accuracy ? 'higher' : 'lower'} accuracy (${a.accuracy}% vs ${b.accuracy}%)`);
    if (a.pointsDelivered !== b.pointsDelivered) diffs.push(`${a.label} delivered ${a.pointsDelivered > b.pointsDelivered ? 'more' : 'fewer'} points`);

    return {
      sprintAId: a.id,
      sprintBId: b.id,
      similarity: sim,
      commonPatterns: patterns.slice(0, 4),
      keyDifference: diffs[0] ?? 'Similar overall profile.',
    };
  });
}

function buildRepeatPatterns(sprints: SprintRow[]): RepeatPattern[] {
  if (sprints.length < 2) return [];
  const n = sprints.length;
  const patterns: RepeatPattern[] = [];

  const cleanSprints = sprints.filter(s => s.scopeCreep === 0 && s.carryOver === 0);
  if (cleanSprints.length >= 2) {
    const cleanAvg = Math.round(cleanSprints.reduce((s, sp) => s + sp.accuracy, 0) / cleanSprints.length);
    const messySprints = sprints.filter(s => s.scopeCreep > 0 || s.carryOver > 0);
    const messyAvg = messySprints.length > 0 ? Math.round(messySprints.reduce((s, sp) => s + sp.accuracy, 0) / messySprints.length) : 0;
    patterns.push({
      pattern: 'Clean sprints (no scope creep, no carry-over) yield higher accuracy',
      frequency: `${cleanSprints.length} of ${n} sprints`,
      impact: messyAvg > 0 ? `Avg accuracy ${messyAvg}% → ${cleanAvg}%` : `Avg accuracy ${cleanAvg}%`,
      type: 'success',
    });
  }

  const carryOverSprints = sprints.filter(s => s.carryOver > 0);
  if (carryOverSprints.length >= 2) {
    const avgCarry = Math.round(carryOverSprints.reduce((s, sp) => s + sp.carryOver, 0) / carryOverSprints.length * 10) / 10;
    patterns.push({
      pattern: 'Recurring carry-over tickets indicate over-commitment',
      frequency: `${carryOverSprints.length} of ${n} sprints`,
      impact: `Avg ${avgCarry} tickets carried over per affected sprint`,
      type: 'warning',
    });
  }

  const highAccSprints = sprints.filter(s => s.accuracy >= 90);
  if (highAccSprints.length >= 2) {
    const avgCommitted = Math.round(highAccSprints.reduce((s, sp) => s + sp.pointsCommitted, 0) / highAccSprints.length);
    patterns.push({
      pattern: 'High-accuracy sprints share a commitment sweet spot',
      frequency: `${highAccSprints.length} of ${n} sprints at ≥90%`,
      impact: `Avg commitment of ${avgCommitted} pts in top sprints`,
      type: 'info',
    });
  }

  const lowAccSprints = sprints.filter(s => s.accuracy < 80);
  if (lowAccSprints.length >= 1) {
    const avgScope = Math.round(lowAccSprints.reduce((s, sp) => s + sp.scopeCreep, 0) / lowAccSprints.length * 10) / 10;
    patterns.push({
      pattern: 'Below-target sprints often have scope creep',
      frequency: `${lowAccSprints.length} of ${n} sprints below 80%`,
      impact: avgScope > 0 ? `Avg +${avgScope} pts scope creep in low-accuracy sprints` : 'Scope management is critical',
      type: 'warning',
    });
  }

  return patterns.slice(0, 4);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function accuracyColor(accuracy: number) {
  if (accuracy >= 90) return 'text-success';
  if (accuracy >= 80) return 'text-primary';
  return 'text-warning';
}

function accuracyBg(accuracy: number) {
  if (accuracy >= 90) return 'bg-success';
  if (accuracy >= 80) return 'bg-primary';
  return 'bg-warning';
}

function formatDateRange(start?: string, end?: string): string {
  if (!start || !end) return '';
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

function deriveTags(sp: { accuracy: number; carryOver: number; scopeCreep: number; status: string }): string[] {
  const tags: string[] = [];
  if (sp.accuracy >= 90) tags.push('high-accuracy');
  if (sp.accuracy < 80) tags.push('below-target');
  if (sp.carryOver === 0 && sp.scopeCreep === 0) tags.push('clean-sprint');
  if (sp.carryOver > 2) tags.push('carry-over');
  if (sp.scopeCreep > 0) tags.push('scope-creep');
  if (sp.status === 'in-progress') tags.push('active');
  return tags;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SprintHistoryPage() {
  const { activeProjectId, activeProject } = useProject();
  const queryClient = useQueryClient();
  const [expandedSprint, setExpandedSprint] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'timeline' | 'similarity' | 'patterns'>('timeline');

  const sprintsQuery = useSprints(activeProjectId);
  const accuracyQuery = useAccuracyHistory(activeProjectId);
  const loading = sprintsQuery.isLoading || accuracyQuery.isLoading;

  const sprints = useMemo(() => {
    const raw = sprintsQuery.data;
    const apiSprints = Array.isArray(raw) ? raw : [];
    const accuracyData = accuracyQuery.data;
    if (apiSprints.length === 0) return [];

    const accMap = new Map<string, AccuracyHistoryEntry>();
    accuracyData?.entries?.forEach(e => accMap.set(e.sprint_id, e));

    const sorted = [...apiSprints].sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (b.status === 'active' && a.status !== 'active') return 1;
      const da = a.start_date ? new Date(a.start_date).getTime() : 0;
      const db = b.start_date ? new Date(b.start_date).getTime() : 0;
      return db - da;
    });

    return sorted.map((s, i) => {
      const acc = accMap.get(s.id);
      const planned = s.planned_points ?? acc?.planned_points ?? 0;
      const actual = s.actual_points ?? acc?.actual_points ?? 0;
      const accuracy = s.accuracy_pct ?? acc?.accuracy_pct ?? (planned > 0 ? Math.round((actual / planned) * 100) : 0);
      const carryOver = acc?.carried_over ?? 0;

      const row: SprintRow = {
        id: s.id,
        index: i + 1,
        label: s.name,
        dateRange: formatDateRange(s.start_date, s.end_date),
        stories: acc?.ticket_count ?? 0,
        accuracy,
        status: s.status === 'active' ? 'in-progress' : 'completed',
        pointsCommitted: planned,
        pointsDelivered: actual,
        highlights: [
          ...(s.ai_notes ? [s.ai_notes] : []),
          ...(accuracy >= 90 ? ['High accuracy sprint'] : []),
          ...(carryOver === 0 && planned > 0 ? ['Zero carry-over'] : []),
          ...(carryOver > 2 ? [`${carryOver} tickets carried over`] : []),
        ].slice(0, 3),
        velocity: planned > 0 ? Math.round((actual / planned) * 100) / 100 : 0,
        carryOver,
        scopeCreep: 0,
        tags: [],
      };
      row.tags = deriveTags(row);
      return row;
    });
  }, [sprintsQuery.data, accuracyQuery.data]);

  const avgAccuracy = sprints.length > 0 ? Math.round(sprints.reduce((s, sp) => s + sp.accuracy, 0) / sprints.length) : 0;
  const totalDelivered = sprints.reduce((s, sp) => s + sp.pointsDelivered, 0);
  const totalCommitted = sprints.reduce((s, sp) => s + sp.pointsCommitted, 0);
  const bestSprint = sprints.length > 0 ? sprints.reduce((best, sp) => sp.accuracy > best.accuracy ? sp : best, sprints[0]) : null;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['sprints', activeProjectId] });
    queryClient.invalidateQueries({ queryKey: ['accuracy', 'history', activeProjectId] });
  };

  const defaultExpanded = sprints.length > 0 && expandedSprint === null ? sprints[0].id : expandedSprint;

  const similarityMatches = useMemo(() => buildSimilarityMatches(sprints), [sprints]);
  const repeatPatterns = useMemo(() => buildRepeatPatterns(sprints), [sprints]);

  const filteredSprints = sprints.filter((sp) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      sp.label.toLowerCase().includes(q) ||
      sp.tags.some(t => t.includes(q)) ||
      sp.highlights.some(h => h.toLowerCase().includes(q))
    );
  });

  const tabs = [
    { id: 'timeline' as const, label: 'Timeline', icon: Calendar },
    { id: 'similarity' as const, label: 'Similarity', icon: Fingerprint },
    { id: 'patterns' as const, label: 'Patterns', icon: Repeat },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!loading && sprints.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No sprint history yet"
        description="Sprint history will appear here after your team completes sprints. Start your first sprint to begin building a performance timeline."
        actionLabel="Plan Sprint"
        illustration={<HistoryIllustration className="w-[220px] h-[176px]" />}
      />
    );
  }

  return (
    <Reveal>
      <div className="space-y-6">
        {/* ---- Header ---- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>Sprint History</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{activeProject?.name ?? 'Project'} · {sprints.length} sprint{sprints.length !== 1 ? 's' : ''} tracked</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-card border border-border text-sm text-secondary-foreground font-medium">
              Avg accuracy: <span className="text-primary font-bold">{avgAccuracy}%</span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={sprintsQuery.isFetching}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-sm text-secondary-foreground hover:text-foreground hover:border-primary/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${sprintsQuery.isFetching ? 'animate-spin' : ''}`} />
              {sprintsQuery.isFetching ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* ---- Tab Switcher ---- */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary border border-border/60 w-fit">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    viewMode === tab.id
                      ? 'bg-card text-foreground shadow-sm border border-border/60'
                      : 'text-muted-foreground hover:text-secondary-foreground'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-foreground" />
            <input
              type="text"
              placeholder="Search sprints, tags, modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-card border border-border text-foreground placeholder-secondary-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
            />
          </div>
        </div>

        {/* ================================================================ */}
        {/*  TIMELINE TAB                                                    */}
        {/* ================================================================ */}
        {viewMode === 'timeline' && (
          <div className="space-y-6">
            {/* Accuracy Trend Chart */}
            <Card className="bento-card rounded-2xl !p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Accuracy Trend</h2>
                </div>
                {sprints.length >= 2 && (() => {
                  const diff = sprints[0].accuracy - sprints[sprints.length - 1].accuracy;
                  const isUp = diff >= 0;
                  const Icon = isUp ? TrendingUp : TrendingDown;
                  return (
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${isUp ? 'text-success' : 'text-warning'}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {isUp ? '+' : ''}{diff}% progression
                    </div>
                  );
                })()}
              </div>
              {(() => {
                const trendData = [...sprints].reverse().map((d) => ({
                  label: d.label.replace(/^Sprint\s*/i, 'S'),
                  accuracy: d.accuracy,
                }));
                const trendConfig: ChartConfig = {
                  accuracy: { label: 'Accuracy', color: 'var(--primary)' },
                };
                return (
                  <ChartContainer config={trendConfig} className="h-36 w-full">
                    <AreaChart data={trendData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="hist-area-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.22} />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="hist-stroke-grad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="var(--warning)" />
                          <stop offset="40%" stopColor="var(--primary)" />
                          <stop offset="100%" stopColor="var(--success)" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 8" stroke="var(--border)" horizontal vertical={false} />
                      <ReferenceLine y={90} stroke="var(--success)" strokeDasharray="3 6" strokeOpacity={0.3} />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickMargin={6} />
                      <YAxis domain={[50, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => `${v}%`} width={36} />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0]?.payload;
                          const colorClass = d.accuracy >= 90 ? 'text-success' : d.accuracy >= 80 ? 'text-primary' : 'text-warning';
                          return (
                            <div className="rounded-xl border border-border/60 bg-card px-3 py-2 shadow-lg">
                              <p className="text-xs text-muted-foreground">Sprint {d.label}</p>
                              <p className={`text-sm font-bold ${colorClass}`}>{d.accuracy}% accuracy</p>
                            </div>
                          );
                        }}
                        cursor={{ stroke: 'var(--muted-foreground)', strokeOpacity: 0.3, strokeDasharray: '3 3' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="accuracy"
                        stroke="url(#hist-stroke-grad)"
                        strokeWidth={2.5}
                        fill="url(#hist-area-grad)"
                        dot={(props) => {
                          const { cx, cy, index } = props;
                          if (cx == null || cy == null) return <g key={`hd-${index}`} />;
                          const d = trendData[index];
                          const color = d.accuracy >= 90 ? 'var(--success)' : d.accuracy >= 80 ? 'var(--primary)' : 'var(--warning)';
                          const isLast = index === trendData.length - 1;
                          return (
                            <g key={`hd-${index}`}>
                              {isLast && (
                                <circle cx={cx} cy={cy} r={10} fill={color} opacity={0.1}>
                                  <animate attributeName="r" values="8;14;8" dur="2.5s" repeatCount="indefinite" />
                                  <animate attributeName="opacity" values="0.12;0.03;0.12" dur="2.5s" repeatCount="indefinite" />
                                </circle>
                              )}
                              <circle cx={cx} cy={cy} r={isLast ? 5 : 3.5} fill="white" stroke={color} strokeWidth={isLast ? 2.5 : 2} />
                            </g>
                          );
                        }}
                        activeDot={{ r: 5, fill: 'var(--primary)', stroke: 'white', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ChartContainer>
                );
              })()}
            </Card>

            {/* Sprint Timeline Cards */}
            <div className="space-y-0">
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Sprint Timeline
              </h2>
              <div className="relative">
                <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary via-primary/40 to-border/60" />
                <div className="space-y-4">
                  {filteredSprints.map((sprint) => {
                    const isExpanded = defaultExpanded === sprint.id;
                    const isCurrent = sprint.status === 'in-progress';

                    return (
                      <div key={sprint.id} className="relative pl-12">
                        {/* Timeline node */}
                        <div className="absolute left-0 top-4">
                          {isCurrent && (
                            <div className="absolute inset-0 w-10 h-10 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
                          )}
                          <div className={`relative w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-sm transition-transform hover:scale-110 ${
                            isCurrent
                              ? 'bg-gradient-to-br from-primary/15 to-primary/10 border-primary'
                              : sprint.accuracy >= 90
                              ? 'bg-gradient-to-br from-success/10 to-success/5 border-success/40'
                              : sprint.accuracy >= 80
                              ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/40'
                              : 'bg-gradient-to-br from-warning/10 to-warning/5 border-warning/40'
                          }`}>
                            {isCurrent ? (
                              <Loader2 className="w-5 h-5 text-primary animate-spin" />
                            ) : (
                              <CheckCircle2 className={`w-5 h-5 ${accuracyColor(sprint.accuracy)}`} />
                            )}
                          </div>
                        </div>

                        {/* Sprint card */}
                        <button onClick={() => setExpandedSprint(isExpanded ? null : sprint.id)} className="w-full text-left">
                          <Card className={`bento-card rounded-2xl ${isCurrent ? '!border-primary/30' : ''}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-foreground">{sprint.label}</h3>
                                    {isCurrent && <Badge variant="accent">Current</Badge>}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{sprint.dateRange}</span>
                                    <span>{sprint.stories} stories</span>
                                  </div>
                                  {/* Tags */}
                                  <div className="flex items-center gap-1.5 mt-2">
                                    {sprint.tags.map(tag => (
                                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/60">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className={`text-xl font-bold tabular-nums ${accuracyColor(sprint.accuracy)}`} style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}>
                                    {sprint.accuracy}%
                                  </div>
                                  <div className="text-[10px] text-secondary-foreground uppercase tracking-wider font-medium">accuracy</div>
                                </div>
                                <ChevronRight className={`w-5 h-5 text-secondary-foreground transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                              </div>
                            </div>

                            {/* Expanded */}
                            {isExpanded && (
                              <div className="border-t border-border/60 mt-4 pt-4 space-y-4">
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                  {[
                                    { label: 'Committed', value: `${sprint.pointsCommitted} pts`, color: 'text-foreground' },
                                    { label: 'Delivered', value: `${sprint.pointsDelivered} pts`, color: 'text-success' },
                                    { label: 'Delivery Rate', value: sprint.pointsCommitted > 0 ? `${Math.round((sprint.pointsDelivered / sprint.pointsCommitted) * 100)}%` : '–', color: 'text-primary' },
                                    { label: 'Carry-over', value: `${sprint.carryOver}`, color: sprint.carryOver > 0 ? 'text-warning' : 'text-success' },
                                    { label: 'Stories', value: `${sprint.stories}`, color: 'text-foreground' },
                                  ].map((stat) => (
                                    <div key={stat.label} className="rounded-lg bg-secondary border border-border/40 p-3 text-center">
                                      <p className="text-[10px] text-secondary-foreground uppercase tracking-wider mb-1">{stat.label}</p>
                                      <p className={`text-lg font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
                                    </div>
                                  ))}
                                </div>

                                {/* Delivery bar */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Delivery rate</span>
                                    <span className="text-foreground font-medium tabular-nums">
                                      {sprint.pointsDelivered}/{sprint.pointsCommitted} pts ({Math.round((sprint.pointsDelivered / sprint.pointsCommitted) * 100)}%)
                                    </span>
                                  </div>
                                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${accuracyBg(sprint.accuracy)}`} style={{ width: `${(sprint.pointsDelivered / sprint.pointsCommitted) * 100}%` }} />
                                  </div>
                                </div>

                                {/* Highlights */}
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-secondary-foreground uppercase tracking-wider">Highlights</p>
                                  {sprint.highlights.map((h, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                      <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                                      <span className="text-secondary-foreground">{h}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </Card>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bento-card rounded-2xl border border-border/50 bg-card overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div className="h-1 bg-gradient-to-r from-primary to-primary/80" />
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Target className="w-3.5 h-3.5" />
                    Total Delivered
                  </div>
                  <p className="text-3xl font-bold text-foreground tabular-nums" style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}>{totalDelivered}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80" style={{ width: `${(totalDelivered / totalCommitted) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">{Math.round((totalDelivered / totalCommitted) * 100)}%</span>
                  </div>
                </div>
              </div>
              <div className="bento-card rounded-2xl border border-border/50 bg-card overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div className="h-1 bg-gradient-to-r from-success to-success/80" />
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Best Sprint
                  </div>
                  <p className="text-3xl font-bold text-success" style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}>{bestSprint?.label ?? '–'}</p>
                  <p className="text-xs text-muted-foreground">{bestSprint ? `${bestSprint.accuracy}% accuracy` : 'No data'}</p>
                </div>
              </div>
              <div className="bento-card rounded-2xl border border-border/50 bg-card overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div className="h-1 bg-gradient-to-r from-primary to-primary/80" />
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Users className="w-3.5 h-3.5" />
                    Total Stories
                  </div>
                  <p className="text-3xl font-bold text-primary tabular-nums" style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}>{sprints.reduce((s, sp) => s + sp.stories, 0)}</p>
                  <p className="text-xs text-muted-foreground">Across {sprints.length} sprints</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/*  SIMILARITY TAB                                                  */}
        {/* ================================================================ */}
        {viewMode === 'similarity' && (
          <div className="space-y-6">
            <Card className="bento-card rounded-2xl !p-5 !bg-gradient-to-br !from-card !to-primary/5 !border-primary/15">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Sprint Similarity Detection</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    ATLAS AI analyzes sprint composition, team patterns, scope changes, and module focus to detect
                    when sprints share similar characteristics — helping you predict outcomes based on historical data.
                  </p>
                </div>
              </div>
            </Card>

            {/* Similarity Matches */}
            <div className="space-y-4">
              {similarityMatches.length === 0 && (
                <Card className="!p-8 text-center">
                  <p className="text-sm text-muted-foreground">Need at least 2 completed sprints to detect similarities.</p>
                </Card>
              )}
              {similarityMatches.map((match, i) => {
                const spA = sprints.find(s => s.id === match.sprintAId);
                const spB = sprints.find(s => s.id === match.sprintBId);
                if (!spA || !spB) return null;
                return (
                  <Card key={i}>
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{spA.label}</span>
                            <span className={`text-xs font-bold ${accuracyColor(spA.accuracy)}`}>{spA.accuracy}%</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/15">
                            <Copy className="w-3 h-3 text-primary" />
                            <span className="text-xs font-bold text-primary">{match.similarity}% similar</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{spB.label}</span>
                            <span className={`text-xs font-bold ${accuracyColor(spB.accuracy)}`}>{spB.accuracy}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Common Patterns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-semibold text-secondary-foreground uppercase tracking-wider mb-2">Common Patterns</p>
                          <div className="space-y-1.5">
                            {match.commonPatterns.map((p, j) => (
                              <div key={j} className="flex items-center gap-2 text-xs">
                                <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                                <span className="text-secondary-foreground">{p}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-secondary-foreground uppercase tracking-wider mb-2">Key Difference</p>
                          <p className="text-xs text-secondary-foreground leading-relaxed">{match.keyDifference}</p>
                        </div>
                      </div>

                      {/* Side-by-side stats */}
                      <div className="grid grid-cols-3 gap-3">
                        {(['pointsCommitted', 'pointsDelivered', 'carryOver'] as const).map((key) => {
                          const labels: Record<string, string> = { pointsCommitted: 'Committed', pointsDelivered: 'Delivered', carryOver: 'Carry-over' };
                          return (
                            <div key={key} className="rounded-lg bg-secondary border border-border/40 p-2 text-center">
                              <p className="text-[9px] text-secondary-foreground uppercase tracking-wider">{labels[key]}</p>
                              <div className="flex items-center justify-center gap-2 mt-1">
                                <span className="text-xs font-bold text-primary">{spA.label}: {spA[key]}</span>
                                <span className="text-border">|</span>
                                <span className="text-xs font-bold text-muted-foreground">{spB.label}: {spB[key]}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/*  PATTERNS TAB                                                    */}
        {/* ================================================================ */}
        {viewMode === 'patterns' && (
          <div className="space-y-6">
            <Card className="bento-card rounded-2xl !p-5 !bg-gradient-to-br !from-card !to-primary/5 !border-primary/15">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Recurring Patterns Detected</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    ATLAS identified these recurring patterns across your sprint history.
                    Use these insights to proactively plan and avoid repeating past mistakes.
                  </p>
                </div>
              </div>
            </Card>

            {repeatPatterns.length === 0 && (
              <Card className="!p-8 text-center">
                <p className="text-sm text-muted-foreground">Need more sprint history to detect recurring patterns.</p>
              </Card>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {repeatPatterns.map((pattern, i) => (
                <Card key={i} className={
                  pattern.type === 'success' ? '!border-success/15' :
                  pattern.type === 'warning' ? '!border-warning/15' :
                  '!border-primary/15'
                }>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      {pattern.type === 'success' && <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />}
                      {pattern.type === 'warning' && <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />}
                      {pattern.type === 'info' && <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />}
                      <h4 className="text-sm font-semibold text-foreground">{pattern.pattern}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-secondary border border-border/40 p-2">
                        <p className="text-[9px] text-secondary-foreground uppercase tracking-wider">Frequency</p>
                        <p className="text-xs font-bold text-foreground mt-0.5">{pattern.frequency}</p>
                      </div>
                      <div className="rounded-lg bg-secondary border border-border/40 p-2">
                        <p className="text-[9px] text-secondary-foreground uppercase tracking-wider">Impact</p>
                        <p className="text-xs font-bold text-foreground mt-0.5">{pattern.impact}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* AI Recommendation */}
            {sprints.length >= 2 && (
              <Card className="!p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">ATLAS Recommendations for Next Sprint</h3>
                    <div className="space-y-2">
                      {(() => {
                        const recs: string[] = [];
                        if (bestSprint && bestSprint.pointsCommitted > 0)
                          recs.push(`Target ~${bestSprint.pointsCommitted} pts commitment — your best sprint delivered ${bestSprint.accuracy}% accuracy at this level`);
                        const cleanCount = sprints.filter(s => s.carryOver === 0).length;
                        if (cleanCount > 0)
                          recs.push(`Aim for zero carry-over — ${cleanCount} of ${sprints.length} clean sprints averaged higher accuracy`);
                        if (avgAccuracy > 0)
                          recs.push(`Current avg accuracy is ${avgAccuracy}% — focus on estimation calibration to push toward 90%+`);
                        if (totalDelivered > 0 && totalCommitted > 0)
                          recs.push(`Overall delivery rate: ${Math.round((totalDelivered / totalCommitted) * 100)}% — ${totalCommitted > totalDelivered ? 'consider reducing scope' : 'strong execution'}`);
                        return recs.slice(0, 4).map((rec, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-secondary-foreground">
                            <Zap className="w-3 h-3 text-primary shrink-0" />
                            {rec}
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </Reveal>
  );
}
