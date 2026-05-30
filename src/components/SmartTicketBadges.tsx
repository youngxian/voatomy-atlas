'use client';

import { AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { getTicketRiskBadges, type TicketRiskBadgeResult } from '@/lib/smart-insights';
import type { Ticket } from '@/lib/api';
import { Tooltip } from '@/components/ui';

const BADGE_CONFIG: Record<
  TicketRiskBadgeResult['type'],
  { bg: string; text: string; icon?: typeof AlertTriangle }
> = {
  blocked: {
    bg: 'bg-destructive/12',
    text: 'text-destructive',
    icon: AlertTriangle,
  },
  'at-risk': {
    bg: 'bg-amber-500/12',
    text: 'text-amber-600 dark:text-amber-400',
    icon: AlertTriangle,
  },
  stale: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    icon: Clock,
  },
  'estimation-suggestion': {
    bg: 'bg-primary/10',
    text: 'text-primary',
    icon: TrendingUp,
  },
};

interface SmartTicketBadgesProps {
  ticket: Ticket;
  /** Max badges to show (default 2). Estimation-suggestion is shown as primary when present. */
  maxBadges?: number;
  className?: string;
}

export function SmartTicketBadges({
  ticket,
  maxBadges = 2,
  className = '',
}: SmartTicketBadgesProps) {
  const badges = getTicketRiskBadges(ticket);
  if (badges.length === 0) return null;

  const toShow = badges.slice(0, maxBadges);

  return (
    <span className={`inline-flex items-center gap-1 flex-wrap ${className}`}>
      {toShow.map((badge) => {
        const cfg = BADGE_CONFIG[badge.type];
        const Icon = cfg.icon;
        const tooltip =
          badge.type === 'blocked'
            ? 'This ticket is blocked'
            : badge.type === 'at-risk'
              ? 'In progress for a long time with no update'
              : badge.type === 'stale'
                ? 'No update in 7+ days'
                : badge.type === 'estimation-suggestion'
                  ? `Atlas suggests ${badge.suggestedPoints} points (differs from human estimate)`
                  : badge.label;

        return (
          <Tooltip key={badge.type} content={tooltip} side="top">
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}
            >
              {Icon && <Icon className="w-3 h-3 shrink-0" strokeWidth={2} />}
              {badge.label}
            </span>
          </Tooltip>
        );
      })}
    </span>
  );
}
