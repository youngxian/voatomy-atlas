'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  Brain,
  GitBranch,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
  ChevronDown,
  ChevronRight,
  FileText,
} from 'lucide-react';
import * as api from '@/lib/api';
import { clsx } from 'clsx';

interface Props {
  projectId: string;
}

type Tab = 'overview' | 'forecast' | 'calibration' | 'cascades' | 'simulator' | 'anomalies' | 'loadbalance' | 'report';

export default function SprintInsightsPanel({ projectId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [collapsed, setCollapsed] = useState(false);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Smart Labels', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { key: 'forecast', label: 'Forecast', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { key: 'calibration', label: 'Calibration', icon: <Target className="w-3.5 h-3.5" /> },
    { key: 'cascades', label: 'Blockers', icon: <GitBranch className="w-3.5 h-3.5" /> },
    { key: 'simulator', label: 'Simulator', icon: <Zap className="w-3.5 h-3.5" /> },
    { key: 'anomalies', label: 'Anomalies', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    { key: 'loadbalance', label: 'Load', icon: <Users className="w-3.5 h-3.5" /> },
    { key: 'report', label: 'Report', icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Sprint Insights</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">AI</span>
        </div>
        {collapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {!collapsed && (
        <>
          <div className="flex gap-1 px-4 pb-2 overflow-x-auto scrollbar-hide">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={clsx(
                  'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                  activeTab === t.key
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/50',
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          <div className="px-5 pb-5">
            {activeTab === 'overview' && <SmartLabelsTab projectId={projectId} />}
            {activeTab === 'forecast' && <VelocityForecastTab projectId={projectId} />}
            {activeTab === 'calibration' && <CalibrationTab projectId={projectId} />}
            {activeTab === 'cascades' && <BlockerCascadesTab projectId={projectId} />}
            {activeTab === 'simulator' && <SimulatorTab projectId={projectId} />}
            {activeTab === 'anomalies' && <AnomaliesTab projectId={projectId} />}
            {activeTab === 'loadbalance' && <LoadBalanceTab projectId={projectId} />}
            {activeTab === 'report' && <ExecutiveReportTab projectId={projectId} />}
          </div>
        </>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground text-center py-6">{message}</p>;
}

// ── Smart Labels ──

function SmartLabelsTab({ projectId }: { projectId: string }) {
  const [labels, setLabels] = useState<api.SmartLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [pushing, setPushing] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.getSmartLabels(projectId).then(setLabels).catch(() => setLabels([])).finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handlePush = async () => {
    setPushing(true);
    try {
      const result = await api.getSmartLabels(projectId, true);
      setLabels(result);
    } catch { /* ignore */ }
    setPushing(false);
  };

  if (loading) return <LoadingState />;
  if (labels.length === 0) return <EmptyState message="No risk labels detected for the current sprint." />;

  const labelColors: Record<string, string> = {
    'at-risk': 'bg-destructive/10 text-destructive border-destructive/20',
    'high-complexity': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    'needs-breakdown': 'bg-violet-500/10 text-violet-600 border-violet-500/20',
    stale: 'bg-muted text-muted-foreground border-border',
    'blocker-chain': 'bg-red-500/10 text-red-600 border-red-500/20',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{labels.length} labels detected</p>
        <button
          onClick={handlePush}
          disabled={pushing}
          className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
        >
          {pushing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Push to board
        </button>
      </div>
      {labels.map((l, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/40">
          <span className={clsx('px-2 py-0.5 rounded-md text-[10px] font-semibold border', labelColors[l.label] || 'bg-muted')}>
            {l.label}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{l.ticket_title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{l.reason}</p>
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">{Math.round(l.confidence * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

// ── Velocity Forecast ──

function VelocityForecastTab({ projectId }: { projectId: string }) {
  const [forecast, setForecast] = useState<api.VelocityForecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getVelocityForecast(projectId).then(setForecast).catch(() => setForecast(null)).finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <LoadingState />;
  if (!forecast) return <EmptyState message="Need at least 3 completed sprints for forecasting." />;

  const rangeWidth = forecast.next_sprint_high - forecast.next_sprint_low;
  const midPos = rangeWidth > 0 ? ((forecast.next_sprint_mid - forecast.next_sprint_low) / rangeWidth) * 100 : 50;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-xl bg-muted/30 border border-border/40">
          <p className="text-lg font-bold text-muted-foreground">{forecast.next_sprint_low}</p>
          <p className="text-[10px] text-muted-foreground">Pessimistic</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-primary/5 border border-primary/20">
          <p className="text-lg font-bold text-primary">{forecast.next_sprint_mid}</p>
          <p className="text-[10px] text-primary">Expected</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-muted/30 border border-border/40">
          <p className="text-lg font-bold text-muted-foreground">{forecast.next_sprint_high}</p>
          <p className="text-[10px] text-muted-foreground">Optimistic</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{forecast.next_sprint_low} pts</span>
          <span>{forecast.next_sprint_high} pts</span>
        </div>
        <div className="relative h-3 rounded-full bg-muted/50 overflow-hidden">
          <div className="absolute inset-y-0 rounded-full bg-primary/20" style={{ left: '0%', right: '0%' }} />
          <div
            className="absolute top-0 h-full w-1 bg-primary rounded-full"
            style={{ left: `${midPos}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {forecast.confidence_pct}% confidence | Trend: {forecast.trend}
        </p>
      </div>

      <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">{forecast.insight}</p>
    </div>
  );
}

// ── Calibration ──

function CalibrationTab({ projectId }: { projectId: string }) {
  const [report, setReport] = useState<api.CalibrationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'developer' | 'module'>('developer');

  useEffect(() => {
    api.getCalibrationReport(projectId).then(setReport).catch(() => setReport(null)).finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <LoadingState />;
  if (!report) return <EmptyState message="Need completed sprints for calibration data." />;

  const entries = view === 'developer' ? report.by_developer : report.by_module;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <button
            onClick={() => setView('developer')}
            className={clsx('text-xs px-2 py-1 rounded-md', view === 'developer' ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}
          >
            By Developer
          </button>
          <button
            onClick={() => setView('module')}
            className={clsx('text-xs px-2 py-1 rounded-md', view === 'module' ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}
          >
            By Module
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground">{report.sprints_used} sprints analyzed</span>
      </div>

      <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium">Global Bias: {report.global_bias > 0 ? '+' : ''}{report.global_bias} pts</span>
        </div>
        <p className="text-xs text-muted-foreground">{report.insight}</p>
      </div>

      <div className="space-y-2">
        {entries.slice(0, 8).map((e, i) => (
          <div key={i} className="flex items-center gap-3 text-xs">
            <span className="w-24 truncate font-medium">{e.assignee_id === 'unassigned' ? 'Unassigned' : e.assignee_id.slice(0, 8)}</span>
            <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
              <div
                className={clsx('h-full rounded-full', e.accuracy_pct >= 70 ? 'bg-emerald-500' : e.accuracy_pct >= 50 ? 'bg-amber-500' : 'bg-destructive')}
                style={{ width: `${Math.min(e.accuracy_pct, 100)}%` }}
              />
            </div>
            <span className="w-12 text-right text-muted-foreground">{e.accuracy_pct}%</span>
            <span className={clsx('w-16 text-right', e.avg_bias > 0 ? 'text-amber-600' : e.avg_bias < 0 ? 'text-blue-600' : 'text-emerald-600')}>
              {e.avg_bias > 0 ? '+' : ''}{e.avg_bias}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Blocker Cascades ──

function BlockerCascadesTab({ projectId }: { projectId: string }) {
  const [cascades, setCascades] = useState<api.BlockerCascade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBlockerCascades(projectId).then(setCascades).catch(() => setCascades([])).finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <LoadingState />;
  if (cascades.length === 0) return <EmptyState message="No blocker cascades detected." />;

  const riskColors: Record<string, string> = {
    critical: 'text-destructive',
    high: 'text-amber-600',
    medium: 'text-yellow-600',
    low: 'text-muted-foreground',
  };

  return (
    <div className="space-y-3">
      {cascades.slice(0, 5).map((c, i) => (
        <div key={i} className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className={clsx('w-3.5 h-3.5', riskColors[c.risk_level])} />
              <span className="text-sm font-medium truncate">{c.root_title}</span>
            </div>
            <span className={clsx('text-[10px] font-semibold uppercase', riskColors[c.risk_level])}>{c.risk_level}</span>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>{c.affected_tickets.length} tickets affected</span>
            <span>{c.total_impact_pts} pts at risk</span>
            <span>Depth: {c.max_depth}</span>
          </div>
          <p className="text-xs text-muted-foreground">{c.recommendation}</p>
        </div>
      ))}
    </div>
  );
}

// ── Sprint Simulator ──

function SimulatorTab({ projectId }: { projectId: string }) {
  const [sim, setSim] = useState<api.SprintSimulation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.simulateSprintOutcome(projectId).then(setSim).catch(() => setSim(null)).finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <LoadingState />;
  if (!sim) return <EmptyState message="No active sprint to simulate." />;

  const probColor = sim.completion_prob >= 0.7 ? 'text-emerald-600' : sim.completion_prob >= 0.4 ? 'text-amber-600' : 'text-destructive';

  return (
    <div className="space-y-4">
      <div className="text-center p-4 rounded-xl bg-muted/30 border border-border/40">
        <p className={clsx('text-3xl font-bold', probColor)}>{Math.round(sim.completion_prob * 100)}%</p>
        <p className="text-xs text-muted-foreground mt-1">Chance of completing all {sim.total_planned} points</p>
        <p className="text-[10px] text-muted-foreground">Based on {sim.iterations.toLocaleString()} Monte Carlo simulations</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-lg bg-muted/20">
          <p className="text-sm font-bold">{sim.p50_delivered}</p>
          <p className="text-[10px] text-muted-foreground">P50</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/20">
          <p className="text-sm font-bold">{sim.p75_delivered}</p>
          <p className="text-[10px] text-muted-foreground">P75</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/20">
          <p className="text-sm font-bold">{sim.p90_delivered}</p>
          <p className="text-[10px] text-muted-foreground">P90</p>
        </div>
      </div>

      {sim.risk_factors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium">Risk Factors</p>
          {sim.risk_factors.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
              <span>{r.factor.replace(/_/g, ' ')}</span>
              <span className="ml-auto">{Math.round(r.probability * 100)}%</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">{sim.insight}</p>
    </div>
  );
}

// ── Anomalies ──

function AnomaliesTab({ projectId }: { projectId: string }) {
  const [alerts, setAlerts] = useState<api.AnomalyAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.detectAnomalies(projectId).then(setAlerts).catch(() => setAlerts([])).finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <LoadingState />;
  if (alerts.length === 0) return <EmptyState message="No anomalies detected. All metrics are within normal ranges." />;

  const sevColors: Record<string, string> = {
    critical: 'bg-destructive/10 text-destructive border-destructive/20',
    warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  };

  return (
    <div className="space-y-3">
      {alerts.map((a) => (
        <div key={a.id} className={clsx('p-3 rounded-xl border', sevColors[a.severity] || 'bg-muted/30 border-border/40')}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-sm font-medium">{a.title}</span>
          </div>
          <p className="text-xs opacity-80">{a.description}</p>
          <div className="flex gap-3 mt-2 text-[10px] opacity-60">
            <span>Expected: {Math.round(a.expected_value)}</span>
            <span>Actual: {Math.round(a.actual_value)}</span>
            <span>Deviation: {a.deviation_pct}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Load Balance ──

function LoadBalanceTab({ projectId }: { projectId: string }) {
  const [report, setReport] = useState<api.LoadBalanceReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLoadBalanceReport(projectId).then(setReport).catch(() => setReport(null)).finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <LoadingState />;
  if (!report) return <EmptyState message="No active sprint to analyze load." />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40">
        <div>
          <p className="text-sm font-medium">Gini: {report.gini_coefficient}</p>
          <p className="text-xs text-muted-foreground">{report.is_balanced ? 'Well balanced' : 'Imbalanced'}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">{report.total_points} pts</p>
          <p className="text-xs text-muted-foreground">{report.member_count} members</p>
        </div>
      </div>

      <div className="space-y-2">
        {report.recommendations.map((r, i) => {
          const maxLoad = Math.max(...report.recommendations.map((x) => x.current_load), 1);
          const pct = (r.current_load / maxLoad) * 100;
          const isOver = r.delta > 3;
          const isUnder = r.delta < -3;
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium truncate w-32">{r.assignee_id === 'unassigned' ? 'Unassigned' : r.assignee_id.slice(0, 8)}</span>
                <span className={clsx(isOver ? 'text-destructive' : isUnder ? 'text-blue-600' : 'text-muted-foreground')}>
                  {r.current_load} pts ({r.delta > 0 ? '+' : ''}{r.delta})
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className={clsx('h-full rounded-full transition-all', isOver ? 'bg-destructive' : isUnder ? 'bg-blue-500' : 'bg-emerald-500')}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">{report.insight}</p>
    </div>
  );
}

// ── Executive Report ──

function ExecutiveReportTab({ projectId }: { projectId: string }) {
  const [report, setReport] = useState<api.ExecutiveReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getExecutiveReport(projectId).then(setReport).catch(() => setReport(null)).finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <LoadingState />;
  if (!report) return <EmptyState message="Unable to generate report. Need sprint history." />;

  const healthColor = report.health_score >= 70 ? 'text-emerald-600' : report.health_score >= 50 ? 'text-amber-600' : 'text-destructive';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/40">
        <div className="text-center">
          <p className={clsx('text-3xl font-bold', healthColor)}>{report.health_score}</p>
          <p className="text-[10px] text-muted-foreground">Health Score</p>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Velocity</p>
            <p className="font-medium">{report.metrics.avg_velocity} pts/sprint</p>
          </div>
          <div>
            <p className="text-muted-foreground">Accuracy</p>
            <p className="font-medium">{report.metrics.avg_accuracy}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Delivered</p>
            <p className="font-medium">{report.metrics.total_delivered} pts</p>
          </div>
          <div>
            <p className="text-muted-foreground">Carryover</p>
            <p className="font-medium">{report.metrics.carryover_rate}%</p>
          </div>
        </div>
      </div>

      {report.highlights.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-1.5">Highlights</p>
          {report.highlights.map((h, i) => (
            <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5 mb-1">
              <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" /> {h}
            </p>
          ))}
        </div>
      )}

      {report.risks.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-1.5">Risks</p>
          {report.risks.map((r, i) => (
            <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5 mb-1">
              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" /> {r}
            </p>
          ))}
        </div>
      )}

      {report.recommendations.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-1.5">Recommendations</p>
          {report.recommendations.map((r, i) => (
            <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5 mb-1">
              <Sparkles className="w-3 h-3 text-primary shrink-0 mt-0.5" /> {r}
            </p>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center">{report.period} | Generated {new Date(report.generated_at).toLocaleDateString()}</p>
    </div>
  );
}
