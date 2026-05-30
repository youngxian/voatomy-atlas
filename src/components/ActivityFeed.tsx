'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  GitPullRequest,
  Loader2,
  MessageSquare,
  PlayCircle,
  ShieldAlert,
  Ticket,
  XCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useProject } from '@/lib/project-context';
import {
  getSprintTicketsFull,
  getActivityStats,
  type Ticket as TicketType,
  type ActivityStats,
} from '@/lib/api';

// ---------------------------------------------------------------------------
// Feed item types
// ---------------------------------------------------------------------------

interface FeedItem {
  id: string;
  icon: typeof Activity;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  timestamp: string;
  href?: string;
}

const STATUS_META: Record<string, { icon: typeof Activity; iconBg: string; iconColor: string; verb: string }> = {
  done: { icon: CheckCircle2, iconBg: 'bg-success/10', iconColor: 'text-success', verb: 'completed' },
  in_progress: { icon: PlayCircle, iconBg: 'bg-warning/10', iconColor: 'text-warning', verb: 'started' },
  in_review: { icon: GitPullRequest, iconBg: 'bg-[#3B82F6]/10', iconColor: 'text-[#3B82F6]', verb: 'moved to review' },
  blocked: { icon: ShieldAlert, iconBg: 'bg-destructive/10', iconColor: 'text-destructive', verb: 'was blocked' },
  cancelled: { icon: XCircle, iconBg: 'bg-muted/60', iconColor: 'text-muted-foreground', verb: 'was cancelled' },
};

function relativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ActivityFeedProps {
  maxItems?: number;
  compact?: boolean;
  className?: string;
}

export default function ActivityFeed({ maxItems = 15, compact = false, className }: ActivityFeedProps) {
  const { activeProject, activeSprint } = useProject();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeProject?.id) { setLoading(false); return; }
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [t, s] = await Promise.all([
          activeSprint ? getSprintTicketsFull(activeProject!.id, activeSprint.id).catch(() => []) : Promise.resolve([]),
          getActivityStats(activeProject!.id, activeSprint?.id).catch(() => null),
        ]);
        if (!cancelled) {
          setTickets(Array.isArray(t) ? t : []);
          setStats(s);
        }
      } catch { /* best-effort */ }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [activeProject?.id, activeSprint?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const feedItems = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [];

    const sorted = [...tickets].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );

    for (const t of sorted.slice(0, maxItems)) {
      const meta = STATUS_META[t.status] ?? {
        icon: Ticket,
        iconBg: 'bg-muted/60',
        iconColor: 'text-muted-foreground',
        verb: 'was updated',
      };
      items.push({
        id: t.id,
        icon: meta.icon,
        iconBg: meta.iconBg,
        iconColor: meta.iconColor,
        title: t.title,
        subtitle: `${t.external_id || 'Ticket'} ${meta.verb}`,
        timestamp: t.updated_at,
        href: t.external_url,
      });
    }

    if (stats && stats.stale_count > 0) {
      items.push({
        id: 'stale-summary',
        icon: Clock,
        iconBg: 'bg-amber-500/10',
        iconColor: 'text-amber-600 dark:text-amber-400',
        title: `${stats.stale_count} stale ticket${stats.stale_count !== 1 ? 's' : ''} need attention`,
        subtitle: 'No recent updates on assigned in-progress tickets',
        timestamp: new Date().toISOString(),
        href: '/activity',
      });
    }

    return items.slice(0, maxItems);
  }, [tickets, stats, maxItems]);

  if (loading) {
    return (
      <div className={clsx('rounded-2xl border border-border/30 bg-card p-6', className)}>
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      </div>
    );
  }

  if (feedItems.length === 0) {
    return (
      <div className={clsx('rounded-2xl border border-border/30 bg-card p-6', className)}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Activity Feed</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-10 h-10 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-2.5">
            <Activity className="w-5 h-5 text-muted-foreground/30" />
          </div>
          <p className="text-xs text-muted-foreground/60 font-medium">No recent activity</p>
          <p className="text-[11px] text-muted-foreground/40 mt-1">Activity will appear here as your team works on tickets.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('rounded-2xl border border-border/30 bg-card p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground leading-tight">Activity Feed</h3>
            <p className="text-[10px] text-muted-foreground/50 font-medium">{feedItems.length} recent events</p>
          </div>
        </div>
        <Link href="/activity">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer">
            <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
            <span className="text-[11px] font-semibold text-primary">View all</span>
          </div>
        </Link>
      </div>

      <div className={clsx(
        'space-y-0.5 overflow-y-auto pr-1 scrollbar-thin',
        compact ? 'max-h-[280px]' : 'max-h-[400px]',
      )}>
        {feedItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.id}
              className="group flex items-start gap-3 py-2.5 border-b border-border/15 last:border-b-0 hover:bg-secondary/30 rounded-xl px-2.5 -mx-1 transition-all duration-200"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.02 * idx }}
            >
              <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5', item.iconBg)}>
                <Icon className={clsx('w-3.5 h-3.5', item.iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-foreground/90 truncate font-medium leading-tight">{item.title}</p>
                {item.subtitle && (
                  <p className="text-[10px] text-muted-foreground/50 truncate mt-0.5">{item.subtitle}</p>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground/40 font-medium shrink-0 tabular-nums mt-0.5">
                {relativeTime(item.timestamp)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
