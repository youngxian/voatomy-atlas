'use client';

import { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  RefreshCw,
  Clock,
  ExternalLink as ExternalLinkIcon,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FileCode,
  Layers,
  Activity,
  Zap,
  GitBranch,
  BarChart3,
  Target,
} from 'lucide-react';
import { Card, Badge, Button, ExternalLink, EmptyState } from '@/components/ui';
import { Reveal } from '@/components/Reveal';
import * as atlas from '@/lib/api';
import { useProject } from '@/lib/project-context';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const modules = [
  { name: 'payments/', score: 8.2, risk: 'HIGH' as const, debt: '2.8x', loc: 14320, issues: 7, files: 48, lastChange: '2h ago' },
  { name: 'auth/', score: 5.1, risk: 'MED' as const, debt: '1.4x', loc: 8740, issues: 3, files: 22, lastChange: '1d ago' },
  { name: 'api/', score: 4.8, risk: 'MED' as const, debt: '1.2x', loc: 11200, issues: 4, files: 35, lastChange: '6h ago' },
  { name: 'dashboard/', score: 2.3, risk: 'LOW' as const, debt: '1.0x', loc: 6580, issues: 1, files: 18, lastChange: '3d ago' },
  { name: 'notifications/', score: 2.1, risk: 'LOW' as const, debt: '1.0x', loc: 3200, issues: 0, files: 12, lastChange: '5d ago' },
  { name: 'users/', score: 1.8, risk: 'LOW' as const, debt: '1.0x', loc: 4100, issues: 1, files: 15, lastChange: '2d ago' },
];

const riskConfig = {
  HIGH: { color: 'bg-destructive', badge: 'danger' as const, barBg: 'bg-destructive/80', textColor: 'text-destructive', borderColor: 'border-destructive/30' },
  MED: { color: 'bg-warning', badge: 'warning' as const, barBg: 'bg-warning/80', textColor: 'text-warning', borderColor: 'border-warning/30' },
  LOW: { color: 'bg-success', badge: 'success' as const, barBg: 'bg-success/80', textColor: 'text-success', borderColor: 'border-success/30' },
};

const maxScore = 10;

// Complexity distribution
const complexityDistribution = [
  { level: 'Critical', count: 1, color: 'var(--destructive)', pct: 17 },
  { level: 'High', count: 0, color: 'var(--primary)', pct: 0 },
  { level: 'Medium', count: 2, color: 'var(--warning)', pct: 33 },
  { level: 'Low', count: 3, color: 'var(--success)', pct: 50 },
];

// Stories by complexity vs effort (scatter plot data)
const scatterData = [
  { id: 'COMP-217', complexity: 8, effort: 8, risk: 'high', module: 'payments/' },
  { id: 'COMP-220', complexity: 7, effort: 8, risk: 'high', module: 'dashboard/' },
  { id: 'COMP-218', complexity: 5, effort: 5, risk: 'medium', module: 'auth/' },
  { id: 'COMP-223', complexity: 5, effort: 5, risk: 'medium', module: 'api/' },
  { id: 'COMP-225', complexity: 4, effort: 5, risk: 'medium', module: 'api/' },
  { id: 'COMP-221', complexity: 3, effort: 5, risk: 'low', module: 'notifications/' },
  { id: 'COMP-219', complexity: 2, effort: 3, risk: 'low', module: 'users/' },
  { id: 'COMP-222', complexity: 2, effort: 3, risk: 'low', module: 'dashboard/' },
  { id: 'COMP-224', complexity: 1, effort: 3, risk: 'low', module: 'users/' },
];

// Complexity trends over sprints
const complexityTrends = [
  { sprint: 'Sprint 21', avg: 3.8, high: 2, total: 48200 },
  { sprint: 'Sprint 22', avg: 4.1, high: 2, total: 49100 },
  { sprint: 'Sprint 23', avg: 4.3, high: 3, total: 50800 },
  { sprint: 'Sprint 24', avg: 4.5, high: 3, total: 52140 },
];

