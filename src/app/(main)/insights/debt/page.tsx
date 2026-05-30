'use client';

import { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Zap,
  Calculator,
  Target,
  Shield,
  AlertTriangle,
  Clock,
  FileCode,
  Layers,
  CheckCircle2,
  XCircle,
  Wrench,
  Calendar,
  Activity,
  BarChart3,
} from 'lucide-react';
import { Card, Badge, Button, ExternalLink, EmptyState } from '@/components/ui';
import { Reveal } from '@/components/Reveal';
import * as atlas from '@/lib/api';
import { useProject } from '@/lib/project-context';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const debtScore = 68; // out of 100 (lower = more debt)

const debtByCategory = [
  { category: 'Architecture', score: 42, items: 8, color: 'var(--destructive)', icon: Layers },
  { category: 'Code Quality', score: 55, items: 12, color: 'var(--primary)', icon: FileCode },
  { category: 'Testing', score: 61, items: 6, color: 'var(--warning)', icon: CheckCircle2 },
  { category: 'Documentation', score: 78, items: 4, color: 'var(--success)', icon: Calendar },
  { category: 'Dependencies', score: 72, items: 5, color: 'var(--primary)', icon: Activity },
];

const debtTimeline = [
  { sprint: 'Sprint 21', score: 74, added: 8, retired: 3 },
  { sprint: 'Sprint 22', score: 71, added: 6, retired: 2 },
  { sprint: 'Sprint 23', score: 69, added: 7, retired: 4 },
  { sprint: 'Sprint 24', score: 68, added: 5, retired: 3 },
];

const debtItems = [
  { id: 'DEBT-001', title: 'Legacy Stripe v1 callback patterns in payments/', severity: 'critical' as const, category: 'Architecture', age: '142 days', fixTime: '40 pts', module: 'payments/', impact: '2.8x slowdown' },
  { id: 'DEBT-002', title: 'Auth token refresh race condition', severity: 'high' as const, category: 'Code Quality', age: '98 days', fixTime: '15 pts', module: 'auth/', impact: '1.4x slowdown' },
  { id: 'DEBT-003', title: 'No centralized API rate limiting', severity: 'high' as const, category: 'Architecture', age: '67 days', fixTime: '20 pts', module: 'api/', impact: '1.2x slowdown' },
  { id: 'DEBT-004', title: 'Missing integration tests for webhook handlers', severity: 'high' as const, category: 'Testing', age: '54 days', fixTime: '10 pts', module: 'api/', impact: 'Reliability risk' },
  { id: 'DEBT-005', title: 'Circular dependency between payments/ and billing/', severity: 'medium' as const, category: 'Architecture', age: '89 days', fixTime: '25 pts', module: 'payments/', impact: 'Build complexity' },
  { id: 'DEBT-006', title: 'Outdated Elasticsearch client library (v6 -> v8)', severity: 'medium' as const, category: 'Dependencies', age: '112 days', fixTime: '8 pts', module: 'api/', impact: 'Security risk' },
  { id: 'DEBT-007', title: 'Inconsistent error handling across middleware layers', severity: 'medium' as const, category: 'Code Quality', age: '45 days', fixTime: '12 pts', module: 'auth/', impact: 'Debug difficulty' },
  { id: 'DEBT-008', title: 'No API documentation for v2 endpoints', severity: 'low' as const, category: 'Documentation', age: '34 days', fixTime: '5 pts', module: 'api/', impact: 'Onboarding cost' },
  { id: 'DEBT-009', title: 'Dashboard chart rendering performance regression', severity: 'low' as const, category: 'Code Quality', age: '21 days', fixTime: '8 pts', module: 'dashboard/', impact: 'User experience' },
  { id: 'DEBT-010', title: 'Deprecated Node.js crypto API usage', severity: 'low' as const, category: 'Dependencies', age: '78 days', fixTime: '3 pts', module: 'auth/', impact: 'Future breakage' },
];

