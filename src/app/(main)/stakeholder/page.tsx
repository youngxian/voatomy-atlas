'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Download,
  Share2,
  CheckCircle2,
  Bug,
  TrendingUp,
  Heart,
  AlertTriangle,
  Clock,
  Flag,
  FileText,
  Target,
  Calendar,
  Sparkles,
  Users,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { EmptyState } from '@/components/ui';
import * as atlas from '@/lib/api';

/* ------------------------------------------------------------------ */
/*  Types (driven by API)                                               */
/* ------------------------------------------------------------------ */

interface KPI {
  label: string;
  value: string;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  color: string;
  bg: string;
}

interface Feature {
  id: string;
  name: string;
  owner: string;
  ownerColor: string;
  ownerInitials: string;
  progress: number;
  deadline: string;
  status: 'on-track' | 'at-risk' | 'completed' | 'behind';
}

interface Risk {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  impact: string;
  mitigation: string;
  mitigationStatus: 'in-progress' | 'planned' | 'complete';
  owner: string;
}

interface Milestone {
  id: string;
  title: string;
  date: string;
  status: 'completed' | 'current' | 'upcoming';
  description: string;
}

/* Extended report type for API responses with optional structured data */
interface StakeholderReportExtended extends atlas.StakeholderReport {
  kpis?: KPI[];
  features?: Feature[];
  risks?: Risk[];
  milestones?: Milestone[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function severityConfig(severity: 'high' | 'medium' | 'low') {
  switch (severity) {
    case 'high': return { label: 'HIGH', color: 'text-destructive', bg: 'bg-destructive/15', border: 'border-destructive/20' };
    case 'medium': return { label: 'MED', color: 'text-warning', bg: 'bg-warning/15', border: 'border-warning/20' };
    case 'low': return { label: 'LOW', color: 'text-primary', bg: 'bg-primary/15', border: 'border-primary/20' };
  }
}

function statusBadge(status: string) {
  switch (status) {
    case 'on-track': return { label: 'On Track', color: 'text-success', bg: 'bg-success/15', border: 'border-success/20' };
    case 'at-risk': return { label: 'At Risk', color: 'text-warning', bg: 'bg-warning/15', border: 'border-warning/20' };
    case 'completed': return { label: 'Complete', color: 'text-primary', bg: 'bg-primary/15', border: 'border-primary/20' };
    case 'behind': return { label: 'Behind', color: 'text-destructive', bg: 'bg-destructive/15', border: 'border-destructive/20' };
    default: return { label: status, color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border/60' };
  }
}

function mitigationConfig(status: string) {
  switch (status) {
    case 'in-progress': return { label: 'In Progress', color: 'text-warning', bg: 'bg-warning/15' };
    case 'planned': return { label: 'Planned', color: 'text-primary', bg: 'bg-primary/15' };
    case 'complete': return { label: 'Complete', color: 'text-success', bg: 'bg-success/15' };
    default: return { label: status, color: 'text-muted-foreground', bg: 'bg-muted' };
  }
}

function progressBarColor(pct: number) {
  if (pct >= 80) return 'bg-success';
  if (pct >= 50) return 'bg-warning';
  return 'bg-destructive';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function StakeholderPage() {
  const [apiReports, setApiReports] = useState<StakeholderReportExtended[] | null>(null);
  const [apiRevenue, setApiRevenue] = useState<atlas.RevenueOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    atlas.getMe()
      .then(me => {
        setOrgId(me.org_id);
        return Promise.all([
          atlas.getStakeholderReports(me.org_id),
          atlas.getRevenue(me.org_id).catch(() => null),
        ]);
      })
      .then(([reports, revenue]) => {
        setApiReports((reports ?? []) as StakeholderReportExtended[]);
        if (revenue) setApiRevenue(revenue);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load stakeholder reports');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = useCallback(() => {
    if (!orgId) return;
    setError(null);
    atlas.generateStakeholderReport(orgId)
      .then(report => {
        setApiReports(prev => prev ? [report as StakeholderReportExtended, ...prev] : [report as StakeholderReportExtended]);
      })
      .catch((err) => setError(err?.message || 'Failed to generate report'));
  }, [orgId]);

  const latestReport = apiReports?.[0] ?? null;
  const displayKpis = latestReport && 'kpis' in latestReport && Array.isArray((latestReport as StakeholderReportExtended).kpis)
    ? (latestReport as StakeholderReportExtended).kpis!
    : [];
  const displayFeatures = latestReport && 'features' in latestReport && Array.isArray((latestReport as StakeholderReportExtended).features)
    ? (latestReport as StakeholderReportExtended).features!
    : [];
  const displayRisks = latestReport && 'risks' in latestReport && Array.isArray((latestReport as StakeholderReportExtended).risks)
    ? (latestReport as StakeholderReportExtended).risks!
    : [];
  const displayMilestones = latestReport && 'milestones' in latestReport && Array.isArray((latestReport as StakeholderReportExtended).milestones)
    ? (latestReport as StakeholderReportExtended).milestones!
    : [];
  const executiveSummary = latestReport?.summary ?? '';

  const isEmpty = !loading && apiReports !== null && apiReports.length === 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        icon={Building2}
        title="No stakeholder reports yet"
        description="Generate your first stakeholder report to share sprint progress, risks, and milestones with your team and executives."
        actionLabel="Generate Report"
        onAction={handleGenerate}
      />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-1">Failed to load</h2>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white">
          Retry
        </button>
      </div>
    );
  }

  return (
    <Reveal>
      <div className="space-y-8">
        {/* ---- Header ---- */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center"
              style={{ animation: 'headerGlow 3s ease-in-out infinite' }}
            >
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1
                className="text-3xl font-extrabold text-foreground"
                style={{ animation: 'fadeSlideIn 0.6s ease-out forwards' }}
              >
                Sprint Summary for Stakeholders
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                Sprint 25 &middot; Feb 24 &ndash; Mar 7 &middot; Acme Inc.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button onClick={handleGenerate} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors shadow-sm shadow-primary/20">
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>

        {/* ---- KPI Row ---- */}
        {displayKpis.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayKpis.map((kpi, i) => {
            const KpiIcon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="bento-card rounded-xl bg-card border border-border p-5 space-y-3 hover:border-border/80 transition-all duration-300"
                style={{ animation: `cardSlideUp 0.4s ease-out ${i * 0.08}s both` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{kpi.label}</span>
                  <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                    <KpiIcon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                </div>
                <div>
                  <span
                    className="text-4xl font-extrabold text-foreground"
                    style={{ animation: `numberFadeIn 0.8s ease-out ${i * 0.1 + 0.2}s both` }}
                  >
                    {kpi.value}
                  </span>
                </div>
                <p className={`text-xs font-medium ${
                  kpi.changeType === 'up' ? 'text-success' : kpi.changeType === 'down' ? 'text-destructive' : 'text-muted-foreground'
                }`}>
                  {kpi.changeType === 'up' && <TrendingUp className="w-3 h-3 inline mr-1" />}
                  {kpi.change}
                </p>
              </div>
            );
          })}
        </div>
        )}

        {/* ---- Revenue Overview (from API) ---- */}
        {apiRevenue && apiRevenue.total_revenue > 0 && (
          <div className="bento-card rounded-xl bg-card border border-border p-5 space-y-3" style={{ animation: 'cardSlideUp 0.4s ease-out both' }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              Revenue Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-xs text-muted-foreground">Total Revenue</span>
                <p className="text-2xl font-extrabold text-foreground">
                  ${apiRevenue.total_revenue >= 1_000_000
                    ? `${(apiRevenue.total_revenue / 1_000_000).toFixed(1)}M`
                    : apiRevenue.total_revenue >= 1_000
                    ? `${(apiRevenue.total_revenue / 1_000).toFixed(0)}K`
                    : apiRevenue.total_revenue}
                </p>
              </div>
              {apiRevenue.pipeline.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Pipeline Stages</span>
                  <p className="text-2xl font-extrabold text-foreground">{apiRevenue.pipeline.length}</p>
                </div>
              )}
              {apiRevenue.by_feature.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Revenue Features</span>
                  <p className="text-2xl font-extrabold text-foreground">{apiRevenue.by_feature.length}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- Feature Progress ---- */}
        {displayFeatures.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Feature Progress
            </h2>
            <span className="text-xs text-muted-foreground">
              {displayFeatures.filter(f => f.status === 'completed').length}/{displayFeatures.length} completed
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayFeatures.map((feature, i) => {
              const sb = statusBadge(feature.status);
              return (
                <div
                  key={feature.id}
                  className="bento-card rounded-xl bg-card border border-border p-5 space-y-4 hover:border-border/80 transition-all duration-300"
                  style={{ animation: `cardSlideUp 0.4s ease-out ${i * 0.06}s both` }}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-semibold text-foreground">{feature.name}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${sb.bg} ${sb.color} ${sb.border}`}>
                      {sb.label}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-foreground font-bold">{feature.progress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${progressBarColor(feature.progress)}`}
                        style={{
                          width: `${feature.progress}%`,
                          animation: `barFillIn 1s ease-out ${i * 0.1}s both`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ backgroundColor: feature.ownerColor + '25', color: feature.ownerColor }}
                      >
                        {feature.ownerInitials}
                      </div>
                      <span className="text-xs text-muted-foreground">{feature.owner}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {feature.deadline}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* ---- Risk Register & Executive Summary side-by-side ---- */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Risk Register */}
          {displayRisks.length > 0 && (
          <div className="xl:col-span-2 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Risk Register
            </h2>
            <div className="space-y-3">
              {displayRisks.map((risk, i) => {
                const sc = severityConfig(risk.severity);
                const mc = mitigationConfig(risk.mitigationStatus);
                return (
                  <div
                    key={risk.id}
                    className="bento-card rounded-xl bg-card border border-border p-5 space-y-3 hover:border-border/80 transition-all duration-300"
                    style={{ animation: `cardSlideUp 0.3s ease-out ${i * 0.06}s both` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${sc.bg} ${sc.color} ${sc.border}`}>
                          {sc.label}
                        </span>
                        <h3 className="text-sm font-semibold text-foreground">{risk.title}</h3>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${mc.bg} ${mc.color}`}>
                        {mc.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground block mb-1">Impact</span>
                        <span className="text-foreground">{risk.impact}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-1">Mitigation</span>
                        <span className="text-foreground">{risk.mitigation}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-muted-foreground">Owner: {risk.owner}</div>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {/* Executive Summary */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Executive Summary
            </h2>
            <div
              className="bento-card rounded-xl border border-border p-5 space-y-4"
              style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted)) 100%)' }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary">AI-Generated Summary</span>
              </div>
              {executiveSummary ? (
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{executiveSummary}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No summary available for this report.</p>
              )}
            </div>

          </div>
        </div>

        {/* ---- Upcoming Milestones Timeline ---- */}
        {displayMilestones.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Flag className="w-4 h-4 text-primary" />
            Upcoming Milestones
          </h2>
          <div className="bento-card rounded-xl bg-card border border-border p-6">
            <div className="relative">
              <div className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-border" />
              <div className="space-y-6">
                {displayMilestones.map((milestone, i) => {
                  const isCompleted = milestone.status === 'completed';
                  const isCurrent = milestone.status === 'current';
                  return (
                    <div
                      key={milestone.id}
                      className="relative flex items-start gap-4 pl-1"
                      style={{ animation: `timelineSlideIn 0.4s ease-out ${i * 0.08}s both` }}
                    >
                      <div
                        className={`relative z-10 w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 ${
                          isCompleted
                            ? 'bg-success/20 border-2 border-success'
                            : isCurrent
                            ? 'bg-primary/20 border-2 border-primary'
                            : 'bg-muted/50 border-2 border-border'
                        }`}
                        style={isCurrent ? { animation: 'milestoneGlow 2s ease-in-out infinite' } : {}}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        ) : isCurrent ? (
                          <Target className="w-4 h-4 text-primary" />
                        ) : (
                          <Clock className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center gap-3">
                          <h3 className={`text-sm font-semibold ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {milestone.title}
                          </h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isCompleted
                              ? 'bg-success/15 text-success'
                              : isCurrent
                              ? 'bg-primary/15 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {milestone.date}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ---- Keyframes ---- */}
        <style>{`
          @keyframes headerGlow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(241,110,44,0); }
            50% { box-shadow: 0 0 20px 4px rgba(241,110,44,0.15); }
          }
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes cardSlideUp {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes numberFadeIn {
            from { opacity: 0; transform: scale(0.8); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes barFillIn {
            from { width: 0%; }
          }
          @keyframes timelineSlideIn {
            from { opacity: 0; transform: translateX(-12px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes milestoneGlow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(241,110,44,0); }
            50% { box-shadow: 0 0 12px 3px rgba(241,110,44,0.25); }
          }
        `}</style>
      </div>
    </Reveal>
  );
}