// Hotspot files
const hotspotFiles = [
  { path: 'payments/gateway/stripe-handler.ts', complexity: 9.1, changes: 47, authors: 4, loc: 2840 },
  { path: 'payments/billing/invoice-engine.ts', complexity: 8.7, changes: 38, authors: 3, loc: 1920 },
  { path: 'auth/session/token-manager.ts', complexity: 7.2, changes: 31, authors: 3, loc: 1340 },
  { path: 'api/middleware/rate-limiter.ts', complexity: 6.8, changes: 24, authors: 2, loc: 890 },
  { path: 'payments/webhooks/event-processor.ts', complexity: 6.4, changes: 22, authors: 2, loc: 760 },
  { path: 'auth/oauth/provider-registry.ts', complexity: 5.9, changes: 19, authors: 3, loc: 680 },
  { path: 'api/routes/v2/checkout.ts', complexity: 5.5, changes: 16, authors: 2, loc: 520 },
  { path: 'dashboard/widgets/chart-renderer.ts', complexity: 4.2, changes: 12, authors: 2, loc: 440 },
];

const affectedTickets = [
  { module: 'payments/', ticket: 'COMP-217', href: '#', basePts: 5, debtPts: 3, assignee: 'Alex Chen' },
  { module: 'payments/', ticket: 'COMP-230', href: '#', basePts: 8, debtPts: 5, assignee: 'Alex Chen' },
  { module: 'auth/', ticket: 'COMP-218', href: '#', basePts: 3, debtPts: 2, assignee: 'Sarah Kim' },
  { module: 'api/', ticket: 'COMP-223', href: '#', basePts: 3, debtPts: 2, assignee: 'Sarah Kim' },
  { module: 'api/', ticket: 'COMP-225', href: '#', basePts: 5, debtPts: 0, assignee: 'Alex Chen' },
  { module: 'dashboard/', ticket: 'COMP-220', href: '#', basePts: 5, debtPts: 3, assignee: 'Jordan Lee' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CodeComplexityPage() {
  const { activeProjectId } = useProject();
  const [apiData, setApiData] = useState<atlas.ComplexityInsight[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeProjectId) { setLoading(false); return; }
    atlas.getComplexityInsights(activeProjectId)
      .then(setApiData)
      .catch((err) => console.error('Failed to load complexity data', err))
      .finally(() => setLoading(false));
  }, [activeProjectId]);

  const hasApiData = apiData !== null && apiData.length > 0;
  const isEmpty = !loading && apiData !== null && apiData.length === 0;

  const displayModules = hasApiData
    ? apiData!.map(insight => ({
        name: insight.module.endsWith('/') ? insight.module : insight.module + '/',
        score: insight.score,
        risk: (insight.score >= 7 ? 'HIGH' : insight.score >= 4 ? 'MED' : 'LOW') as 'HIGH' | 'MED' | 'LOW',
        debt: insight.score >= 7 ? '2.0x' : insight.score >= 4 ? '1.4x' : '1.0x',
        loc: 0,
        issues: 0,
        files: insight.file_count,
        lastChange: insight.trend || 'unknown',
      }))
    : modules;

  const totalLOC = displayModules.reduce((s, m) => s + m.loc, 0);
  const totalIssues = displayModules.reduce((s, m) => s + m.issues, 0);
  const avgComplexity = displayModules.length > 0
    ? (displayModules.reduce((s, m) => s + m.score, 0) / displayModules.length).toFixed(1)
    : '0';

  return (
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
        @keyframes pulseGlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes gradientBorder {
          0% { border-color: color-mix(in srgb, var(--primary) 20%, transparent); }
          50% { border-color: color-mix(in srgb, var(--primary) 50%, transparent); }
          100% { border-color: color-mix(in srgb, var(--primary) 20%, transparent); }
        }
        @keyframes dotPop {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isEmpty && (
        <EmptyState
          icon={Layers}
          title="No complexity data yet"
          description="Connect a code repository and run your first analysis to see complexity insights across your modules."
          actionLabel="Connect Repository"
        />
      )}

      {!loading && !isEmpty && (
      <Reveal>
        <div className="space-y-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                Code Complexity Map
                <Badge variant="orange">Live</Badge>
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <ExternalLink href="#">Source: GitHub - voatomy/atlas</ExternalLink>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />Last analyzed: 2h ago
                </span>
              </div>
            </div>
            <Button variant="secondary" size="sm">
              <RefreshCw className="w-3.5 h-3.5" />Re-analyze
            </Button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Avg Complexity</p>
              <p className="text-2xl font-bold text-warning" style={{ animation: 'fadeIn 0.5s ease-out both' }}>{avgComplexity}</p>
              <p className="text-[10px] text-warning/60 mt-1">/ 10.0</p>
            </Card>
            <Card>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total LOC</p>
              <p className="text-2xl font-bold text-foreground" style={{ animation: 'fadeIn 0.5s ease-out 0.1s both' }}>{totalLOC > 0 ? (totalLOC / 1000).toFixed(1) + 'K' : `${displayModules.length} scanned`}</p>
              <p className="text-[10px] text-muted-foreground mt-1">across {displayModules.length} modules</p>
            </Card>
            <Card>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Open Issues</p>
              <p className="text-2xl font-bold text-destructive" style={{ animation: 'fadeIn 0.5s ease-out 0.2s both' }}>{totalIssues}</p>
              <p className="text-[10px] text-destructive/60 mt-1">complexity-related</p>
            </Card>
            <Card>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">High-Risk Modules</p>
              <p className="text-2xl font-bold text-destructive" style={{ animation: 'fadeIn 0.5s ease-out 0.3s both' }}>{displayModules.filter(m => m.risk === 'HIGH').length}</p>
              <div className="flex gap-1 mt-1">
                {displayModules.filter(m => m.risk === 'HIGH').map(m => (
                  <span key={m.name} className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive border border-destructive/20 font-mono">{m.name}</span>
                ))}
              </div>
            </Card>
          </div>

          {/* Complexity Distribution + Scatter Plot -- side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Complexity Distribution */}
            <Card className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Complexity Distribution
              </h2>
              <div className="space-y-3">
                {complexityDistribution.map((item, idx) => (
                  <div key={item.level} style={{ animation: `fadeIn 0.4s ease-out ${idx * 0.1}s both` }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-foreground font-medium">{item.level}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold tabular-nums" style={{ color: item.color }}>{item.count} modules</span>
                        <span className="text-[10px] text-muted-foreground tabular-nums">{item.pct}%</span>
                      </div>
                    </div>
                    <div className="h-6 bg-muted rounded-md overflow-hidden">
                      <div
                        className="h-full rounded-md origin-left"
                        style={{ width: `${item.pct}%`, backgroundColor: item.color, opacity: 0.7, animation: `barGrow 0.8s ease-out ${0.3 + idx * 0.15}s both` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>50% of modules are low-complexity</span>
                <span className="flex items-center gap-1 text-warning">
                  <TrendingUp className="w-3 h-3" />+0.2 avg since Sprint 23
                </span>
              </div>
            </Card>

            {/* Scatter Plot: Complexity vs Effort */}
            <Card className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Complexity vs Effort
              </h2>
              <div className="relative h-52 bg-muted/50 rounded-lg border border-border overflow-hidden">
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={`h-${i}`} className="absolute left-8 right-0 border-t border-border/50" style={{ bottom: `${(i + 1) * 20}%` }} />
                ))}
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={`v-${i}`} className="absolute top-0 bottom-4 border-l border-border/50" style={{ left: `${8 + (i + 1) * 18.4}%` }} />
                ))}
                {/* Y axis label */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] text-muted-foreground whitespace-nowrap">Effort (pts)</div>
                {/* X axis label */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground">Complexity Score</div>
                {/* Data points */}
                {scatterData.map((point, idx) => {
                  const x = 8 + (point.complexity / 10) * 84;
                  const y = 4 + ((10 - point.effort) / 10) * 88;
                  const color = point.risk === 'high' ? 'var(--destructive)' : point.risk === 'medium' ? 'var(--warning)' : 'var(--success)';
                  return (
                    <div
                      key={point.id}
                      className="absolute group"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        animation: `dotPop 0.4s ease-out ${0.2 + idx * 0.08}s both`,
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full border-2 -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-150 transition-transform"
                        style={{ backgroundColor: `${color}40`, borderColor: color }}
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-muted border border-border text-[9px] text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {point.id} - {point.module}
                      </div>
                    </div>
                  );
                })}
                {/* Danger zone overlay */}
                <div className="absolute top-0 right-0 w-[35%] h-[40%] bg-destructive/5 border-l border-b border-destructive/20 rounded-bl-lg" />
                <span className="absolute top-2 right-2 text-[8px] text-destructive/60 uppercase">Danger Zone</span>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-destructive/40 border border-destructive" />High Risk</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-warning/40 border border-warning" />Medium</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-success/40 border border-success" />Low</span>
              </div>
            </Card>
          </div>

          {/* Module Complexity Heatmap */}
          <Card className="space-y-5">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Module Complexity Heatmap
            </h2>

            <div className="space-y-3">
              {displayModules.map((mod, idx) => {
                const cfg = riskConfig[mod.risk];
                const widthPct = (mod.score / maxScore) * 100;

                return (
                  <div
                    key={mod.name}
                    className={`bento-card rounded-lg border p-3 ${mod.risk === 'HIGH' ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-transparent'}`}
                    style={{ animation: `fadeIn 0.4s ease-out ${idx * 0.08}s both` }}
                  >
                    <div className="grid grid-cols-[auto_120px_1fr_auto] items-center gap-4">
                      <div className={`icon-box w-11 h-11 rounded-xl flex items-center justify-center ${mod.risk === 'HIGH' ? 'bg-destructive/8 border border-destructive/12' : mod.risk === 'MED' ? 'bg-warning/8 border border-warning/12' : 'bg-success/8 border border-success/12'}`}>
                        <Layers className={`w-5 h-5 ${cfg.textColor}`} />
                      </div>
                      <div>
                        <span className="font-mono text-sm text-foreground">{mod.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground">{mod.loc.toLocaleString()} LOC</span>
                          <span className="text-[10px] text-muted-foreground">{mod.files} files</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="h-6 bg-muted rounded-md overflow-hidden">
                          <div
                            className={`h-full rounded-md ${cfg.barBg} origin-left`}
                            style={{ width: `${widthPct}%`, animation: `barGrow 0.8s ease-out ${0.3 + idx * 0.1}s both` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">{mod.issues} issues - last changed {mod.lastChange}</span>
                          <span className="text-muted-foreground tabular-nums">debt: {mod.debt}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold tabular-nums ${cfg.textColor}`}>{mod.score}</span>
                        <Badge variant={cfg.badge}>{mod.risk}</Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Complexity Trends + Hotspot Files -- side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Complexity Trends */}
            <Card className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Complexity Trends (Last 4 Sprints)
              </h2>
              <div className="space-y-4">
                {complexityTrends.map((sprint, idx) => {
                  const isLatest = idx === complexityTrends.length - 1;
                  return (
                    <div key={sprint.sprint} className={`bento-card rounded-lg p-3 ${isLatest ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50 border border-border'}`} style={{ animation: `fadeIn 0.4s ease-out ${idx * 0.1}s both` }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium ${isLatest ? 'text-primary' : 'text-foreground'}`}>{sprint.sprint}</span>
                        {isLatest && <Badge variant="orange">Current</Badge>}
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-[9px] uppercase text-muted-foreground">Avg Score</p>
                          <p className="text-sm font-bold text-foreground tabular-nums">{sprint.avg}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase text-muted-foreground">High-Risk</p>
                          <p className="text-sm font-bold text-destructive tabular-nums">{sprint.high}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase text-muted-foreground">Total LOC</p>
                          <p className="text-sm font-bold text-muted-foreground tabular-nums">{(sprint.total / 1000).toFixed(1)}K</p>
                        </div>
                      </div>
                      {/* Mini trend bar */}
                      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full origin-left ${sprint.avg > 4 ? 'bg-warning' : 'bg-success'}`}
                          style={{ width: `${(sprint.avg / maxScore) * 100}%`, animation: `barGrow 0.8s ease-out ${0.5 + idx * 0.1}s both` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <TrendingUp className="w-3.5 h-3.5 text-warning" />
                <span className="text-xs text-warning">Complexity increasing by ~0.2 per sprint. Consider refactoring.</span>
              </div>
            </Card>

            {/* Hotspot Files */}
            <Card className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileCode className="w-4 h-4 text-destructive" />
                Hotspot Files
              </h2>
              <p className="text-xs text-muted-foreground">Files with highest complexity scores, most frequent changes, and multiple contributors.</p>

              <div className="space-y-2">
                {hotspotFiles.map((file, idx) => {
                  const severity = file.complexity >= 8 ? 'critical' : file.complexity >= 6 ? 'high' : file.complexity >= 4 ? 'medium' : 'low';
                  const colors: Record<string, string> = {
                    critical: 'border-destructive/40 bg-destructive/5',
                    high: 'border-primary/30 bg-primary/5',
                    medium: 'border-warning/20 bg-transparent',
                    low: 'border-border bg-transparent',
                  };
                  return (
                    <div
                      key={file.path}
                      className={`bento-card rounded-lg border p-2.5 ${colors[severity]}`}
                      style={{
                        animation: `fadeIn 0.3s ease-out ${idx * 0.05}s both`,
                        ...(severity === 'critical' ? { animation: `fadeIn 0.3s ease-out ${idx * 0.05}s both, gradientBorder 3s ease-in-out infinite` } : {}),
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className={`icon-box w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${severity === 'critical' ? 'bg-destructive/8 border border-destructive/12' : severity === 'high' ? 'bg-primary/8 border border-primary/12' : severity === 'medium' ? 'bg-warning/8 border border-warning/12' : 'bg-muted border border-border'}`}>
                          <FileCode className={`w-5 h-5 ${file.complexity >= 8 ? 'text-destructive' : file.complexity >= 6 ? 'text-primary' : file.complexity >= 4 ? 'text-warning' : 'text-muted-foreground'}`} />
                        </div>
                        <span className="font-mono text-xs text-foreground truncate flex-1 mr-2">
                          {file.path}
                        </span>
                        <span className={`text-xs font-bold tabular-nums ${file.complexity >= 8 ? 'text-destructive' : file.complexity >= 6 ? 'text-primary' : file.complexity >= 4 ? 'text-warning' : 'text-success'}`}>
                          {file.complexity}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span>{file.changes} changes</span>
                        <span>{file.authors} authors</span>
                        <span>{file.loc} LOC</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Jira Tickets Affected by High-Complexity Modules */}
          <Card className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Jira Tickets Affected by High-Complexity Modules
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground text-xs border-b border-border">
                    <th className="text-left pb-2 font-medium">Module</th>
                    <th className="text-left pb-2 font-medium">Ticket</th>
                    <th className="text-left pb-2 font-medium">Assignee</th>
                    <th className="text-right pb-2 font-medium">Base Pts</th>
                    <th className="text-right pb-2 font-medium">Debt Overhead</th>
                    <th className="text-right pb-2 font-medium">Effective Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {affectedTickets.map((row, idx) => (
                    <tr key={`${row.ticket}-${idx}`} style={{ animation: `fadeIn 0.3s ease-out ${idx * 0.05}s both` }}>
                      <td className="py-3 font-mono text-xs text-muted-foreground">{row.module}</td>
                      <td className="py-3">
                        <a href={row.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors text-xs font-medium">
                          {row.ticket}<ArrowUpRight className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">{row.assignee}</td>
                      <td className="py-3 text-right text-xs text-foreground tabular-nums">{row.basePts} pts</td>
                      <td className="py-3 text-right text-xs text-destructive tabular-nums">{row.debtPts > 0 ? `+${row.debtPts} for debt` : '-'}</td>
                      <td className="py-3 text-right text-xs font-semibold text-foreground tabular-nums">{row.basePts + row.debtPts} pts</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border">
                    <td colSpan={3} className="py-3 text-xs font-semibold text-muted-foreground">Total Impact</td>
                    <td className="py-3 text-right text-xs font-semibold text-foreground tabular-nums">{affectedTickets.reduce((s, r) => s + r.basePts, 0)} pts</td>
                    <td className="py-3 text-right text-xs font-semibold text-destructive tabular-nums">+{affectedTickets.reduce((s, r) => s + r.debtPts, 0)} pts</td>
                    <td className="py-3 text-right text-xs font-bold text-primary tabular-nums">{affectedTickets.reduce((s, r) => s + r.basePts + r.debtPts, 0)} pts</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>
      </Reveal>
      )}
    </>
  );
}