const retirementPlan = [
  { phase: 'Phase 1 - Sprint 25', title: 'Extract payment service layer', items: ['DEBT-001', 'DEBT-005'], effort: '40 pts', impact: 'Reduce payments/ debt by 60%', priority: 'critical' as const },
  { phase: 'Phase 2 - Sprint 26', title: 'Auth gateway consolidation', items: ['DEBT-002', 'DEBT-007'], effort: '25 pts', impact: 'Eliminate race conditions', priority: 'high' as const },
  { phase: 'Phase 3 - Sprint 27', title: 'API middleware overhaul', items: ['DEBT-003', 'DEBT-004'], effort: '30 pts', impact: 'Centralized rate limiting + tests', priority: 'high' as const },
  { phase: 'Phase 4 - Sprint 28', title: 'Dependency updates + docs', items: ['DEBT-006', 'DEBT-008', 'DEBT-010'], effort: '16 pts', impact: 'Security + onboarding', priority: 'medium' as const },
];

const debtModules = [
  { module: 'payments/', severity: 'critical' as const, slowdown: '2.8x', tickets: [{ id: 'COMP-217', href: '#' }, { id: 'COMP-230', href: '#' }], description: 'Legacy Stripe v1 integration with deeply nested callback patterns.', items: 3 },
  { module: 'auth/', severity: 'high' as const, slowdown: '1.4x', tickets: [{ id: 'COMP-218', href: '#' }], description: 'Token refresh race conditions and inconsistent error handling.', items: 2 },
  { module: 'api/', severity: 'medium' as const, slowdown: '1.2x', tickets: [{ id: 'COMP-223', href: '#' }, { id: 'COMP-225', href: '#' }], description: 'Ad-hoc rate limiting. Missing retry logic for webhooks.', items: 3 },
  { module: 'dashboard/', severity: 'low' as const, slowdown: '1.0x', tickets: [{ id: 'COMP-220', href: '#' }], description: 'Chart rendering regression. Otherwise clean.', items: 1 },
  { module: 'notifications/', severity: 'low' as const, slowdown: '1.0x', tickets: [{ id: 'COMP-221', href: '#' }], description: 'Well-maintained. Minor template issues.', items: 0 },
];

const severityConfig = {
  critical: { badge: 'danger' as const, color: 'text-destructive', bg: 'bg-destructive/15 border-destructive/20', barColor: 'var(--destructive)' },
  high: { badge: 'danger' as const, color: 'text-warning', bg: 'bg-warning/15 border-warning/20', barColor: 'var(--primary)' },
  medium: { badge: 'warning' as const, color: 'text-warning', bg: 'bg-warning/15 border-warning/20', barColor: 'var(--warning)' },
  low: { badge: 'success' as const, color: 'text-success', bg: 'bg-success/15 border-success/20', barColor: 'var(--success)' },
};

