'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  GripVertical,
  ExternalLink,
  User,
  Tag,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  Layers,
  Loader2,
  Square,
  X,
  ChevronDown,
  Brain,
  Shield,
  Zap,
  TrendingDown,
  Sparkles,
  Activity,
  Eye,
  Archive,
  Clock,
  AlertCircle,
  ChevronRight,
  Lightbulb,
  Bookmark,
  BookmarkPlus,
  Trash2,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BacklogIllustration } from '@/components/EmptyIllustrations';
import { Card, Badge, Button, EmptyState } from '@/components/ui';
import { Reveal } from '@/components/Reveal';
import TipBanner, { TIPS } from '@/components/TipBanner';
import {
  getBacklog,
  getBacklogHealth,
  getBacklogInsights,
  rankBacklogTicket,
  bulkUpdateTickets,
  estimateTickets,
  type Ticket as APITicket,
  type BacklogHealth,
  type BacklogInsight,
} from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { useTeamMembers } from '@/lib/queries';
import { AssigneeAvatarStack } from '@/components/AssigneeAvatarStack';
import { useBoardColumnLabels } from '@/hooks/useBoardColumnLabels';
import { useSavedFilters, type SavedFilter } from '@/hooks/useSavedFilters';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface BacklogItem {
  id: string;
  title: string;
  priority: string;
  points: number;
  assignee: string;
  assignee_id?: string;
  assignee_ids?: string[];
  labels: string[];
  sprint: string;
  age: number;
  status: 'ready' | 'draft' | 'blocked' | 'in_progress';
  atlasStatus?: string;
  module: string;
}

