'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  Target,
  Zap,
  ArrowUpRight,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Layers,
  Activity,
  Award,
  Users,
  FolderKanban,
  GitBranch,
  Ticket,
  CircleDot,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  Download,
} from 'lucide-react';
import TabBar from '@/components/TabBar';
import { Card, Badge, ProgressBar, EmptyState } from '@/components/ui';
import * as atlas from '@/lib/api';

// ─── Data Hierarchy: Team → Project → Epic → Feature → Ticket ────────────────

interface TeamData {
  id: string;
  name: string;
  lead: string;
  leadInitials: string;
  members: number;
  color: string;
  colorBg: string;
}

interface ProjectData {
  id: string;
  name: string;
  teamId: string;
  board: string;
  boardColor: string;
  boardUrl: string;
}

interface EpicData {
  id: string;
  name: string;
  projectId: string;
  status: 'completed' | 'active' | 'planned';
}

interface FeatureData {
  id: string;
  key: string;
  name: string;
  epicId: string;
  sprint: string;
  storyPoints: number;
  revenueImpact: number;
  status: 'shipped' | 'in-progress' | 'planned';
  deals: number;
  confidence: 'high' | 'medium' | 'low';
}

interface TicketData {
  id: string;
  key: string;
  title: string;
  featureId: string;
  type: 'story' | 'bug' | 'task' | 'improvement';
  storyPoints: number;
  revenueImpact: number;
  status: 'done' | 'in-progress' | 'todo';
  assignee: string;
  assigneeInitials: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(val: number) {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val}`;
}

function confBadge(c: FeatureData['confidence']) {
  const map = { high: 'success', medium: 'warning', low: 'danger' } as const;
  return map[c];
}

function statusIcon(s: string) {
  if (s === 'done' || s === 'shipped' || s === 'completed') return <CheckCircle2 className="w-3.5 h-3.5 text-success" />;
  if (s === 'in-progress' || s === 'active') return <Clock className="w-3.5 h-3.5 text-warning" />;
  return <CircleDot className="w-3.5 h-3.5 text-muted-foreground" />;
}

function typeBadge(t: TicketData['type']) {
  const map = { story: 'info', bug: 'danger', task: 'muted', improvement: 'success' } as const;
  return map[t] || 'muted';
}

/** Map API by_feature to FeatureData for display */
function apiFeaturesToFeatureData(byFeature: atlas.RevenueOverview['by_feature'] | null): FeatureData[] {
  if (!byFeature || byFeature.length === 0) return [];
  return byFeature.map((f, i) => ({
    id: `f-${i}`,
    key: `F-${String(i + 1).padStart(3, '0')}`,
    name: f.feature,
    epicId: '',
    sprint: '',
    storyPoints: 0,
    revenueImpact: f.revenue,
    status: 'shipped' as const,
    deals: 0,
    confidence: 'medium' as const,
  }));
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

function getTabs(byFeatureCount: number) {
  return [
    { id: 'overview', label: 'Overview' },
    { id: 'features', label: 'Features', badge: byFeatureCount },
  ];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub: string; icon: React.ElementType; color: string }) {
  return (
    <Card className="bento-card">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25` }}>
          <Icon className="w-4.5 h-4.5" style={{ color }} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </Card>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, backgroundColor: color }} />
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({ apiRevenue, apiPipeline, apiByFeature }: {
  apiRevenue: atlas.RevenueOverview | null;
  apiPipeline: atlas.RevenueOverview['pipeline'] | null;
  apiByFeature: atlas.RevenueOverview['by_feature'] | null;
}) {
  const totalRevenue = apiRevenue?.total_revenue ?? 0;
  const featureCount = apiByFeature?.length ?? 0;

  return (
    <div className="space-y-6 mt-4">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={fmt(totalRevenue)} sub="Mapped from CRM and project data" icon={DollarSign} color="var(--success)" />
        <StatCard label="Features Tracked" value={String(featureCount)} sub="Revenue-impacting features" icon={Zap} color="var(--primary)" />
        <StatCard label="Pipeline Stages" value={String(apiPipeline?.length ?? apiRevenue?.pipeline?.length ?? 0)} sub="Active pipeline stages" icon={Target} color="var(--destructive)" />
        <StatCard label="Revenue Sources" value={String(featureCount)} sub="Features with revenue impact" icon={Users} color="var(--primary)" />
      </div>

      {/* Top Revenue Features */}
      {apiByFeature && apiByFeature.length > 0 && (
        <Card className="bento-card space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            Top Revenue Features
          </h3>
          <div className="space-y-3">
            {apiByFeature.slice(0, 10).map((f, i) => (
              <div key={f.feature} className="flex items-center gap-2.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>{i + 1}</span>
                <span className="text-xs font-medium text-foreground flex-1 truncate">{f.feature}</span>
                <span className="text-xs font-bold text-success tabular-nums">{fmt(f.revenue)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pipeline from API */}
      {(apiPipeline ?? apiRevenue?.pipeline) && (apiPipeline ?? apiRevenue!.pipeline).length > 0 && (
        <Card className="bento-card space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-muted-foreground" />
            Revenue Pipeline
          </h3>
          <div className="space-y-3">
            {(apiPipeline ?? apiRevenue!.pipeline).map(stage => {
              const maxVal = Math.max(...(apiPipeline ?? apiRevenue!.pipeline).map(s => s.value));
              return (
                <div key={stage.stage} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground font-medium">{stage.stage}</span>
                    <span className="font-bold text-foreground tabular-nums">{fmt(stage.value)} ({stage.count})</span>
                  </div>
                  <MiniBar value={stage.value} max={maxVal} color="var(--primary)" />
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Features Tab (Teams/Projects/Epics/Tickets tabs removed - API provides overview + by_feature only) ───

function FeaturesTab({ apiByFeature }: { apiByFeature: atlas.RevenueOverview['by_feature'] | null }) {
  const [showAll, setShowAll] = useState(false);
  const features = apiFeaturesToFeatureData(apiByFeature);
  const sorted = [...features].sort((a, b) => b.revenueImpact - a.revenueImpact);
  const visible = showAll ? sorted : sorted.slice(0, 10);

  if (features.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center py-12 text-center rounded-xl border border-border bg-muted/30">
        <FolderKanban className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No feature-level revenue data yet.</p>
        <p className="text-xs text-muted-foreground mt-1">Connect your CRM to map features to revenue impact.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-xl border border-[#E2DED6]/60 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F5F3EF] border-b border-[#E2DED6]/60">
                <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Feature</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(f => (
                <tr key={f.id} className="border-b border-[#E2DED6]/40 last:border-b-0 hover:bg-[#F5F3EF]/50 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {statusIcon(f.status)}
                      <span className="text-[11px] font-medium text-primary">{f.key}</span>
                      <span className="text-xs text-foreground font-medium truncate max-w-[200px]">{f.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs font-bold text-success tabular-nums">{fmt(f.revenueImpact)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!showAll && features.length > 10 && (
          <button onClick={() => setShowAll(true)} className="flex items-center justify-center gap-1 w-full px-4 py-2.5 text-xs font-medium text-primary hover:bg-muted transition-colors border-t border-border">
            Show all {features.length} features
            <ChevronDown className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function RevenuePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [apiRevenue, setApiRevenue] = useState<atlas.RevenueOverview | null>(null);
  const [apiPipeline, setApiPipeline] = useState<atlas.RevenueOverview['pipeline'] | null>(null);
  const [apiByFeature, setApiByFeature] = useState<atlas.RevenueOverview['by_feature'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    atlas.getMe()
      .then(me => {
        return Promise.all([
          atlas.getRevenue(me.org_id),
          atlas.getRevenuePipeline(me.org_id).catch(() => null),
          atlas.getRevenueByFeature(me.org_id).catch(() => null),
        ]);
      })
      .then(([revenue, pipeline, byFeature]) => {
        setApiRevenue(revenue);
        if (pipeline) setApiPipeline(pipeline);
        if (byFeature) setApiByFeature(byFeature);
      })
      .catch((err) => console.error('Failed to load revenue', err))
      .finally(() => setLoading(false));
  }, []);

  const isEmpty = !loading && apiRevenue !== null && apiRevenue.total_revenue === 0 && (apiRevenue.pipeline?.length ?? 0) === 0 && (apiByFeature?.length ?? 0) === 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-success border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        icon={DollarSign}
        title="No revenue data yet"
        description="Connect your CRM or project management tool to map engineering work to revenue impact. Revenue data will appear once integrations are configured."
        actionLabel="Connect Integration"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-success" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Revenue Impact</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Q1 2026 &middot; Engineering work mapped to revenue across teams, projects, and tickets</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-medium text-success">LOOP Synced</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <TabBar tabs={getTabs(apiByFeature?.length ?? 0)} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content */}
      {activeTab === 'overview' && <OverviewTab apiRevenue={apiRevenue} apiPipeline={apiPipeline} apiByFeature={apiByFeature} />}
      {activeTab === 'features' && <FeaturesTab apiByFeature={apiByFeature} />}
    </div>
  );
}
