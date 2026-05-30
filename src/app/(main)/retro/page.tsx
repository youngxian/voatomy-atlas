'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ThumbsUp,
  AlertTriangle,
  Zap,
  Calendar,
  Clock,
  Users,
  Target,
  TrendingUp,
  MessageSquare,
  RotateCcw,
  Award,
  BarChart3,
  CheckCircle2,
  Layers,
  User,
  PenTool,
  LayoutGrid,
  Presentation,
  ChevronDown,
  Sparkles,
  Loader2,
  Send,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { Card, Badge, Button, EmptyState } from '@/components/ui';
import { RetroIllustration } from '@/components/EmptyIllustrations';
import {
  getRetro,
  getSprints,
  addRetroItem,
  deleteRetroItem,
  voteRetroItem,
  generateRetro,
  publishRetro,
  trackRetroAction,
  markRetroActionComplete,
  type RetroItem as APIRetroItem,
  type Sprint,
} from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { useAuth } from '@/lib/auth';
import { useProjectRole } from '@/hooks/useProjectRole';
import type { RetroItem, ActionItem } from '@/lib/retro-types';
import { wentWell, couldImprove, actionItems } from '@/lib/retro-types';

import { RetroWhiteboard } from '@/components/retro/RetroWhiteboard';
import { RetroSection } from '@/components/retro/RetroSection';
import { TeamSentiment } from '@/components/retro/TeamSentiment';
import { AIInsights } from '@/components/retro/AIInsights';
import { MiroEmbed } from '@/components/retro/MiroEmbed';
import { PreviousRetros } from '@/components/retro/PreviousRetros';

