'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Star, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Avatar, StarRating } from './RetroSection';
import { getSentiment, submitSentiment, getSentimentTrend, getMe } from '@/lib/api';
import type { RetroSentimentEntry, SentimentTrendPoint } from '@/lib/api';

interface TeamSentimentProps {
  expanded: boolean;
  onToggle: () => void;
  overallMood: number;
  projectId?: string | null;
  sprintId?: string | null;
  isDemo?: boolean;
}

const AVATAR_COLORS = ['#f16e2c', '#8b5cf6', '#10b981', '#06b6d4', '#ec4899'];

function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';
}

export function TeamSentiment({
  expanded,
  onToggle,
  overallMood: overallMoodProp,
  projectId,
  sprintId,
  isDemo,
}: TeamSentimentProps) {
  const [entries, setEntries] = useState<RetroSentimentEntry[]>([]);
  const [trend, setTrend] = useState<SentimentTrendPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [moodForm, setMoodForm] = useState<{ mood: number; comment: string }>({ mood: 0, comment: '' });
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId || !sprintId || isDemo) return;
    setLoading(true);
    setError(null);
    try {
      const [sentimentRes, trendRes] = await Promise.all([
        getSentiment(projectId, sprintId),
        getSentimentTrend(projectId, 10),
      ]);
      setEntries(sentimentRes ?? []);
      setTrend(trendRes ?? []);
    } catch {
      setEntries([]);
      setTrend([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, sprintId, isDemo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmitMood = useCallback(async () => {
    if (!projectId || !sprintId || isDemo || moodForm.mood < 1 || moodForm.mood > 5) return;
    setSubmitting(true);
    setError(null);
    try {
      const me = await getMe().catch(() => null);
      await submitSentiment(projectId, sprintId, {
        user_name: me?.full_name || 'Anonymous',
        mood: moodForm.mood,
        comment: moodForm.comment.trim() || undefined,
        user_id: me?.id,
      });
      setMoodForm({ mood: 0, comment: '' });
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit mood');
    } finally {
      setSubmitting(false);
    }
  }, [projectId, sprintId, isDemo, moodForm, fetchData]);

  const overallMood =
    entries.length > 0
      ? entries.reduce((sum, e) => sum + e.mood, 0) / entries.length
      : overallMoodProp;

  const teamMoods = entries.map((e, idx) => ({
    id: e.id,
    name: e.user_name || 'Anonymous',
    initials: initialsFromName(e.user_name || 'A'),
    color: AVATAR_COLORS[idx % AVATAR_COLORS.length],
    mood: e.mood,
    role: e.comment ? e.comment.slice(0, 30) + (e.comment.length > 30 ? '…' : '') : '',
  }));

  const moodTrendData = trend.length > 0 ? trend : [];
  const latestInTrend = moodTrendData.length > 0 ? moodTrendData[moodTrendData.length - 1] : null;
  const hasAnomaly = moodTrendData.some((p) => p.anomaly);
  const rollingAvg = moodTrendData.length >= 3
    ? moodTrendData.slice(-3).reduce((s, p) => s + p.avg_mood, 0) / 3
    : null;
  const improvementText =
    moodTrendData.length >= 2 && latestInTrend
      ? `${
          latestInTrend.avg_mood >= (moodTrendData[moodTrendData.length - 2]?.avg_mood ?? 0)
            ? '+'
            : ''
        }${(
          ((latestInTrend.avg_mood - (moodTrendData[moodTrendData.length - 2]?.avg_mood ?? 0)) /
            Math.max(0.01, moodTrendData[moodTrendData.length - 2]?.avg_mood ?? 1)) *
          100
        ).toFixed(0)}% vs previous sprint`
      : null;

  return (
    <div className="px-6 pb-6">
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls="section-sentiment"
        className="flex items-center justify-between w-full mb-4"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-warning/10 border border-warning/20">
            <Star className="w-4 h-4 text-warning" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Team Sentiment</h2>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div
          id="section-sentiment"
          role="region"
          aria-label="Team Sentiment"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Overall Mood */}
          <Card className="bento-card flex flex-col items-center justify-center py-6">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Overall Mood
            </span>
            <div className="text-4xl font-bold text-foreground mb-2">
              {overallMood.toFixed(1)}
            </div>
            <StarRating rating={overallMood} animated />
            <span className="text-xs text-muted-foreground mt-2">out of 5.0</span>
          </Card>

          {/* Individual Moods + Submission Form */}
          <Card className="bento-card">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 block">
              Individual Ratings
            </span>
            {loading && entries.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {teamMoods.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar initials={member.initials} color={member.color} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground truncate">{member.name}</span>
                        <span className="text-xs font-bold text-foreground tabular-nums ml-2">
                          {member.mood}/5
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <StarRating rating={member.mood} />
                        {member.role && (
                          <span className="text-[10px] text-muted-foreground ml-1 truncate">
                            {member.role}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Mood submission form */}
            {!isDemo && projectId && sprintId && (
              <div className="mt-6 pt-4 border-t border-border space-y-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                  Submit your mood
                </span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMoodForm((prev) => ({ ...prev, mood: m }))}
                      className={`p-1.5 rounded-lg transition-all ${
                        moodForm.mood === m
                          ? 'bg-warning/20 border border-warning/40'
                          : 'bg-muted/50 border border-transparent hover:bg-muted'
                      }`}
                      aria-pressed={moodForm.mood === m}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          moodForm.mood >= m ? 'text-warning fill-warning' : 'text-border'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Optional comment..."
                  value={moodForm.comment}
                  onChange={(e) => setMoodForm((prev) => ({ ...prev, comment: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  rows={2}
                />
                {error && (
                  <div className="text-xs text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                  </div>
                )}
                <Button
                  size="sm"
                  onClick={handleSubmitMood}
                  disabled={submitting || moodForm.mood < 1 || moodForm.mood > 5}
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
                  {submitting ? 'Submitting…' : 'Submit'}
                </Button>
              </div>
            )}
          </Card>

          {/* Mood Trend */}
          <Card className="bento-card">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 block">
              Mood Trend
            </span>
            {loading && trend.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : moodTrendData.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                No trend data yet
              </div>
            ) : (
              <>
                <div className="flex items-end gap-4 h-36 px-2">
                  {moodTrendData.map((s, i) => {
                    const heightPct = (s.avg_mood / 5) * 100;
                    const isLatest = i === moodTrendData.length - 1;
                    return (
                      <div
                        key={s.sprint_id + s.sprint_name}
                        className="flex-1 flex flex-col items-center gap-2"
                      >
                        <span
                          className="text-xs font-bold tabular-nums"
                          style={{
                            color: isLatest
                              ? 'var(--primary)'
                              : s.anomaly
                                ? 'var(--destructive)'
                                : 'var(--muted-foreground)',
                          }}
                        >
                          {s.avg_mood.toFixed(1)}
                        </span>
                        <div
                          className="w-full bg-muted rounded-t-md relative"
                          style={{ height: '100px' }}
                        >
                          <div
                            className="absolute bottom-0 left-0 right-0 rounded-t-md transition-all"
                            style={{
                              height: `${heightPct}%`,
                              background: isLatest
                                ? 'linear-gradient(180deg, var(--primary), color-mix(in srgb, var(--primary) 53%, transparent))'
                                : s.anomaly
                                  ? 'linear-gradient(180deg, hsl(var(--destructive)), color-mix(in srgb, hsl(var(--destructive)) 60%, transparent))'
                                  : 'linear-gradient(180deg, hsl(var(--muted)), hsl(var(--accent)))',
                              animation: `retro-bar-grow 0.8s ease-out ${i * 0.15}s both`,
                              boxShadow: isLatest
                                ? '0 0 12px color-mix(in srgb, var(--primary) 30%, transparent)'
                                : 'none',
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate max-w-full">
                          {s.sprint_name || s.sprint_id?.slice(0, 8)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border flex-wrap">
                  {hasAnomaly && (
                    <div className="flex items-center gap-2 text-warning">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span className="text-xs">Mood dip detected — check in with the team</span>
                    </div>
                  )}
                  {improvementText && !hasAnomaly && (
                    <div className="flex items-center gap-2 text-success">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span className="text-xs">{improvementText}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