const roiData = {
  module: 'payments/',
  costToRefactor: '~40 pts (1 sprint)',
  speedBefore: '2.8x',
  speedAfter: '1.2x',
  velocityRecovered: '~18 pts/sprint',
  breakEven: 'Sprint 3 after refactor',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TechDebtPage() {
  const { activeProjectId } = useProject();
  const [apiDebtOverview, setApiDebtOverview] = useState<atlas.DebtOverview | null>(null);
  const [apiDebtTrend, setApiDebtTrend] = useState<atlas.DebtTrend[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeProjectId) { setLoading(false); return; }
    Promise.all([
      atlas.getDebtOverview(activeProjectId).catch(() => null),
      atlas.getDebtTrend(activeProjectId).catch(() => null),
    ]).then(([overview, trend]) => {
      if (overview) setApiDebtOverview(overview);
      if (trend) setApiDebtTrend(trend);
    }).finally(() => setLoading(false));
  }, [activeProjectId]);

  const isEmpty = !loading && apiDebtOverview !== null && (apiDebtOverview.items?.length ?? 0) === 0;

  const activeDebtScore = apiDebtOverview?.total_score ?? debtScore;

  const displayDebtItems = apiDebtOverview?.items && apiDebtOverview.items.length > 0
    ? apiDebtOverview.items.map((item, i) => ({
        id: `DEBT-${String(i + 1).padStart(3, '0')}`,
        title: item.description,
        severity: (item.priority === 'critical' ? 'critical' : item.priority === 'high' ? 'high' : item.priority === 'medium' ? 'medium' : 'low') as 'critical' | 'high' | 'medium' | 'low',
        category: item.category,
        age: '',
        fixTime: `Score: ${item.score}`,
        module: '',
        impact: item.priority === 'critical' ? 'Critical impact' : item.priority === 'high' ? 'High impact' : 'Moderate impact',
      }))
    : debtItems;

  const displayDebtTimeline = apiDebtTrend && apiDebtTrend.length > 0
    ? apiDebtTrend.map((t, i, arr) => ({
        sprint: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: t.score,
        added: i > 0 && t.score < arr[i - 1].score ? Math.round(arr[i - 1].score - t.score) : 0,
        retired: i > 0 && t.score > arr[i - 1].score ? Math.round(t.score - arr[i - 1].score) : 0,
      }))
    : debtTimeline;

  return (
    <>
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isEmpty && (
        <EmptyState
          icon={Shield}
          title="No tech debt data yet"
          description="ATLAS analyzes your codebase to identify and track technical debt. Connect a repository and run your first sprint to see debt insights."
          actionLabel="Connect Repository"
        />
      )}

      {!loading && !isEmpty && (
      <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes barGrow {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gaugeAnim {
          from { stroke-dashoffset: 283; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes sparkline {
          from { width: 0; }
        }
      `}</style>

      <Reveal>
        <div className="space-y-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                Technical Debt Impact
                <Badge variant="danger">3 Critical</Badge>
              </h1>
              <div className="mt-2">
                <ExternalLink href="#">Signal from: PHANTOM (Tech Debt Radar)</ExternalLink>
              </div>
            </div>
            <Button variant="primary" size="lg">
              <Wrench className="w-4 h-4" />Create Refactor Epic in Jira
            </Button>
          </div>

          {/* Debt Score Gauge + Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Debt Score Gauge */}
            <Card className="flex flex-col items-center justify-center py-6">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">Overall Debt Health Score</p>
              <div className="relative w-48 h-28">
                <svg viewBox="0 0 200 110" className="w-full h-full">
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="var(--muted)" strokeWidth="14" strokeLinecap="round" />
                  {/* Color segments */}
                  <path d="M 20 100 A 80 80 0 0 1 60 35" fill="none" stroke="var(--destructive)" strokeWidth="14" strokeLinecap="round" opacity="0.3" />
                  <path d="M 60 35 A 80 80 0 0 1 100 20" fill="none" stroke="var(--warning)" strokeWidth="14" strokeLinecap="round" opacity="0.3" />
                  <path d="M 100 20 A 80 80 0 0 1 140 35" fill="none" stroke="var(--primary)" strokeWidth="14" strokeLinecap="round" opacity="0.3" />
                  <path d="M 140 35 A 80 80 0 0 1 180 100" fill="none" stroke="var(--success)" strokeWidth="14" strokeLinecap="round" opacity="0.3" />
                  {/* Active fill */}
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#debtGaugeGrad)" strokeWidth="14" strokeLinecap="round" strokeDasharray="251" strokeDashoffset={251 - (activeDebtScore / 100) * 251} style={{ animation: 'gaugeAnim 1.5s ease-out both' }} />
                  <defs>
                    <linearGradient id="debtGaugeGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--destructive)" />
                      <stop offset="40%" stopColor="var(--warning)" />
                      <stop offset="70%" stopColor="var(--primary)" />
                      <stop offset="100%" stopColor="var(--success)" />
                    </linearGradient>
                  </defs>
                  {/* Needle */}
                  <line x1="100" y1="100" x2="100" y2="30" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" transform={`rotate(${-90 + (activeDebtScore / 100) * 180}, 100, 100)`} style={{ animation: 'gaugeAnim 1.5s ease-out both' }} />
                  <circle cx="100" cy="100" r="5" fill="var(--foreground)" />
                </svg>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                  <p className="text-3xl font-bold text-primary">{activeDebtScore}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" />Poor</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" />Fair</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" />Good</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" />Great</span>
              </div>
              <div className="flex items-center gap-1 mt-3">
                <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                <span className="text-xs text-destructive">-6 pts over last 4 sprints</span>
              </div>
            </Card>

            {/* Category Breakdown */}
            <div className="lg:col-span-2">
              <Card className="space-y-4">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Debt by Category
                </h2>
                <div className="space-y-3">
                  {debtByCategory.map((cat, idx) => {
                    const CatIcon = cat.icon;
                    return (
                      <div key={cat.category} style={{ animation: `fadeIn 0.4s ease-out ${idx * 0.08}s both` }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${cat.color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${cat.color} 15%, transparent)` }}>
                              <CatIcon className="w-4 h-4" style={{ color: cat.color }} />
                            </div>
                            <span className="text-xs font-medium text-foreground">{cat.category}</span>
                            <span className="text-[10px] text-muted-foreground">{cat.items} items</span>
                          </div>
                          <span className="text-xs font-bold tabular-nums" style={{ color: cat.color }}>{cat.score}/100</span>
                        </div>
                        <div className="h-4 bg-muted rounded-md overflow-hidden relative">
                          <div
                            className="h-full rounded-md origin-left"
                            style={{ width: `${cat.score}%`, backgroundColor: cat.color, opacity: 0.6, animation: `barGrow 0.8s ease-out ${0.3 + idx * 0.1}s both` }}
                          />
                          {/* Threshold marker */}
                          <div className="absolute top-0 h-full border-l border-dashed border-foreground/20" style={{ left: '70%' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-3 border-t border-border flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="w-3 h-0 border-t border-dashed border-foreground/20" />
                  <span>Target threshold: 70</span>
                  <span className="ml-auto text-destructive">{debtByCategory.filter(c => c.score < 70).length} categories below target</span>
                </div>
              </Card>
            </div>
          </div>

          {/* Debt Timeline */}
          <Card className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Debt Accumulation Timeline
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {displayDebtTimeline.map((sprint, idx) => {
                const isLatest = idx === debtTimeline.length - 1;
                const trend = idx > 0 ? sprint.score - debtTimeline[idx - 1].score : 0;
                return (
                  <div key={sprint.sprint} className={`bento-card rounded-lg p-3 ${isLatest ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50 border border-border'}`} style={{ animation: `fadeIn 0.4s ease-out ${idx * 0.1}s both` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium ${isLatest ? 'text-primary' : 'text-foreground'}`}>{sprint.sprint}</span>
                      {trend !== 0 && (
                        <span className={`text-[10px] font-semibold ${trend < 0 ? 'text-destructive' : 'text-success'}`}>
                          {trend > 0 ? '+' : ''}{trend}
                        </span>
                      )}
                    </div>
                    <p className="text-xl font-bold text-foreground tabular-nums">{sprint.score}</p>
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full origin-left"
                        style={{
                          width: `${sprint.score}%`,
                          backgroundColor: sprint.score >= 75 ? 'var(--success)' : sprint.score >= 60 ? 'var(--warning)' : 'var(--destructive)',
                          animation: `barGrow 0.8s ease-out ${0.3 + idx * 0.1}s both`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                      <span className="text-destructive">+{sprint.added} added</span>
                      <span className="text-success">-{sprint.retired} retired</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <TrendingDown className="w-3.5 h-3.5 text-destructive" />
              <span className="text-xs text-destructive">Debt score declining. Net accumulation of {displayDebtTimeline.reduce((s, t) => s + t.added - t.retired, 0)} items over {displayDebtTimeline.length} sprints.</span>
            </div>
          </Card>

          {/* Debt Items + Module Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Debt Items -- 3 cols */}
            <div className="lg:col-span-3 space-y-3">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                Active Debt Items ({displayDebtItems.length})
              </h2>
              <div className="space-y-2">
                {displayDebtItems.map((item, idx) => {
                  const cfg = severityConfig[item.severity];
                  return (
                    <div
                      key={item.id}
                      className={`bento-card rounded-xl border p-3 ${cfg.bg}`}
                      style={{
                        animation: `fadeIn 0.3s ease-out ${idx * 0.04}s both`,
                        ...(item.severity === 'critical' ? { background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--destructive) 4%, transparent), transparent)', backgroundSize: '200% 100%', animation: `fadeIn 0.3s ease-out ${idx * 0.04}s both, shimmer 3s ease-in-out infinite` } : {}),
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-primary">{item.id}</span>
                            <Badge variant={cfg.badge}>{item.severity.toUpperCase()}</Badge>
                            <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted border border-border">{item.category}</span>
                          </div>
                          <p className="text-sm text-foreground font-medium">{item.title}</p>
                          <div className="flex items-center gap-4 mt-1.5 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />{item.age}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calculator className="w-3 h-3" />{item.fixTime} to fix
                            </span>
                            <span className="font-mono">{item.module}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-xs font-semibold ${cfg.color}`}>{item.impact}</p>
                          {/* Sparkline trend */}
                          <div className="flex items-end gap-px mt-1 h-3">
                            {[3, 5, 4, 6, 5, 7, 6].map((v, i) => (
                              <div
                                key={i}
                                className="w-1 rounded-sm"
                                style={{
                                  height: `${(v / 7) * 100}%`,
                                  backgroundColor: cfg.barColor,
                                  opacity: 0.4 + (i / 7) * 0.6,
                                  animation: `fadeIn 0.2s ease-out ${0.5 + i * 0.03}s both`,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Module Breakdown -- 2 cols */}
            <div className="lg:col-span-2 space-y-3">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Debt by Module
              </h2>
              <div className="space-y-2">
                {debtModules.map((mod, idx) => {
                  const cfg = severityConfig[mod.severity];
                  return (
                    <Card key={mod.module} className={`bento-card space-y-2 ${mod.severity === 'critical' ? 'border-destructive/30' : ''}`}>
                      <div className="flex items-center justify-between" style={{ animation: `fadeIn 0.3s ease-out ${idx * 0.08}s both` }}>
                        <div className="flex items-center gap-2">
                          <div className={`icon-box w-11 h-11 rounded-xl flex items-center justify-center ${mod.severity === 'critical' ? 'bg-destructive/8 border border-destructive/12' : mod.severity === 'high' ? 'bg-warning/8 border border-warning/12' : mod.severity === 'medium' ? 'bg-warning/8 border border-warning/12' : 'bg-success/8 border border-success/12'}`}>
                            <Layers className={`w-5 h-5 ${cfg.color}`} />
                          </div>
                          <span className="font-mono text-sm text-foreground">{mod.module}</span>
                          <Badge variant={cfg.badge}>{mod.severity.toUpperCase()}</Badge>
                        </div>
                        <span className={`text-sm font-bold tabular-nums ${cfg.color}`}>{mod.slowdown}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{mod.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {mod.tickets.map((t) => (
                            <a key={t.id} href={t.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[10px] text-primary hover:text-primary/80 transition-colors font-medium">
                              {t.id}<ArrowUpRight className="w-2.5 h-2.5" />
                            </a>
                          ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{mod.items} debt items</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Debt Retirement Plan */}
          <Card className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-destructive" />
              Debt Retirement Plan
            </h2>
            <p className="text-xs text-muted-foreground">ATLAS recommended phased approach to systematically reduce technical debt over the next 4 sprints.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {retirementPlan.map((phase, idx) => {
                const cfg = severityConfig[phase.priority];
                return (
                  <div
                    key={phase.phase}
                    className={`bento-card rounded-xl border p-4 space-y-3 ${idx === 0 ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/50'}`}
                    style={{ animation: `fadeIn 0.4s ease-out ${idx * 0.1}s both` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`icon-box w-11 h-11 rounded-xl flex items-center justify-center ${phase.priority === 'critical' ? 'bg-destructive/8 border border-destructive/12' : phase.priority === 'high' ? 'bg-warning/8 border border-warning/12' : 'bg-primary/8 border border-primary/12'}`}>
                        <Target className={`w-5 h-5 ${cfg.color}`} />
                      </div>
                      {idx === 0 && <span className="text-[9px] text-primary font-semibold uppercase" style={{ animation: 'pulseGlow 2s ease-in-out infinite' }}>Next Sprint</span>}
                    </div>
                    <Badge variant={cfg.badge}>{phase.priority.toUpperCase()}</Badge>
                    <p className="text-xs font-semibold text-foreground">{phase.phase}</p>
                    <p className="text-xs text-muted-foreground">{phase.title}</p>
                    <div className="space-y-1">
                      {phase.items.map(id => (
                        <span key={id} className="inline-block text-[10px] font-mono text-primary mr-1.5 px-1.5 py-0.5 rounded bg-primary/10">{id}</span>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-border space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">Effort</span>
                        <span className="text-foreground font-semibold">{phase.effort}</span>
                      </div>
                      <p className="text-[10px] text-success">{phase.impact}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Refactoring ROI Card */}
          <Card className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" />
                Refactoring ROI &mdash; <span className="font-mono text-primary">{roiData.module}</span>
              </h2>
              <Badge variant="danger">CRITICAL DEBT</Badge>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Calculator className="w-3.5 h-3.5" />Cost to refactor
                </div>
                <p className="text-sm font-semibold text-foreground">{roiData.costToRefactor}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <TrendingDown className="w-3.5 h-3.5" />Speed improvement
                </div>
                <p className="text-sm font-semibold text-foreground">
                  <span className="text-destructive">{roiData.speedBefore}</span>
                  <ArrowRight className="w-3.5 h-3.5 inline mx-1 text-muted-foreground" />
                  <span className="text-success">{roiData.speedAfter}</span>
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Zap className="w-3.5 h-3.5" />Velocity recovered
                </div>
                <p className="text-sm font-semibold text-success">{roiData.velocityRecovered}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Target className="w-3.5 h-3.5" />Break-even
                </div>
                <p className="text-sm font-semibold text-foreground">{roiData.breakEven}</p>
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 border border-border p-4 space-y-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Before vs After Refactor</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Before (current)</span>
                  <span className="text-destructive font-semibold tabular-nums">{roiData.speedBefore} slowdown</span>
                </div>
                <div className="h-5 bg-muted rounded-md overflow-hidden">
                  <div className="h-full bg-destructive/70 rounded-md origin-left" style={{ width: '82%', animation: 'barGrow 0.8s ease-out 0.3s both' }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">After refactor</span>
                  <span className="text-success font-semibold tabular-nums">{roiData.speedAfter} slowdown</span>
                </div>
                <div className="h-5 bg-muted rounded-md overflow-hidden">
                  <div className="h-full bg-success/70 rounded-md origin-left" style={{ width: '35%', animation: 'barGrow 0.8s ease-out 0.5s both' }} />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Zap className="w-4 h-4 text-success" />
                <span className="text-xs text-success font-medium">+18 pts/sprint recovered after break-even at Sprint 3</span>
              </div>
            </div>
          </Card>
        </div>
      </Reveal>
      </>
      )}
    </>
  );
}