export default function RetroPage() {
  const [retroWentWell, setRetroWentWell] = useState<RetroItem[]>([]);
  const [retroCouldImprove, setRetroCouldImprove] = useState<RetroItem[]>([]);
  const [retroActionItems, setRetroActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiReturnsEmpty, setApiReturnsEmpty] = useState(false);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    well: true, improve: true, actions: true, sentiment: true, insights: true, previous: false,
  });
  const [viewMode, setViewMode] = useState<'board' | 'whiteboard' | 'miro'>('board');

  const { activeProjectId, activeSprint: ctxSprint } = useProject();
  const { isDemo: authDemo } = useAuth();
  const { canEdit: roleCanEdit, canManage: roleCanManage } = useProjectRole(activeProjectId);
  const [activeSprintId, setActiveSprintId] = useState<string | null>(null);
  const [completedSprints, setCompletedSprints] = useState<Sprint[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const [addingCategory, setAddingCategory] = useState<'went_well' | 'to_improve' | 'action_item' | null>(null);
  const [newItemText, setNewItemText] = useState('');
  const [addingInFlight, setAddingInFlight] = useState(false);
  const [votingIds, setVotingIds] = useState<Set<string>>(new Set());
  const [trackIds, setTrackIds] = useState<Set<string>>(new Set());
  const [completeIds, setCompleteIds] = useState<Set<string>>(new Set());
  const [generatingRetro, setGeneratingRetro] = useState(false);
  const [publishingRetro, setPublishingRetro] = useState(false);

  const searchParams = useSearchParams();
  const deepLinkSprintId = useMemo(() => searchParams.get('sprint') ?? null, [searchParams]);

  const colors = ['#f16e2c', '#8b5cf6', '#10b981', '#06b6d4', '#ec4899'];

  const mapItem = useCallback((item: APIRetroItem, idx: number): RetroItem => ({
    id: item.id,
    text: item.content,
    votes: item.votes,
    author: item.author_id || 'Team',
    authorInitials: (item.author_id || 'TM').slice(0, 2).toUpperCase(),
    authorColor: colors[idx % colors.length],
  }), []);

  const loadRetroData = useCallback(async (projectId: string, sprintId: string) => {
    try {
      const items = await getRetro(projectId, sprintId);
      setApiReturnsEmpty(false);
      if (!items || items.length === 0) {
        setRetroWentWell([]);
        setRetroCouldImprove([]);
        setRetroActionItems([]);
        return;
      }
      setRetroWentWell(items.filter(i => i.category === 'went_well').map(mapItem));
      setRetroCouldImprove(items.filter(i => i.category === 'to_improve').map(mapItem));
      setRetroActionItems(items.filter(i => i.category === 'action_item').map((item, idx) => ({
        id: item.id,
        text: item.content,
        owner: item.owner_name || item.author_id || 'Team',
        ownerInitials: (item.owner_name || item.author_id || 'TM').slice(0, 2).toUpperCase(),
        ownerColor: colors[idx % colors.length],
        due: item.due_label || 'TBD',
        votes: item.votes,
        externalTicketId: item.external_ticket_id,
        externalTicketUrl: item.external_ticket_url,
        completed: item.completed ?? false,
      })));
      setIsDemo(false);
    } catch {
      setIsDemo(true);
    }
  }, [mapItem]);

  useEffect(() => {
    if (authDemo) {
      setIsDemo(true);
      setApiReturnsEmpty(false);
      setRetroWentWell(wentWell);
      setRetroCouldImprove(couldImprove);
      setRetroActionItems(actionItems);
      setLoading(false);
      return;
    }
    if (!activeProjectId) {
      setLoading(false);
      return;
    }
    setIsDemo(false);
    setApiReturnsEmpty(false);
    setCompletedSprints([]);
    setRetroWentWell([]);
    setRetroCouldImprove([]);
    setRetroActionItems([]);

    getSprints(activeProjectId)
      .then((sprints) => {
        const completed = sprints.filter((s) => s.status === 'completed');
        setCompletedSprints(completed);

        // Deep-link: if ?sprint=UUID is in URL, use that sprint
        const deepLinked = deepLinkSprintId
          ? sprints.find((s) => s.id === deepLinkSprintId)
          : null;

        const recent =
          deepLinked ||
          (ctxSprint && sprints.find((s) => s.id === ctxSprint.id)) ||
          completed[0] ||
          sprints[0];
        if (!recent) {
          setApiReturnsEmpty(true);
          setLoading(false);
          return;
        }
        setActiveSprintId(recent.id);
      })
      .catch(() => {
        setIsDemo(true);
        setLoading(false);
      });
  }, [activeProjectId, ctxSprint?.id, authDemo, deepLinkSprintId]);

  useEffect(() => {
    if (authDemo || !activeProjectId || !activeSprintId) return;
    setLoading(true);
    loadRetroData(activeProjectId, activeSprintId).finally(() => setLoading(false));
  }, [activeProjectId, activeSprintId, authDemo, loadRetroData]);

  const handleAddItem = useCallback(async () => {
    if (!addingCategory || !newItemText.trim() || !activeProjectId || !activeSprintId) return;
    setAddingInFlight(true);
    try {
      await addRetroItem(activeProjectId, activeSprintId, { category: addingCategory, content: newItemText.trim() });
      await loadRetroData(activeProjectId, activeSprintId);
      setNewItemText('');
      setAddingCategory(null);
    } catch {
      setErrorBanner('Failed to add item. Please try again.');
      setTimeout(() => setErrorBanner(null), 3000);
    } finally {
      setAddingInFlight(false);
    }
  }, [addingCategory, newItemText, activeProjectId, activeSprintId, loadRetroData]);

  const handleVote = useCallback(async (itemId: string) => {
    if (!activeProjectId || !activeSprintId || isDemo) {
      setVotes(prev => ({ ...prev, [itemId]: (prev[itemId] ?? 0) + 1 }));
      return;
    }
    setVotingIds(prev => new Set(prev).add(itemId));
    setVotes(prev => ({ ...prev, [itemId]: (prev[itemId] ?? 0) + 1 }));
    try {
      const result = await voteRetroItem(activeProjectId, activeSprintId, itemId);
      setVotes(prev => {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      });
      const updateVotes = (list: RetroItem[]) => list.map(i => i.id === itemId ? { ...i, votes: result.votes } : i);
      const updateActionVotes = (list: ActionItem[]) => list.map(i => i.id === itemId ? { ...i, votes: result.votes } : i);
      setRetroWentWell(updateVotes);
      setRetroCouldImprove(updateVotes);
      setRetroActionItems(updateActionVotes);
    } catch {
      setVotes(prev => ({ ...prev, [itemId]: Math.max(0, (prev[itemId] ?? 1) - 1) }));
    } finally {
      setVotingIds(prev => { const s = new Set(prev); s.delete(itemId); return s; });
    }
  }, [activeProjectId, activeSprintId, isDemo]);

  const handleDelete = useCallback(async (itemId: string) => {
    if (!confirm('Delete this retro item?')) return;
    if (!activeProjectId || !activeSprintId) return;
    try {
      await deleteRetroItem(activeProjectId, activeSprintId, itemId);
      setRetroWentWell(prev => prev.filter(i => i.id !== itemId));
      setRetroCouldImprove(prev => prev.filter(i => i.id !== itemId));
      setRetroActionItems(prev => prev.filter(i => i.id !== itemId));
    } catch {
      setErrorBanner('Failed to delete item. Please try again.');
      setTimeout(() => setErrorBanner(null), 3000);
    }
  }, [activeProjectId, activeSprintId]);

  const handleTrackAction = useCallback(async (itemId: string) => {
    if (!activeProjectId || !activeSprintId || isDemo) return;
    setTrackIds((prev) => new Set(prev).add(itemId));
    try {
      const updated = await trackRetroAction(activeProjectId, activeSprintId, itemId);
      setRetroActionItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                externalTicketId: updated.external_ticket_id,
                externalTicketUrl: updated.external_ticket_url,
              }
            : i
        )
      );
    } catch {
      setErrorBanner('Failed to create ticket. Please try again.');
      setTimeout(() => setErrorBanner(null), 3000);
    } finally {
      setTrackIds((prev) => {
        const s = new Set(prev);
        s.delete(itemId);
        return s;
      });
    }
  }, [activeProjectId, activeSprintId, isDemo]);

  const handleMarkComplete = useCallback(async (itemId: string) => {
    if (!activeProjectId || !activeSprintId || isDemo) return;
    setCompleteIds((prev) => new Set(prev).add(itemId));
    try {
      await markRetroActionComplete(activeProjectId, activeSprintId, itemId);
      setRetroActionItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, completed: true } : i))
      );
    } catch {
      setErrorBanner('Failed to mark complete. Please try again.');
      setTimeout(() => setErrorBanner(null), 3000);
    } finally {
      setCompleteIds((prev) => {
        const s = new Set(prev);
        s.delete(itemId);
        return s;
      });
    }
  }, [activeProjectId, activeSprintId, isDemo]);

  const handleGenerateRetro = useCallback(async () => {
    if (!activeProjectId || !activeSprintId || isDemo) return;
    setGeneratingRetro(true);
    try {
      await generateRetro(activeProjectId, activeSprintId);
      await loadRetroData(activeProjectId, activeSprintId);
    } catch {
      setErrorBanner('Failed to generate retro. Please try again.');
      setTimeout(() => setErrorBanner(null), 3000);
    } finally {
      setGeneratingRetro(false);
    }
  }, [activeProjectId, activeSprintId, isDemo, loadRetroData]);

  const handlePublishRetro = useCallback(async () => {
    if (!activeProjectId || !activeSprintId || isDemo) return;
    setPublishingRetro(true);
    try {
      await publishRetro(activeProjectId, activeSprintId);
      setErrorBanner(null);
      // Could show success toast - for now clear any prior error
    } catch {
      setErrorBanner('Failed to publish to board. Please try again.');
      setTimeout(() => setErrorBanner(null), 3000);
    } finally {
      setPublishingRetro(false);
    }
  }, [activeProjectId, activeSprintId, isDemo]);

  const getVotes = (id: string, base: number) => (votes[id] ?? 0) + base;
  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const canEdit = !!activeProjectId && !!activeSprintId && !isDemo && roleCanEdit;
  const overallMood = 4.2;

  const displaySprint = completedSprints.find((s) => s.id === activeSprintId) || ctxSprint;
  const sprintLabel = displaySprint?.name ?? 'Sprint';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (apiReturnsEmpty) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No retrospective data yet"
        description="Retrospectives will appear here after your team completes a sprint. Run your first sprint to start capturing what went well and what can improve."
        actionLabel="Start Sprint"
        illustration={<RetroIllustration className="w-[220px] h-[176px]" />}
      />
    );
  }

  const cancelAdd = () => { setAddingCategory(null); setNewItemText(''); };

  const sectionShared = {
    newItemText,
    onNewItemTextChange: setNewItemText,
    onAdd: handleAddItem,
    onCancelAdd: cancelAdd,
    addingInFlight,
    addingCategory,
    canEdit,
    onVote: handleVote,
    onDelete: handleDelete,
    onTrackAction: handleTrackAction,
    onMarkComplete: handleMarkComplete,
    getVotes,
    votingIds,
    trackIds,
    completeIds,
  };

  return (
    <>
      <div className="min-h-screen bg-muted pb-20">
        {errorBanner && (
          <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-destructive/15 border border-destructive/30 rounded-lg text-sm text-destructive animate-in fade-in">
            {errorBanner}
          </div>
        )}
        {isDemo && (
          <div className="mx-6 mt-2 px-3 py-1.5 bg-warning/10 border border-warning/20 rounded-lg text-xs text-warning flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" /> Demo mode — showing sample data. Connect your project to persist changes.
          </div>
        )}

        {/* Header */}
        <Reveal>
          <div className="px-6 pt-8 pb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 12%, transparent), color-mix(in srgb, var(--primary) 3%, transparent))',
                    border: '1px solid color-mix(in srgb, var(--primary) 19%, transparent)',
                    animation: 'retro-pulse-glow 3s ease-in-out infinite',
                  }}
                >
                  <RotateCcw className="w-6 h-6 text-primary" style={{ animation: 'retro-spin-slow 8s linear infinite' }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{sprintLabel} Retrospective</h1>
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    {displaySprint?.start_date && (
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(displaySprint.start_date).toLocaleDateString()}
                        {displaySprint.end_date &&
                          ` – ${new Date(displaySprint.end_date).toLocaleDateString()}`}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <User className="w-3.5 h-3.5" /> Facilitator
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" /> Retro
                    </span>
                    {retroActionItems.length > 0 && (
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Users className="w-3.5 h-3.5" /> {retroActionItems.length} action
                        {retroActionItems.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {completedSprints.length > 1 && (
                  <div className="relative">
                    <select
                      value={activeSprintId ?? ''}
                      onChange={(e) => setActiveSprintId(e.target.value || null)}
                      className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {completedSprints.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                )}
                <div className="flex items-center rounded-lg bg-card border border-border p-0.5">
                  <button
                    onClick={() => setViewMode('board')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${viewMode === 'board' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" /> Board
                  </button>
                  <button
                    onClick={() => setViewMode('whiteboard')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${viewMode === 'whiteboard' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <PenTool className="w-3.5 h-3.5" /> Whiteboard
                  </button>
                  <button
                    onClick={() => setViewMode('miro')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${viewMode === 'miro' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Presentation className="w-3.5 h-3.5" /> Miro
                  </button>
                </div>
                {!isDemo && activeProjectId && activeSprintId && roleCanManage && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleGenerateRetro}
                      disabled={generatingRetro}
                    >
                      {generatingRetro ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      Auto-Generate
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handlePublishRetro}
                      disabled={publishingRetro}
                    >
                      {publishingRetro ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      Publish
                    </Button>
                  </>
                )}
                <Badge variant="success">Completed</Badge>
                <Button variant="secondary" size="sm">
                  <MessageSquare className="w-3.5 h-3.5" /> Export Notes
                </Button>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Whiteboard View */}
        {viewMode === 'whiteboard' && (
          <Reveal delay={0.1}>
            <div className="px-6 pb-6">
              <RetroWhiteboard />
            </div>
          </Reveal>
        )}

        {/* Miro Board View */}
        {viewMode === 'miro' && (
          <Reveal delay={0.1}>
            <div className="px-6 pb-6">
              <MiroEmbed projectId={activeProjectId} sprintId={activeSprintId} />
            </div>
          </Reveal>
        )}

        {/* Board View */}
        {viewMode === 'board' && (<>

        {/* Sprint Summary Bar */}
        <Reveal delay={0.1}>
          <div className="px-6 pb-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Delivered', value: '41/48', unit: 'pts', icon: Target, color: '#10b981', pct: 85 },
                { label: 'Accuracy', value: '76', unit: '%', icon: BarChart3, color: '#f16e2c', pct: 76 },
                { label: 'Velocity Trend', value: '+3', unit: '%', icon: TrendingUp, color: '#06b6d4', pct: 65 },
                { label: 'Carry-over', value: '2', unit: 'tickets', icon: Layers, color: '#8b5cf6', pct: 15 },
              ].map((stat, i) => (
                <Card key={stat.label} className="bento-card relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                    <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                    <span className="text-xs text-muted-foreground">{stat.unit}</span>
                  </div>
                  <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${stat.pct}%`,
                        backgroundColor: stat.color,
                        animation: 'retro-bar-grow 1s ease-out both',
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  </div>
                  <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10" style={{ background: `radial-gradient(circle, ${stat.color}, transparent)` }} />
                </Card>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Retro Board — 3 columns using unified RetroSection */}
        <Reveal delay={0.2}>
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <RetroSection
                title="What Went Well"
                icon={ThumbsUp}
                accentColor="success"
                accentVar="success"
                expanded={expandedSections.well}
                onToggle={() => toggleSection('well')}
                category="went_well"
                items={retroWentWell}
                onStartAdd={() => setAddingCategory('went_well')}
                placeholder="What went well this sprint?"
                {...sectionShared}
              />
              <RetroSection
                title="What Could Improve"
                icon={AlertTriangle}
                accentColor="warning"
                accentVar="warning"
                expanded={expandedSections.improve}
                onToggle={() => toggleSection('improve')}
                category="to_improve"
                items={retroCouldImprove}
                onStartAdd={() => setAddingCategory('to_improve')}
                placeholder="What could be improved?"
                {...sectionShared}
              />
              <RetroSection
                title="Action Items"
                icon={Zap}
                accentColor="primary"
                accentVar="primary"
                expanded={expandedSections.actions}
                onToggle={() => toggleSection('actions')}
                category="action_item"
                items={[]}
                actionItems={retroActionItems}
                onStartAdd={() => setAddingCategory('action_item')}
                placeholder="What action should we take?"
                {...sectionShared}
              />
            </div>
          </div>
        </Reveal>

        {/* Team Sentiment */}
        <Reveal delay={0.3}>
          <TeamSentiment
            expanded={expandedSections.sentiment}
            onToggle={() => toggleSection('sentiment')}
            overallMood={overallMood}
            projectId={activeProjectId}
            sprintId={activeSprintId}
            isDemo={isDemo}
          />
        </Reveal>

        {/* ATLAS AI Insights */}
        <Reveal delay={0.4}>
          <AIInsights
            expanded={expandedSections.insights}
            onToggle={() => toggleSection('insights')}
            projectId={activeProjectId}
            sprintId={activeSprintId}
            isDemo={isDemo}
          />
        </Reveal>

        {/* Previous Retrospectives */}
        <Reveal delay={0.5}>
          <PreviousRetros
            expanded={expandedSections.previous}
            onToggle={() => toggleSection('previous')}
            completedSprints={completedSprints}
            activeSprintId={activeSprintId}
            onSelectSprint={setActiveSprintId}
            isDemo={isDemo}
          />
        </Reveal>

        {/* Footer */}
        <Reveal delay={0.6}>
          <div className="px-6">
            <div className="bento-card rounded-xl bg-card border border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <div>
                  <span className="text-sm font-medium text-foreground">Retrospective Complete</span>
                  <span className="text-xs text-muted-foreground ml-2">4 action items assigned</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm">
                  <Award className="w-3.5 h-3.5" /> View Sprint 25 Plan
                </Button>
              </div>
            </div>
          </div>
        </Reveal>

        </>)}
      </div>
    </>
  );
}
