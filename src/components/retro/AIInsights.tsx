'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Zap,
  Bot,
  Loader2,
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { aiInsights } from '@/lib/retro-types';
import { generateRetro, getRetroSummary, type RetroSummary } from '@/lib/api';

type InsightType = 'positive' | 'warning' | 'info' | 'action';

interface AIInsight {
  text: string;
  type: InsightType;
}

interface AIInsightsProps {
  expanded: boolean;
  onToggle: () => void;
  projectId?: string | null;
  sprintId?: string | null;
  isDemo?: boolean;
}

const INSIGHT_ICONS = {
  positive: <TrendingUp className="w-4 h-4 text-success shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />,
  info: <BarChart3 className="w-4 h-4 text-primary shrink-0 mt-0.5" />,
  action: <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />,
} as const;

const INSIGHT_BORDER = {
  positive: 'border-success/20',
  warning: 'border-warning/20',
  info: 'border-primary/20',
  action: 'border-primary/20',
} as const;

function summaryToInsights(summary: RetroSummary): AIInsight[] {
  const insights: AIInsight[] = [];
  const { went_well, could_improve, action_items, themes, highlights } = summary.summary;

  went_well.slice(0, 2).forEach((text) => {
    if (text) insights.push({ text, type: 'positive' });
  });
  could_improve.slice(0, 2).forEach((text) => {
    if (text) insights.push({ text, type: 'warning' });
  });
  action_items.slice(0, 2).forEach((text) => {
    if (text) insights.push({ text, type: 'action' });
  });
  themes.slice(0, 1).forEach((text) => {
    if (text) insights.push({ text, type: 'info' });
  });

  if (insights.length === 0 && highlights) {
    const h = highlights;
    if (h.accuracy_pct > 0) {
      insights.push({
        text: `Sprint accuracy: ${h.accuracy_pct.toFixed(1)}%. Delivered ${h.velocity_delivered}/${h.velocity_planned} points.`,
        type: 'info',
      });
    }
  }

  return insights;
}

export function AIInsights({ expanded, onToggle, projectId, sprintId, isDemo }: AIInsightsProps) {
  const [summary, setSummary] = useState<RetroSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!projectId || !sprintId || isDemo) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getRetroSummary(projectId, sprintId);
      setSummary(data);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, sprintId, isDemo]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleGenerate = useCallback(async () => {
    if (!projectId || !sprintId || isDemo) return;
    setGenerating(true);
    setError(null);
    try {
      const data = await generateRetro(projectId, sprintId);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setGenerating(false);
    }
  }, [projectId, sprintId, isDemo]);

  const displayInsights: AIInsight[] =
    summary != null ? summaryToInsights(summary) : (aiInsights as AIInsight[]);

  const highlights = summary?.summary?.highlights;

  return (
    <div className="px-6 pb-6">
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls="section-insights"
        className="flex items-center justify-between w-full mb-4"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, transparent), color-mix(in srgb, var(--primary) 2%, transparent))',
              border: '1px solid color-mix(in srgb, var(--primary) 15%, transparent)',
            }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">ATLAS AI Insights</h2>
            <Badge variant="orange">AI</Badge>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div
          id="section-insights"
          role="region"
          aria-label="ATLAS AI Insights"
          className="rounded-xl border border-primary/15 overflow-hidden"
          style={{ animation: 'retro-insight-glow 4s ease-in-out infinite' }}
        >
          <div className="p-1">
            <div
              className="h-0.5 rounded-full mb-4 mx-3 mt-3"
              style={{
                background:
                  'linear-gradient(90deg, transparent, var(--primary), transparent)',
                backgroundSize: '200% 100%',
                animation: 'retro-shimmer 3s ease-in-out infinite',
              }}
            />
            <div className="px-3 pb-3 space-y-3">
              {!isDemo && projectId && sprintId && (
                <div className="flex items-center gap-2 mb-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={generating}
                    className="gap-2"
                  >
                    {generating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    )}
                    {generating ? 'Generating…' : 'Generate Insights'}
                  </Button>
                  {loading && !summary && (
                    <span className="text-xs text-muted-foreground">Loading…</span>
                  )}
                </div>
              )}
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  {error}
                </div>
              )}
              {highlights && (
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                  <div>
                    <span className="text-xs text-muted-foreground">Accuracy</span>
                    <p className="text-sm font-medium">{highlights.accuracy_pct.toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Velocity</span>
                    <p className="text-sm font-medium">
                      {highlights.velocity_delivered}/{highlights.velocity_planned} pts
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Carry-over</span>
                    <p className="text-sm font-medium">{highlights.carry_over_count} tickets</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Debt Score</span>
                    <p className="text-sm font-medium">{highlights.debt_score}</p>
                  </div>
                </div>
              )}
              <div className="space-y-3">
                {displayInsights.map((insight, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-lg bg-card/80 border ${INSIGHT_BORDER[insight.type]}`}
                    style={{ animation: `retro-fade-in-up 0.4s ease-out ${i * 0.1}s both` }}
                  >
                    {INSIGHT_ICONS[insight.type]}
                    <div className="flex-1">
                      <p className="text-sm text-foreground leading-relaxed">{insight.text}</p>
                    </div>
                    <Bot className="w-3.5 h-3.5 text-primary/40 shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
