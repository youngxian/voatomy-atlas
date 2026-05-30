'use client';

import { useMemo } from 'react';
import type { TeamMember } from '@/lib/api';
import { clsx } from 'clsx';

const AVATAR_GRADIENTS = [
  'from-emerald-500 to-teal-600',
  'from-primary to-emerald-600',
  'from-violet-500 to-purple-600',
  'from-sky-500 to-blue-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-teal-500',
  'from-indigo-500 to-violet-600',
];

export interface AssigneeAvatarStackProps {
  /** Primary assignee ID (legacy) */
  assignee_id?: string | null;
  /** All assignee IDs for multi-assignee support */
  assignee_ids?: string[] | null;
  /** Team members to resolve IDs to names/initials */
  teamMembers: TeamMember[];
  /** Max avatars to show before +N overflow */
  maxVisible?: number;
  /** Avatar size: xs | sm | md | lg */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  xs: 'w-5 h-5 text-[8px]',
  sm: 'w-6 h-6 text-[9px]',
  md: 'w-7 h-7 text-[10px]',
  lg: 'w-8 h-8 text-xs',
};

export function AssigneeAvatarStack({
  assignee_id,
  assignee_ids,
  teamMembers,
  maxVisible = 3,
  size = 'sm',
  className,
}: AssigneeAvatarStackProps) {
  const ids = useMemo(() => {
    const fromMulti = assignee_ids ?? [];
    const fromSingle = assignee_id ? [assignee_id] : [];
    const combined = fromMulti.length > 0 ? fromMulti : fromSingle;
    const seen = new Set<string>();
    return combined.filter((id) => {
      const n = id?.toLowerCase?.() ?? '';
      if (!n || seen.has(n)) return false;
      seen.add(n);
      return true;
    });
  }, [assignee_id, assignee_ids]);

  const memberLookup = useMemo(() => {
    const m = new Map<string, TeamMember>();
    for (const t of teamMembers) {
      m.set(t.id.toLowerCase(), t);
      m.set(t.id, t);
      if (t.user_id) {
        m.set(t.user_id.toLowerCase(), t);
        m.set(t.user_id, t);
      }
      if (t.email) m.set(t.email.toLowerCase().trim(), t);
    }
    return m;
  }, [teamMembers]);

  const resolved = useMemo(() => {
    return ids
      .map((id) => {
        const member = memberLookup.get(id?.toLowerCase?.() ?? '') ?? memberLookup.get(id ?? '');
        const initials = member?.initials ?? (member?.name ? member.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) : '?');
        return { id, member, initials };
      })
      .filter((r) => r.id);
  }, [ids, memberLookup]);

  const visible = resolved.slice(0, maxVisible);
  const overflow = resolved.length - maxVisible;

  if (resolved.length === 0) {
    return (
      <span className={clsx('text-[10px] text-muted-foreground italic', size === 'xs' && 'text-[9px]')}>
        Unassigned
      </span>
    );
  }

  return (
    <div className={clsx('inline-flex items-center', className)}>
      {visible.map((r, i) => (
        <div
          key={r.id}
          className={clsx(
            'rounded-full flex items-center justify-center font-bold text-white shrink-0 border-2 border-background bg-gradient-to-br',
            AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length],
            sizeClasses[size],
            i > 0 && '-ml-2',
          )}
          title={r.member?.name ?? r.id}
          aria-label={r.member?.name ?? r.id}
        >
          {r.initials}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={clsx(
            'rounded-full flex items-center justify-center font-semibold text-muted-foreground bg-muted border-2 border-background shrink-0 -ml-2',
            sizeClasses[size],
          )}
          title={resolved.slice(maxVisible).map((r) => r.member?.name ?? r.id).join(', ')}
          aria-label={`${overflow} more assignees`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
