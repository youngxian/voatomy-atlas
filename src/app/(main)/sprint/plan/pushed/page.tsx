'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  BarChart3,
  Eye,
  Bell,
  TrendingUp,
  RefreshCw,
  Shield,
  FileText,
  Tag,
  MessageSquare,
  Users,
  Target,
} from 'lucide-react';
import { Card, SectionHeader } from '@/components/ui';
import { Reveal } from '@/components/Reveal';
import { useProject } from '@/lib/project-context';
import { getProviderLabel } from '@/lib/project-utils';

const SPRINT_PLAN_WRITEBACK_KEY = 'sprint-plan-writeback';

const WRITEBACK_MAP: Record<string, { icon: typeof Target; label: string }> = {
  wb_sprint: { icon: Target, label: 'Tickets moved into sprint' },
  wb_points: { icon: FileText, label: 'ATLAS story points written to all tickets' },
  wb_labels: { icon: Tag, label: 'Risk labels applied (HIGH / MED / LOW)' },
  wb_comments: { icon: MessageSquare, label: 'Estimation breakdowns added as comments' },
  wb_excluded: { icon: Shield, label: 'Excluded tickets tagged with reasons in backlog' },
};

const monitorItems = [
  {
    icon: TrendingUp,
    label: 'Daily pacing check against sprint plan',
  },
  {
    icon: Bell,
    label: 'Revenue-critical ticket alerts (COMP-217, COMP-220)',
  },
  {
    icon: RefreshCw,
    label: 'Signal re-sync every 4 hours',
  },
  {
    icon: Eye,
    label: 'Carry-over risk detection at sprint midpoint',
  },
  {
    icon: BarChart3,
    label: 'Accuracy tracking for sprint report generation',
  },
];

// ---------------------------------------------------------------------------
// Sprint Plan Pushed Page
// ---------------------------------------------------------------------------

const DEFAULT_WRITEBACK_ITEMS: { icon: typeof Target; label: string }[] = [
  { icon: Target, label: 'Tickets moved into sprint' },
  { icon: FileText, label: 'ATLAS story points written to all tickets' },
  { icon: Tag, label: 'Risk labels applied (HIGH / MED / LOW)' },
];

export default function SprintPlanPushedPage() {
  const { activeProject, activeSprint } = useProject();
  const providerLabel = getProviderLabel(activeProject);
  const sprintName = activeSprint?.name ?? 'Current Sprint';
  const [writeBackItems, setWriteBackItems] = useState(DEFAULT_WRITEBACK_ITEMS);

  useEffect(() => {
    try {
      const raw = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SPRINT_PLAN_WRITEBACK_KEY) : null;
      const selected = raw ? (JSON.parse(raw) as Record<string, boolean>) : null;
      const items: { icon: typeof Target; label: string }[] = [];
      if (selected) {
        for (const [id, enabled] of Object.entries(selected)) {
          if (enabled && WRITEBACK_MAP[id]) {
            items.push(WRITEBACK_MAP[id]);
          }
        }
      }
      if (items.length > 0) {
        setWriteBackItems(items);
      }
    } catch {
      // Keep default items
    }
  }, []);

  return (
    <Reveal>
      <div className="space-y-8 py-8">
      {/* Big green checkmark */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-success/15 border-2 border-success/30 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>
          {sprintName} Plan Pushed to {providerLabel}
        </h1>
        <p className="text-sm text-muted-foreground max-w-md">
          ATLAS has written your sprint plan to {providerLabel}. All tickets, points, and
          labels are now live in your board.
        </p>
      </div>

      {/* Success card - what was written */}
      <Card className="space-y-3 bento-card" role="region" aria-label={`Write-back summary for ${providerLabel}`}>
        <SectionHeader
          icon={CheckCircle2}
          iconClassName="bg-success/8 border-success/12"
          title={`What was written to ${providerLabel}`}
          subtitle={`${writeBackItems.length} items synced`}
        />
        <div className="space-y-2" role="list" aria-label="Write-back items">
          {writeBackItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3 py-2"
                role="listitem"
              >
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" aria-hidden="true" />
                <Icon className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                <span className="text-sm text-foreground">{item.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Open in board button */}
      <a
        href="#"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all hover:scale-[1.01]"
        style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)',
          boxShadow: '0 4px 20px rgba(34, 197, 94, 0.25)',
        }}
      >
        Open {sprintName} in {providerLabel}
        <ExternalLink className="w-4 h-4" />
      </a>

      {/* What ATLAS monitors */}
      <Card className="space-y-3 bento-card" role="region" aria-label="Sprint monitoring">
        <SectionHeader
          icon={Eye}
          title="What ATLAS monitors during this sprint"
          subtitle={`${monitorItems.length} active monitors`}
        />
        <div className="space-y-2" role="list" aria-label="Monitor items">
          {monitorItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3 py-2.5"
                role="listitem"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/8 border border-primary/12 flex items-center justify-center shrink-0" aria-hidden="true">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{item.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-border">
        <Link href="/dashboard" className="flex-1">
          <button className="w-full px-4 py-2.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-sm font-medium border border-border transition-colors flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </Link>
        <Link href="/dashboard" className="flex-1">
          <button className="w-full px-4 py-2.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-sm font-medium border border-border transition-colors flex items-center justify-center gap-2">
            <BarChart3 className="w-4 h-4" />
            View Sprint Accuracy
          </button>
        </Link>
      </div>
      </div>
    </Reveal>
  );
}