const priorityConfig: Record<string, { color: string; bg: string; border: string; badge: 'danger' | 'warning' | 'info' | 'muted' }> = {
  P0: { color: 'text-destructive', bg: 'bg-destructive/15', border: 'border-destructive/30', badge: 'danger' },
  P1: { color: 'text-warning', bg: 'bg-warning/15', border: 'border-warning/30', badge: 'warning' },
  P2: { color: 'text-primary', bg: 'bg-primary/15', border: 'border-primary/30', badge: 'info' },
  P3: { color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', badge: 'muted' },
};

const statusConfig: Record<string, { color: string; label: string; animate: boolean }> = {
  ready: { color: 'bg-success', label: 'Ready', animate: false },
  draft: { color: 'bg-muted-foreground', label: 'Draft', animate: false },
  blocked: { color: 'bg-destructive', label: 'Blocked', animate: true },
  in_progress: { color: 'bg-primary', label: 'In Progress', animate: true },
};

const assigneeColors: Record<string, string> = {
  'Alex Chen': '#f97316',
  'Sarah Kim': '#0ea5e9',
  'Jordan Lee': '#8b5cf6',
  'Priya Patel': '#10b981',
  'Marcus Wright': '#eab308',
};

const assigneeInitials: Record<string, string> = {
  'Alex Chen': 'AC',
  'Sarah Kim': 'SK',
  'Jordan Lee': 'JL',
  'Priya Patel': 'PP',
  'Marcus Wright': 'MW',
};

const labelColors: Record<string, string> = {
  payments: 'bg-destructive/20 text-destructive border-destructive/30',
  'critical-path': 'bg-warning/20 text-warning border-warning/30',
  auth: 'bg-primary/20 text-primary border-primary/30',
  bug: 'bg-destructive/20 text-destructive border-destructive/30',
  users: 'bg-primary/20 text-primary border-primary/30',
  feature: 'bg-primary/20 text-primary border-primary/30',
  performance: 'bg-warning/20 text-warning border-warning/30',
  enterprise: 'bg-primary/20 text-primary border-primary/30',
  notifications: 'bg-success/20 text-success border-success/30',
  ui: 'bg-primary/20 text-primary border-primary/30',
  mobile: 'bg-primary/20 text-primary border-primary/30',
  search: 'bg-warning/20 text-warning border-warning/30',
  api: 'bg-success/20 text-success border-success/30',
  onboarding: 'bg-destructive/20 text-destructive border-destructive/30',
  bugfix: 'bg-destructive/20 text-destructive border-destructive/30',
  migration: 'bg-primary/20 text-primary border-primary/30',
  reliability: 'bg-success/20 text-success border-success/30',
  testing: 'bg-primary/20 text-primary border-primary/30',
  'ci-cd': 'bg-muted text-muted-foreground border-border',
  analytics: 'bg-primary/20 text-primary border-primary/30',
  architecture: 'bg-primary/20 text-primary border-primary/30',
};

function buildFilterOptions(items: BacklogItem[]) {
  return {
    priority: ['P0', 'P1', 'P2', 'P3'],
    assignee: [...new Set(items.map(i => i.assignee).filter(Boolean))],
    label: [...new Set(items.flatMap(i => i.labels))].slice(0, 10),
    sprint: [...new Set(items.map(i => i.sprint).filter(Boolean))],
  };
}

const insightSeverityConfig: Record<string, { icon: typeof AlertCircle; color: string; bg: string; border: string }> = {
  critical: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  info: { icon: Lightbulb, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
};

const insightActionLabels: Record<string, { label: string; icon: typeof Eye }> = {
  unblock: { label: 'Resolve Blocker', icon: Zap },
  review: { label: 'Review', icon: Eye },
  estimate: { label: 'Estimate', icon: BarChart3 },
  assign: { label: 'Assign', icon: User },
  groom: { label: 'Schedule Grooming', icon: Archive },
  reprioritize: { label: 'Re-prioritize', icon: ArrowUpDown },
  none: { label: 'No Action', icon: CheckCircle2 },
};

function mapApiTicket(t: APITicket): BacklogItem {
  const priorityMap: Record<string, string> = { critical: 'P0', high: 'P1', medium: 'P2', low: 'P3' };
  return {
    id: t.external_id || t.id.slice(0, 8),
    title: t.title,
    priority: priorityMap[t.priority] || 'P2',
    points: t.human_points ?? t.ai_points ?? 0,
    assignee: t.assignee_id || 'Unassigned',
    assignee_id: t.assignee_id,
    assignee_ids: t.assignee_ids,
    labels: t.labels || [],
    sprint: t.status === 'backlog' ? 'Backlog' : 'Current',
    age: Math.max(0, Math.floor((Date.now() - new Date(t.created_at).getTime()) / 86400000)),
    status: t.status === 'blocked' ? 'blocked' as const : (t.status === 'in_progress' || t.status === 'in_review') ? 'in_progress' as const : t.status === 'todo' ? 'ready' as const : 'draft' as const,
    atlasStatus: t.status,
    module: ((t.labels || [])[0] || 'general') + '/',
  };
}

function healthScoreColor(score: number) {
  if (score >= 80) return { ring: 'var(--success)', label: 'Healthy', labelColor: 'text-success' };
  if (score >= 60) return { ring: 'var(--warning)', label: 'Fair', labelColor: 'text-warning' };
  if (score >= 40) return { ring: 'var(--primary)', label: 'Needs Work', labelColor: 'text-primary' };
  return { ring: 'var(--destructive)', label: 'Critical', labelColor: 'text-destructive' };
}

function priorityLabel(p: string) {
  switch (p) {
    case 'critical': return 'P0';
    case 'high': return 'P1';
    case 'medium': return 'P2';
    case 'low': return 'P3';
    default: return p;
  }
}

function priorityBarColor(p: string) {
  switch (p) {
    case 'critical': return 'var(--destructive)';
    case 'high': return 'var(--primary)';
    case 'medium': return 'var(--primary)';
    case 'low': return 'var(--muted-foreground)';
    default: return 'var(--muted-foreground)';
  }
}

// ---------------------------------------------------------------------------
// Health Ring SVG
// ---------------------------------------------------------------------------

function HealthRing({ score, size = 120 }: { score: number; size?: number }) {
  const { ring, label, labelColor } = healthScoreColor(score);
  const r = (size - 12) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={10} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={ring}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${ring}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground tabular-nums" style={{ animation: 'bi-pop 0.6s ease-out both' }}>
          {score}
        </span>
        <span className={`text-[10px] font-semibold ${labelColor}`}>{label}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sortable Backlog Row
// ---------------------------------------------------------------------------

function SortableBacklogRow({ item, idx, selected, onToggleSelect, teamMembers, getStatusLabel }: { item: BacklogItem; idx: number; selected?: boolean; onToggleSelect?: (id: string) => void; teamMembers: import('@/lib/api').TeamMember[]; getStatusLabel?: (s: string) => string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto' as const,
    animation: !isDragging ? `bi-fade-in 0.3s ease-out ${idx * 0.03}s both` : undefined,
  };

  const pCfg = priorityConfig[item.priority] || priorityConfig.P3;
  const sCfg = statusConfig[item.status] || statusConfig.draft;
  const isStale = item.age > 30;
  const borderAccent = item.priority === 'P0' ? 'border-l-destructive' : item.priority === 'P1' ? 'border-l-warning' : item.priority === 'P2' ? 'border-l-primary' : 'border-l-muted-foreground';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-xl border border-l-[3px] p-3 transition-all hover:bg-muted/80 hover:border-border hover:shadow-sm ${borderAccent} ${
        item.status === 'blocked' ? 'border-destructive/20 bg-destructive/5 border-l-destructive' : 'border-border bg-card'
      } ${selected ? 'ring-2 ring-primary/30 bg-primary/5' : ''}`}
    >
      <div className="flex items-center gap-3">
        {onToggleSelect && (
          <button
            onClick={() => onToggleSelect(item.id)}
            className={`shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors ${
              selected
                ? 'bg-primary text-white'
                : 'border border-border hover:border-primary/40 text-transparent hover:text-muted-foreground'
            }`}
          >
            {selected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
          </button>
        )}
        <div
          className="shrink-0 cursor-grab opacity-0 group-hover:opacity-40 transition-opacity touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>

        <span className={`shrink-0 inline-flex items-center justify-center w-8 h-6 rounded-md text-[10px] font-bold border ${pCfg.bg} ${pCfg.border} ${pCfg.color}`}>
          {item.priority}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <a href="#" className="text-xs font-mono text-primary hover:text-primary/80 transition-colors flex items-center gap-0.5 shrink-0">
              {item.id}<ExternalLink className="w-2.5 h-2.5" />
            </a>
            <p className="text-sm text-foreground font-medium truncate">{item.title}</p>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {item.labels.map(label => (
              <span key={label} className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${labelColors[label] || 'bg-muted text-muted-foreground border-border'}`}>
                {label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <span
                className={`w-1.5 h-1.5 rounded-full ${sCfg.color}`}
                style={sCfg.animate ? { animation: 'bi-pulse 2s ease-in-out infinite' } : undefined}
              />
              {item.atlasStatus && getStatusLabel ? getStatusLabel(item.atlasStatus) : sCfg.label}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">{item.module}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className={`text-[10px] tabular-nums ${isStale ? 'text-warning' : 'text-muted-foreground'}`}>
              {item.age}d
            </span>
            {isStale && (
              <div className="flex justify-end mt-0.5">
                <span className="text-[8px] px-1 py-0.5 rounded bg-warning/10 text-warning border border-warning/20">STALE</span>
              </div>
            )}
          </div>

          <AssigneeAvatarStack
            assignee_id={item.assignee_id}
            assignee_ids={item.assignee_ids}
            teamMembers={teamMembers}
            maxVisible={2}
            size="sm"
          />

          <span className="inline-flex items-center justify-center w-8 h-6 rounded-md bg-muted border border-border text-xs font-bold text-foreground tabular-nums">
            {item.points}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BacklogIntelligencePage() {
  const [backlogItems, setBacklogItems] = useState<BacklogItem[]>([]);
  const [health, setHealth] = useState<BacklogHealth | null>(null);
  const [insights, setInsights] = useState<BacklogInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiReturnsEmpty, setApiReturnsEmpty] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [insightsExpanded, setInsightsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [showSavedFilters, setShowSavedFilters] = useState(false);

  const { activeProjectId } = useProject();
  const { savedFilters, saveFilter, deleteFilter } = useSavedFilters();
  const { data: teamMembers = [] } = useTeamMembers(activeProjectId ?? '');
  const { getStatusLabel } = useBoardColumnLabels(activeProjectId ?? undefined);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [suggestingPoints, setSuggestingPoints] = useState(false);

  useEffect(() => {
    if (!activeProjectId) { setLoading(false); return; }
    setLoading(true);
    setApiReturnsEmpty(false);
    setBacklogItems([]);
    setHealth(null);
    setInsights([]);

    Promise.allSettled([
      getBacklog(activeProjectId),
      getBacklogHealth(activeProjectId),
      getBacklogInsights(activeProjectId),
    ]).then(([ticketsResult, healthResult, insightsResult]) => {
      if (ticketsResult.status === 'fulfilled' && ticketsResult.value.length > 0) {
        setBacklogItems(ticketsResult.value.map(mapApiTicket));
      } else if (ticketsResult.status === 'fulfilled' && ticketsResult.value.length === 0) {
        setApiReturnsEmpty(true);
      }
      if (healthResult.status === 'fulfilled' && healthResult.value) {
        const h = healthResult.value;
        setHealth({
          ...h,
          aging_buckets: h.aging_buckets ?? [],
          priority_distribution: h.priority_distribution ?? [],
          module_breakdown: h.module_breakdown ?? [],
        });
      }
      if (insightsResult.status === 'fulfilled') {
        const raw = insightsResult.value;
        setInsights(Array.isArray(raw) ? raw : (raw as any)?.insights ?? []);
      }
    }).finally(() => setLoading(false));
  }, [activeProjectId]);

  const toggleFilter = (category: string, value: string) => {
    setActiveFilters(prev => {
      const current = prev[category] || [];
      const next = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      if (next.length === 0) {
        const copy = { ...prev };
        delete copy[category];
        return copy;
      }
      return { ...prev, [category]: next };
    });
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchQuery('');
  };

  const handleSaveFilter = () => {
    const name = newFilterName.trim();
    if (!name) return;
    saveFilter(name, activeFilters, searchQuery);
    setNewFilterName('');
    setShowSaveDialog(false);
  };

  const handleLoadFilter = (preset: SavedFilter) => {
    setActiveFilters(preset.filters);
    setSearchQuery(preset.searchQuery);
    setShowSavedFilters(false);
  };

  const activeFilterCount = Object.values(activeFilters).reduce((s, arr) => s + arr.length, 0);
  const hasActiveFilterState = activeFilterCount > 0 || searchQuery.length > 0;

  const filtered = useMemo(() => {
    let items = backlogItems;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.assignee.toLowerCase().includes(q)
      );
    }
    if (activeFilters.priority?.length) items = items.filter(item => activeFilters.priority.includes(item.priority));
    if (activeFilters.assignee?.length) items = items.filter(item => activeFilters.assignee.includes(item.assignee));
    if (activeFilters.label?.length) items = items.filter(item => item.labels.some(l => activeFilters.label.includes(l)));
    if (activeFilters.sprint?.length) items = items.filter(item => activeFilters.sprint.includes(item.sprint));
    return items;
  }, [backlogItems, searchQuery, activeFilters]);

  const safeInsights = Array.isArray(insights) ? insights : [];

  const filteredInsights = useMemo(() => {
    if (activeTab === 'all') return safeInsights;
    return safeInsights.filter(i => i.severity === activeTab);
  }, [safeInsights, activeTab]);

  const criticalInsights = safeInsights.filter(i => i.severity === 'critical').length;
  const warningInsights = safeInsights.filter(i => i.severity === 'warning').length;
  const infoInsights = safeInsights.filter(i => i.severity === 'info').length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filtered.findIndex(item => item.id === active.id);
    const newIndex = filtered.findIndex(item => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(filtered, oldIndex, newIndex);
    setBacklogItems(prev => {
      const filteredIds = new Set(filtered.map(f => f.id));
      const untouched = prev.filter(i => !filteredIds.has(i.id));
      return [...reordered, ...untouched];
    });

    if (activeProjectId) {
      const movedItem = filtered[oldIndex];
      rankBacklogTicket(activeProjectId, movedItem.id, newIndex).catch((err) => {
        console.error('Failed to rank backlog ticket', err);
        setBacklogItems(prev => {
          const filteredIds = new Set(filtered.map(f => f.id));
          const untouched = prev.filter(i => !filteredIds.has(i.id));
          return [...filtered, ...untouched];
        });
      });
    }
  }, [filtered, activeProjectId]);

  const toggleBacklogSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleBacklogSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      const allIds = new Set(filtered.map(i => i.id));
      const allSelected = filtered.every(i => prev.has(i.id));
      return allSelected ? new Set() : allIds;
    });
  }, [filtered]);

  const handleBulkBacklogStatus = useCallback(async (newStatus: string) => {
    if (!activeProjectId || selectedIds.size === 0) return;
    setBulkSaving(true);
    const snapshot = backlogItems.map(i => ({ ...i }));
    const statusMap: Record<string, BacklogItem['status']> = {
      ready: 'ready', draft: 'draft', blocked: 'blocked', in_progress: 'in_progress',
    };

    setBacklogItems(prev => prev.map(i =>
      selectedIds.has(i.id) ? { ...i, status: statusMap[newStatus] || 'draft' } : i
    ));

    try {
      await bulkUpdateTickets(activeProjectId, {
        ticket_ids: [...selectedIds],
        status: newStatus === 'ready' ? 'todo' : newStatus,
      });
      setSelectedIds(new Set());
    } catch {
      setBacklogItems(snapshot);
      setBulkError('Bulk update failed — changes reverted');
      setTimeout(() => setBulkError(null), 3000);
    } finally {
      setBulkSaving(false);
    }
  }, [activeProjectId, selectedIds, backlogItems]);

  const handleBulkBacklogPriority = useCallback(async (newPriority: string) => {
    if (!activeProjectId || selectedIds.size === 0) return;
    setBulkSaving(true);
    const snapshot = backlogItems.map(i => ({ ...i }));
    const priorityApiMap: Record<string, string> = { P0: 'critical', P1: 'high', P2: 'medium', P3: 'low' };

    setBacklogItems(prev => prev.map(i =>
      selectedIds.has(i.id) ? { ...i, priority: newPriority } : i
    ));

    try {
      await bulkUpdateTickets(activeProjectId, {
        ticket_ids: [...selectedIds],
        priority: priorityApiMap[newPriority] || 'medium',
      });
      setSelectedIds(new Set());
    } catch {
      setBacklogItems(snapshot);
      setBulkError('Bulk update failed — changes reverted');
      setTimeout(() => setBulkError(null), 3000);
    } finally {
      setBulkSaving(false);
    }
  }, [activeProjectId, selectedIds, backlogItems]);

  const backlogSomeSelected = selectedIds.size > 0;
  const backlogAllSelected = filtered.length > 0 && filtered.every(i => selectedIds.has(i.id));

  const defaultHealth: BacklogHealth = { total_items: 0, total_points: 0, health_score: 0, avg_age_days: 0, stale_count: 0, blocked_count: 0, unestimated_count: 0, ready_count: 0, draft_count: 0, priority_distribution: [], aging_buckets: [], module_breakdown: [] };
  const h = health ?? defaultHealth;
  const maxAgingCount = Math.max(...(h.aging_buckets ?? []).map(b => b.count), 1);
  const maxPriorityCount = Math.max(...(h.priority_distribution ?? []).map(p => p.count), 1);
  const maxModuleCount = Math.max(...(h.module_breakdown ?? []).map(m => m.count), 1);

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
        illustration={<BacklogIllustration className="w-[220px] h-[176px]" />}
        title="Backlog is empty"
        description="Your backlog will populate once tickets are synced from your board. Connect Jira, Linear, ClickUp, Asana, Monday, or another integration to get started."
        actionLabel="Connect Integration"
      />
    );
  }

  return (
    <>
      <style>{`
        @keyframes bi-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes bi-bar-grow {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes bi-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bi-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes bi-slide-down {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bi-pop {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes bi-glow {
          0%, 100% { box-shadow: 0 0 12px color-mix(in srgb, var(--primary) 15%, transparent); }
          50% { box-shadow: 0 0 24px color-mix(in srgb, var(--primary) 30%, transparent); }
        }
      `}</style>

      <Reveal>
        <div className="space-y-6">

          {/* ── Header ── */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted via-muted/80 to-muted p-6">
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, var(--primary) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <div className="relative flex flex-col md:flex-row md:items-center gap-6">
              <HealthRing score={h.health_score} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-11 h-11 rounded-xl bg-primary/8 border border-primary/12 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>Backlog Intelligence</h1>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {h.total_items} items &middot; {h.total_points} pts &middot; {h.avg_age_days}d avg age
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Ready', value: h.ready_count, icon: CheckCircle2, color: 'text-success', iconBg: 'bg-success/8 border-success/12' },
                    { label: 'Blocked', value: h.blocked_count, icon: Shield, color: 'text-destructive', iconBg: 'bg-destructive/8 border-destructive/12' },
                    { label: 'Stale', value: h.stale_count, icon: TrendingDown, color: 'text-warning', iconBg: 'bg-warning/8 border-warning/12' },
                    { label: 'Unestimated', value: h.unestimated_count, icon: Activity, color: 'text-primary', iconBg: 'bg-primary/8 border-primary/12' },
                  ].map((m, i) => (
                    <div
                      key={m.label}
                      className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-card border border-border/50 bento-card"
                      style={{ animation: `bi-fade-in 0.4s ease-out ${0.1 + i * 0.07}s both` }}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${m.iconBg}`}>
                        <m.icon className={`w-4.5 h-4.5 ${m.color}`} />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground tabular-nums leading-none" style={{ fontFamily: 'var(--font-serif)' }}>{m.value}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                {h.unestimated_count > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={suggestingPoints || !activeProjectId}
                    onClick={async () => {
                      if (!activeProjectId) return;
                      setSuggestingPoints(true);
                      try {
                        const res = await estimateTickets(activeProjectId);
                        if (res.estimated > 0) {
                          const [ticketsResult, healthResult] = await Promise.all([
                            getBacklog(activeProjectId),
                            getBacklogHealth(activeProjectId),
                          ]);
                          if (ticketsResult.length > 0) setBacklogItems(ticketsResult.map(mapApiTicket));
                          if (healthResult) {
                            setHealth({
                              ...healthResult,
                              aging_buckets: healthResult.aging_buckets ?? [],
                              priority_distribution: healthResult.priority_distribution ?? [],
                              module_breakdown: healthResult.module_breakdown ?? [],
                            });
                          }
                        }
                      } finally {
                        setSuggestingPoints(false);
                      }
                    }}
                  >
                    {suggestingPoints ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart3 className="w-3.5 h-3.5" />}
                    Suggest points ({h.unestimated_count})
                  </Button>
                )}
                <Button variant="primary" size="sm">
                  <Sparkles className="w-3.5 h-3.5" />Auto-prioritize
                </Button>
                <Button variant="secondary" size="sm">
                  <Plus className="w-3.5 h-3.5" />New Item
                </Button>
              </div>
            </div>
          </div>

          {/* ── AI Insights Panel ── */}
          <div className="rounded-2xl border border-border bg-muted overflow-hidden" style={{ animation: 'bi-glow 4s ease-in-out infinite' }}>
            <button
              onClick={() => setInsightsExpanded(!insightsExpanded)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <h2 className="text-sm font-semibold text-foreground">AI Insights</h2>
                  <p className="text-[10px] text-muted-foreground">{safeInsights.length} recommendations</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {criticalInsights > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 border border-destructive/20 text-[10px] font-semibold text-destructive">
                    {criticalInsights} critical
                  </span>
                )}
                {warningInsights > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/10 border border-warning/20 text-[10px] font-semibold text-warning">
                    {warningInsights} warning
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${insightsExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {insightsExpanded && (
              <div className="border-t border-border" style={{ animation: 'bi-slide-down 0.2s ease-out both' }}>
                <div className="flex items-center gap-1 px-5 pt-3 pb-2">
                  {(['all', 'critical', 'warning', 'info'] as const).map(tab => {
                    const counts = { all: safeInsights.length, critical: criticalInsights, warning: warningInsights, info: infoInsights };
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                          activeTab === tab
                            ? 'bg-primary/15 text-primary border border-primary/30'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'
                        }`}
                      >
                        {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)} ({counts[tab]})
                      </button>
                    );
                  })}
                </div>

                <div className="px-5 pb-4 space-y-2 max-h-[320px] overflow-y-auto">
                  {filteredInsights.map((insight, idx) => {
                    const cfg = insightSeverityConfig[insight.severity] || insightSeverityConfig.info;
                    const action = insightActionLabels[insight.action || 'none'] || insightActionLabels.none;
                    const IconComp = cfg.icon;
                    const ActionIcon = action.icon;
                    return (
                      <div
                        key={insight.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.border} ${cfg.bg} transition-colors hover:brightness-110`}
                        style={{ animation: `bi-fade-in 0.3s ease-out ${idx * 0.04}s both` }}
                      >
                        <div className="shrink-0 mt-0.5">
                          <IconComp className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground">{insight.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{insight.description}</p>
                          {insight.ticket_title && (
                            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5" />{insight.ticket_title}
                            </p>
                          )}
                        </div>
                        {insight.action && insight.action !== 'none' && (
                          <button className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold transition-colors hover:brightness-125 ${cfg.border} ${cfg.color}`}>
                            <ActionIcon className="w-3 h-3" />
                            {action.label}
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {filteredInsights.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-xs">No insights in this category.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Analytics Row ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Priority Distribution */}
            <Card className="py-4 bento-card">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-2 mb-3 px-1">
                <BarChart3 className="w-3.5 h-3.5 text-primary" />Priority Distribution
              </h3>
              <div className="space-y-2">
                {h.priority_distribution.map((p, idx) => {
                  const pct = (p.count / maxPriorityCount) * 100;
                  return (
                    <div key={p.priority} className="flex items-center gap-2" style={{ animation: `bi-fade-in 0.3s ease-out ${idx * 0.06}s both` }}>
                      <span className="w-6 text-[10px] font-bold tabular-nums" style={{ color: priorityBarColor(p.priority) }}>
                        {priorityLabel(p.priority)}
                      </span>
                      <div className="flex-1 h-5 bg-muted rounded-md overflow-hidden relative">
                        <div
                          className="absolute inset-y-0 left-0 rounded-md origin-left"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: priorityBarColor(p.priority),
                            opacity: 0.5,
                            animation: `bi-bar-grow 0.6s ease-out ${0.2 + idx * 0.1}s both`,
                          }}
                        />
                        <div className="absolute inset-0 flex items-center px-2">
                          <span className="text-[10px] font-bold text-foreground tabular-nums">{p.count}</span>
                          <span className="text-[9px] text-muted-foreground ml-1">({p.points} pts)</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Aging Distribution */}
            <Card className="py-4 bento-card">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-2 mb-3 px-1">
                <Clock className="w-3.5 h-3.5 text-warning" />Aging Distribution
              </h3>
              <div className="space-y-2">
                {h.aging_buckets.map((b, idx) => {
                  const pct = (b.count / maxAgingCount) * 100;
                  const isStale = b.min_days >= 30;
                  return (
                    <div key={b.label} className="flex items-center gap-2" style={{ animation: `bi-fade-in 0.3s ease-out ${idx * 0.06}s both` }}>
                      <span className={`w-16 text-[10px] font-medium tabular-nums ${isStale ? 'text-warning' : 'text-muted-foreground'}`}>
                        {b.label}
                      </span>
                      <div className="flex-1 h-5 bg-muted rounded-md overflow-hidden relative">
                        <div
                          className="absolute inset-y-0 left-0 rounded-md origin-left"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: isStale ? 'var(--warning)' : 'var(--primary)',
                            opacity: 0.5,
                            animation: `bi-bar-grow 0.6s ease-out ${0.2 + idx * 0.1}s both`,
                          }}
                        />
                        <div className="absolute inset-0 flex items-center px-2">
                          <span className="text-[10px] font-bold text-foreground tabular-nums">{b.count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Module Breakdown */}
            <Card className="py-4 bento-card">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-2 mb-3 px-1">
                <Layers className="w-3.5 h-3.5 text-primary" />Module Breakdown
              </h3>
              <div className="space-y-2">
                {h.module_breakdown.slice(0, 5).map((m, idx) => {
                  const pct = (m.count / maxModuleCount) * 100;
                  return (
                    <div key={m.module} className="flex items-center gap-2" style={{ animation: `bi-fade-in 0.3s ease-out ${idx * 0.06}s both` }}>
                      <span className="w-20 text-[10px] font-mono text-muted-foreground truncate">{m.module}/</span>
                      <div className="flex-1 h-5 bg-muted rounded-md overflow-hidden relative">
                        <div
                          className="absolute inset-y-0 left-0 rounded-md origin-left"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: 'var(--primary)',
                            opacity: 0.5,
                            animation: `bi-bar-grow 0.6s ease-out ${0.2 + idx * 0.1}s both`,
                          }}
                        />
                        <div className="absolute inset-0 flex items-center px-2">
                          <span className="text-[10px] font-bold text-white tabular-nums">{m.count}</span>
                          <span className="text-[9px] text-muted-foreground ml-1">({m.points} pts)</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* ── Contextual Tips ── */}
          <div className="space-y-2">
            <TipBanner {...TIPS.backlogDragReorder} />
            <TipBanner {...TIPS.backlogSaveFilters} />
          </div>

          {/* ── Search + Filters ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by title, ID, or assignee..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                )}
              </div>

              {/* Saved filter presets */}
              <div className="relative">
                <button
                  onClick={() => setShowSavedFilters(!showSavedFilters)}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-muted border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors whitespace-nowrap"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  Presets
                  {savedFilters.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[9px] font-bold">{savedFilters.length}</span>
                  )}
                </button>
                {showSavedFilters && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSavedFilters(false)} />
                    <div className="absolute right-0 top-full mt-1 z-20 w-64 rounded-xl bg-card border border-border shadow-lg shadow-black/20 p-2" style={{ animation: 'bi-slide-down 0.15s ease-out both' }}>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">Saved Filters</p>
                      {savedFilters.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground/50 px-2 py-3 text-center">No saved filters yet</p>
                      ) : (
                        <div className="max-h-48 overflow-y-auto space-y-0.5">
                          {savedFilters.map(preset => (
                            <div
                              key={preset.id}
                              className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-secondary/60 transition-colors group/preset"
                            >
                              <button
                                onClick={() => handleLoadFilter(preset)}
                                className="flex-1 text-left min-w-0"
                              >
                                <span className="text-xs font-medium text-foreground truncate block">{preset.name}</span>
                                <span className="text-[10px] text-muted-foreground/50">
                                  {Object.values(preset.filters).flat().length} filter{Object.values(preset.filters).flat().length !== 1 ? 's' : ''}
                                  {preset.searchQuery ? ` · "${preset.searchQuery}"` : ''}
                                </span>
                              </button>
                              <button
                                onClick={() => deleteFilter(preset.id)}
                                className="opacity-0 group-hover/preset:opacity-60 hover:!opacity-100 p-1 rounded transition-opacity"
                              >
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Save current filter */}
              {hasActiveFilterState && (
                <div className="relative">
                  {showSaveDialog ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newFilterName}
                        onChange={e => setNewFilterName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveFilter(); if (e.key === 'Escape') setShowSaveDialog(false); }}
                        placeholder="Filter name..."
                        autoFocus
                        className="w-32 px-2.5 py-2 rounded-lg bg-muted border border-primary/30 text-xs text-foreground placeholder-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <button
                        onClick={handleSaveFilter}
                        disabled={!newFilterName.trim()}
                        className="px-2.5 py-2 rounded-lg bg-primary text-white text-[10px] font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors"
                      >
                        Save
                      </button>
                      <button onClick={() => setShowSaveDialog(false)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowSaveDialog(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-medium text-primary hover:bg-primary/15 transition-colors whitespace-nowrap"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      Save Filter
                    </button>
                  )}
                </div>
              )}

              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-xs text-destructive hover:text-destructive/80 transition-colors whitespace-nowrap">
                  Clear all ({activeFilterCount})
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              {Object.entries(buildFilterOptions(backlogItems)).map(([category, options]) => (
                <div key={category} className="relative">
                  <button
                    onClick={() => setOpenFilter(openFilter === category ? null : category)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      activeFilters[category]?.length
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-muted border-border text-muted-foreground hover:border-border hover:text-foreground'
                    }`}
                  >
                    {category === 'priority' && <AlertTriangle className="w-3 h-3" />}
                    {category === 'assignee' && <User className="w-3 h-3" />}
                    {category === 'label' && <Tag className="w-3 h-3" />}
                    {category === 'sprint' && <Layers className="w-3 h-3" />}
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                    {activeFilters[category]?.length ? ` (${activeFilters[category].length})` : ''}
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {openFilter === category && (
                    <div className="absolute top-full mt-1 left-0 z-20 w-48 rounded-xl bg-muted border border-border shadow-lg shadow-black/40 py-1" style={{ animation: 'bi-slide-down 0.15s ease-out both' }}>
                      {options.map(opt => {
                        const isActive = activeFilters[category]?.includes(opt);
                        return (
                          <button
                            key={opt}
                            onClick={() => toggleFilter(category, opt)}
                            className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-muted transition-colors ${isActive ? 'text-primary' : 'text-foreground'}`}
                          >
                            <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isActive ? 'bg-primary border-primary' : 'border-border'}`}>
                              {isActive && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                            </span>
                            {category === 'assignee' && (
                              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white" style={{ backgroundColor: assigneeColors[opt] || 'var(--muted-foreground)' }}>
                                {assigneeInitials[opt] || '?'}
                              </span>
                            )}
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(activeFilters).map(([category, values]) =>
                  values.map(value => (
                    <span key={`${category}-${value}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] text-primary font-medium">
                      {value}
                      <button onClick={() => toggleFilter(category, value)} className="hover:text-foreground transition-colors">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            )}
          </div>

          {openFilter && (
            <div className="fixed inset-0 z-10" onClick={() => setOpenFilter(null)} />
          )}

          {/* ── Bulk Error Toast ── */}
          {bulkError && (
            <div
              className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 flex items-center gap-3"
              style={{ animation: 'bi-fade-in 0.2s ease-out both' }}
            >
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              <span className="text-sm font-medium text-destructive">{bulkError}</span>
              <button onClick={() => setBulkError(null)} className="ml-auto p-1 rounded hover:bg-destructive/10 transition-colors">
                <X className="w-3.5 h-3.5 text-destructive" />
              </button>
            </div>
          )}

          {/* ── Bulk Actions Bar ── */}
          {backlogSomeSelected && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 flex-wrap"
              style={{ animation: 'bi-fade-in 0.2s ease-out both' }}
            >
              <button
                onClick={toggleBacklogSelectAll}
                className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {backlogAllSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                {selectedIds.size} selected
              </button>
              <div className="w-px h-5 bg-border" />
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Status:</span>
                {['ready', 'draft', 'blocked', 'in_progress'].map(s => (
                  <button
                    key={s}
                    disabled={bulkSaving}
                    onClick={() => handleBulkBacklogStatus(s)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-border bg-card hover:bg-secondary hover:border-primary/30 text-foreground transition-colors disabled:opacity-50"
                  >
                    {statusConfig[s]?.label || s}
                  </button>
                ))}
              </div>
              <div className="w-px h-5 bg-border" />
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Priority:</span>
                {['P0', 'P1', 'P2', 'P3'].map(p => (
                  <button
                    key={p}
                    disabled={bulkSaving}
                    onClick={() => handleBulkBacklogPriority(p)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border border-border bg-card hover:bg-secondary hover:border-primary/30 transition-colors disabled:opacity-50 ${priorityConfig[p]?.color || 'text-foreground'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="w-px h-5 bg-border" />
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
              >
                Clear selection
              </button>
              {bulkSaving && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />}
            </div>
          )}

          {/* ── Backlog Items ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2 text-[10px] text-muted-foreground uppercase tracking-wider">
              <button
                onClick={toggleBacklogSelectAll}
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                {backlogAllSelected
                  ? <CheckSquare className="w-3 h-3 text-primary" />
                  : <Square className="w-3 h-3" />
                }
                {filtered.length} items
              </button>
              <span>Showing {filtered.length} of {backlogItems.length}</span>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={filtered.map(i => i.id)} strategy={verticalListSortingStrategy}>
                {filtered.map((item, idx) => (
                  <SortableBacklogRow
                    key={item.id}
                    item={item}
                    idx={idx}
                    selected={selectedIds.has(item.id)}
                    onToggleSelect={toggleBacklogSelect}
                    teamMembers={teamMembers}
                    getStatusLabel={getStatusLabel}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No items match your filters</p>
                <button onClick={clearFilters} className="text-xs text-primary hover:text-primary/80 mt-2 transition-colors">
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          <button className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border hover:border-primary/40 text-sm text-muted-foreground hover:text-primary transition-colors w-full justify-center">
            <Plus className="w-4 h-4" />Load more items
          </button>
        </div>
      </Reveal>
    </>
  );
}
