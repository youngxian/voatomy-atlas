'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Zap,
  AlertTriangle,
  Brain,
  Lightbulb,
  TrendingUp,
  Shield,
  Eye,
  ChevronRight,
  Filter,
  Activity,
  Clock,
  Radar,
  Sparkles,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { EmptyState } from '@/components/ui';
import { NexusIllustration } from '@/components/EmptyIllustrations';
import * as atlas from '@/lib/api';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SignalType = 'anomaly' | 'pattern' | 'recommendation' | 'alert' | 'insight';
type SignalSeverity = 'critical' | 'high' | 'medium' | 'low';

interface FeedItem {
  id: string;
  type: SignalType;
  severity: SignalSeverity;
  title: string;
  description: string;
  confidence: number;
  timestamp: string;
  affectedItems: string[];
  source: string;
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const feedItems: FeedItem[] = [
  {
    id: 's1', type: 'anomaly', severity: 'critical',
    title: 'Velocity Anomaly Detected',
    description: 'Sprint velocity dropped 34% compared to 5-sprint rolling average. Correlated with 3 blocked tickets in payments module.',
    confidence: 94, timestamp: '2 min ago',
    affectedItems: ['COMP-217', 'COMP-218', 'COMP-220'], source: 'ATLAS',
  },
  {
    id: 's2', type: 'alert', severity: 'critical',
    title: '$86K ARR Account at Churn Risk',
    description: 'Pinnacle Corp showing 89% churn probability. Billing module instability causing repeated payment failures over 14 days.',
    confidence: 89, timestamp: '8 min ago',
    affectedItems: ['COMP-112', 'COMP-114'], source: 'LOOP',
  },
  {
    id: 's3', type: 'recommendation', severity: 'high',
    title: 'Reprioritize Auth Timeout Fix',
    description: 'SSO timeout bug (COMP-203) is blocking 3 enterprise accounts. Recommend moving to top of Sprint 25 backlog.',
    confidence: 87, timestamp: '15 min ago',
    affectedItems: ['COMP-203', 'COMP-204'], source: 'SIGNAL',
  },
  {
    id: 's4', type: 'pattern', severity: 'medium',
    title: 'Recurring Estimation Drift',
    description: 'Backend team consistently over-estimates by 22% on API integration tasks. Pattern observed across last 4 sprints.',
    confidence: 82, timestamp: '23 min ago',
    affectedItems: ['Sprint 22', 'Sprint 23', 'Sprint 24', 'Sprint 25'], source: 'ATLAS',
  },
  {
    id: 's5', type: 'insight', severity: 'low',
    title: 'Code Review Bottleneck',
    description: 'Average PR review time increased to 18h. 67% of open PRs are waiting on 2 senior reviewers.',
    confidence: 78, timestamp: '34 min ago',
    affectedItems: ['PR-441', 'PR-443', 'PR-445', 'PR-447'], source: 'PHANTOM',
  },
  {
    id: 's6', type: 'anomaly', severity: 'critical',
    title: 'Deployment Failure Spike',
    description: 'CI/CD pipeline failure rate increased from 5% to 23% in the last 48 hours. Root cause traced to flaky integration tests.',
    confidence: 91, timestamp: '41 min ago',
    affectedItems: ['Pipeline #892', 'Pipeline #894', 'Pipeline #896'], source: 'PHANTOM',
  },
  {
    id: 's7', type: 'recommendation', severity: 'high',
    title: 'Split Epic COMP-180',
    description: 'Epic "Payment Gateway v2" is too large for a single sprint. AI recommends splitting into 3 smaller deliverables.',
    confidence: 85, timestamp: '1h ago',
    affectedItems: ['COMP-180'], source: 'ATLAS',
  },
  {
    id: 's8', type: 'pattern', severity: 'medium',
    title: 'Friday Velocity Drop-off',
    description: 'Team completes 40% fewer story points on Fridays vs other days. Suggest front-loading critical work earlier in the week.',
    confidence: 76, timestamp: '1h ago',
    affectedItems: ['Sprint 24', 'Sprint 25'], source: 'ATLAS',
  },
  {
    id: 's9', type: 'alert', severity: 'high',
    title: 'Dependency Risk: Mobile Login',
    description: 'Mobile app login flow blocked by backend auth service. Cross-team dependency unresolved for 5 days.',
    confidence: 92, timestamp: '2h ago',
    affectedItems: ['COMP-155', 'MOB-089'], source: 'SIGNAL',
  },
  {
    id: 's10', type: 'insight', severity: 'low',
    title: 'Team Mood Signal Positive',
    description: 'Standup sentiment analysis shows 15% improvement in team confidence compared to last sprint. Correlated with clearer acceptance criteria.',
    confidence: 71, timestamp: '2h ago',
    affectedItems: ['Sprint 25'], source: 'LOOP',
  },
  {
    id: 's11', type: 'anomaly', severity: 'medium',
    title: 'Scope Creep Detected',
    description: 'Sprint 25 scope increased by 12 story points since planning. 4 unplanned tickets added mid-sprint.',
    confidence: 88, timestamp: '3h ago',
    affectedItems: ['COMP-225', 'COMP-226', 'COMP-227', 'COMP-228'], source: 'ATLAS',
  },
  {
    id: 's12', type: 'recommendation', severity: 'medium',
    title: 'Automate Regression Suite',
    description: 'Manual QA is consuming 30% of sprint capacity. Automating top 20 regression tests could save 8 pts/sprint.',
    confidence: 74, timestamp: '4h ago',
    affectedItems: ['QA-Backlog'], source: 'PHANTOM',
  },
];

const signalSummary = { total: 23, critical: 3, actionable: 8, informational: 12 };

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function signalTypeConfig(type: SignalType) {
  switch (type) {
    case 'anomaly':
      return { label: 'Anomaly', icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/15', border: 'border-destructive/20' };
    case 'pattern':
      return { label: 'Pattern', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/15', border: 'border-primary/20' };
    case 'recommendation':
      return { label: 'Recommendation', icon: Lightbulb, color: 'text-warning', bg: 'bg-warning/15', border: 'border-warning/20' };
    case 'alert':
      return { label: 'Alert', icon: Shield, color: 'text-warning', bg: 'bg-warning/15', border: 'border-warning/20' };
    case 'insight':
      return { label: 'Insight', icon: Brain, color: 'text-primary', bg: 'bg-primary/15', border: 'border-primary/20' };
  }
}

function severityDot(severity: SignalSeverity) {
  switch (severity) {
    case 'critical': return 'bg-destructive';
    case 'high': return 'bg-warning';
    case 'medium': return 'bg-warning';
    case 'low': return 'bg-primary';
  }
}

function confidenceColor(pct: number) {
  if (pct >= 85) return 'text-success';
  if (pct >= 70) return 'text-warning';
  return 'text-destructive';
}

type FilterOption = 'all' | 'critical' | 'recommendations' | 'anomalies' | 'patterns' | 'insights' | 'alerts';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function NexusPage() {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [apiFeed, setApiFeed] = useState<atlas.NexusFeedItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    atlas.getMe()
      .then(me => atlas.getNexusFeed(me.org_id))
      .then(setApiFeed)
      .catch((err) => console.error('Failed to load nexus feed', err))
      .finally(() => setLoading(false));
  }, []);

  const handleDismiss = useCallback((itemId: string) => {
    atlas.dismissNexusFeedItem(itemId)
      .then(() => {
        setApiFeed(prev => prev ? prev.filter(item => item.id !== itemId) : prev);
      })
      .catch((err) => console.error('Failed to dismiss nexus item', err));
  }, []);

  const isEmpty = !loading && apiFeed !== null && apiFeed.length === 0;

  const displayItems: FeedItem[] = apiFeed && apiFeed.length > 0
    ? apiFeed.map(item => ({
        id: item.id,
        type: (item.type as SignalType) || 'insight',
        severity: (item.severity as SignalSeverity) || 'low',
        title: item.title,
        description: item.description,
        confidence: (item.metadata?.confidence as number) ?? 75,
        timestamp: new Date(item.created_at).toLocaleString(),
        affectedItems: (item.metadata?.affected as string[]) ?? [],
        source: item.source,
      }))
    : feedItems;

  const summary = {
    total: displayItems.length,
    critical: displayItems.filter(f => f.severity === 'critical').length,
    actionable: displayItems.filter(f => f.type === 'recommendation' || f.type === 'alert').length,
    informational: displayItems.filter(f => f.type === 'insight' || f.type === 'pattern').length,
  };

  const filters: { id: FilterOption; label: string; count?: number }[] = [
    { id: 'all', label: 'All', count: displayItems.length },
    { id: 'critical', label: 'Critical', count: displayItems.filter(f => f.severity === 'critical').length },
    { id: 'recommendations', label: 'Recommendations', count: displayItems.filter(f => f.type === 'recommendation').length },
    { id: 'anomalies', label: 'Anomalies', count: displayItems.filter(f => f.type === 'anomaly').length },
    { id: 'patterns', label: 'Patterns', count: displayItems.filter(f => f.type === 'pattern').length },
    { id: 'alerts', label: 'Alerts', count: displayItems.filter(f => f.type === 'alert').length },
    { id: 'insights', label: 'Insights', count: displayItems.filter(f => f.type === 'insight').length },
  ];

  const filteredItems = displayItems.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'critical') return item.severity === 'critical';
    if (activeFilter === 'recommendations') return item.type === 'recommendation';
    if (activeFilter === 'anomalies') return item.type === 'anomaly';
    if (activeFilter === 'patterns') return item.type === 'pattern';
    if (activeFilter === 'alerts') return item.type === 'alert';
    if (activeFilter === 'insights') return item.type === 'insight';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-warning border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        icon={Radar}
        title="No intelligence signals yet"
        description="NEXUS continuously analyzes signals from ATLAS, LOOP, SIGNAL, and PHANTOM. Signals will appear here once your integrations are active."
        actionLabel="Configure Integrations"
        illustration={<NexusIllustration className="w-[220px] h-[176px]" />}
      />
    );
  }

  return (
    <Reveal>
      <div className="space-y-6">
        {/* ---- Scanning Indicator ---- */}
        <div
          className="rounded-xl border border-border overflow-hidden relative bg-muted"
        >
          <div
            className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-warning/5 to-transparent"
            style={{ animation: 'shimmerScan 3s ease-in-out infinite' }}
          />
          <div className="relative z-10 px-6 py-4 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl bg-warning/8 border border-warning/12 flex items-center justify-center"
              style={{ animation: 'radarSpin 4s linear infinite' }}
            >
              <Radar className="w-5 h-5 text-warning" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">NEXUS AI Engine Active</span>
                <span className="w-2 h-2 rounded-full bg-success" style={{ animation: 'dotBlink 1.5s ease-in-out infinite' }} />
                <span className="text-xs text-success">Scanning</span>
              </div>
              <p className="text-xs text-muted-foreground">Continuously analyzing signals from ATLAS, LOOP, SIGNAL, and PHANTOM</p>
            </div>
            <div className="hidden lg:flex items-center gap-4 text-xs">
              <span className="text-muted-foreground">Last scan: <span className="text-foreground">12s ago</span></span>
              <span className="text-muted-foreground">Sources: <span className="text-warning">4 active</span></span>
            </div>
          </div>
          <div className="h-[2px] w-full bg-border">
            <div
              className="h-full bg-gradient-to-r from-transparent via-warning to-transparent"
              style={{ width: '30%', animation: 'progressShimmer 2s ease-in-out infinite' }}
            />
          </div>
        </div>

        {/* ---- Page Header ---- */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-warning/8 border border-warning/12 flex items-center justify-center">
            <Zap className="w-6 h-6 text-warning" />
          </div>
          <div>
            <h1
              className="text-3xl font-extrabold text-foreground"
              style={{ animation: 'fadeSlideIn 0.6s ease-out forwards' }}
            >
              NEXUS <span className="text-muted-foreground font-normal text-xl">Intelligence Feed</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Real-time AI signals across all Voatomy products</p>
          </div>
        </div>

        {/* ---- Signal Summary ---- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className="bento-card rounded-xl bg-muted border border-border p-5 space-y-2"
            style={{ animation: 'cardSlideUp 0.4s ease-out 0s both' }}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-warning" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Signals</span>
            </div>
            <span className="text-4xl font-extrabold text-foreground">{summary.total}</span>
            <p className="text-xs text-muted-foreground">in the last 24 hours</p>
          </div>
          <div
            className="bento-card rounded-xl bg-muted border border-destructive/20 p-5 space-y-2"
            style={{ animation: 'cardSlideUp 0.4s ease-out 0.06s both' }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Critical</span>
            </div>
            <span
              className="text-4xl font-extrabold text-destructive"
              style={{ animation: 'numberPulse 2s ease-in-out infinite' }}
            >
              {summary.critical}
            </span>
            <p className="text-xs text-destructive/70">Requires immediate attention</p>
          </div>
          <div
            className="bento-card rounded-xl bg-muted border border-warning/20 p-5 space-y-2"
            style={{ animation: 'cardSlideUp 0.4s ease-out 0.12s both' }}
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-warning" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actionable</span>
            </div>
            <span className="text-4xl font-extrabold text-warning">{summary.actionable}</span>
            <p className="text-xs text-muted-foreground">Recommended actions available</p>
          </div>
          <div
            className="bento-card rounded-xl bg-muted border border-border p-5 space-y-2"
            style={{ animation: 'cardSlideUp 0.4s ease-out 0.18s both' }}
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Informational</span>
            </div>
            <span className="text-4xl font-extrabold text-primary">{summary.informational}</span>
            <p className="text-xs text-muted-foreground">Insights and patterns</p>
          </div>
        </div>

        {/* ---- Filter Pills ---- */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                activeFilter === filter.id
                  ? 'bg-warning/15 border-warning/30 text-warning'
                  : 'bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {filter.label}
              {filter.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeFilter === filter.id ? 'bg-warning/25' : 'bg-border'
                }`}>
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ---- Feed Items ---- */}
        <div className="space-y-3">
          {filteredItems.map((item, i) => {
            const config = signalTypeConfig(item.type);
            const Icon = config.icon;
            return (
              <div
                key={item.id}
                className="bento-card group rounded-xl bg-muted border border-border p-5 space-y-3 transition-all duration-300"
                style={{ animation: `cardSlideUp 0.3s ease-out ${i * 0.04}s both` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${config.bg} ${config.color} ${config.border}`}>
                          {config.label}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${severityDot(item.severity)}`} />
                        <span className="text-[10px] text-muted-foreground uppercase font-medium">{item.severity}</span>
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {item.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{item.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pl-[52px]">
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Confidence:</span>
                      <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.confidence >= 85 ? 'bg-success' : item.confidence >= 70 ? 'bg-warning' : 'bg-destructive'}`}
                          style={{ width: `${item.confidence}%` }}
                        />
                      </div>
                      <span className={`font-bold ${confidenceColor(item.confidence)}`}>{item.confidence}%</span>
                    </div>
                    <div className="hidden md:flex items-center gap-1.5">
                      <span className="text-muted-foreground">Affected:</span>
                      {item.affectedItems.slice(0, 3).map((ai) => (
                        <span key={ai} className="px-1.5 py-0.5 rounded bg-border text-muted-foreground text-[10px] font-mono">
                          {ai}
                        </span>
                      ))}
                      {item.affectedItems.length > 3 && (
                        <span className="text-muted-foreground text-[10px]">+{item.affectedItems.length - 3}</span>
                      )}
                    </div>
                    <span className="hidden lg:inline-flex items-center gap-1 text-muted-foreground">
                      <Sparkles className="w-3 h-3 text-warning" />
                      {item.source}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDismiss(item.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-warning/15 text-warning border border-warning/20 hover:bg-warning/25 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Dismiss
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ---- Keyframes ---- */}
        <style>{`
          @keyframes shimmerScan {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
          @keyframes radarSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes dotBlink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
          @keyframes progressShimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(400%); }
          }
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes cardSlideUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes numberPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}</style>
      </div>
    </Reveal>
  );
}
