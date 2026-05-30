'use client';

import { ShieldAlert } from 'lucide-react';
import clsx from 'clsx';
import type { PIISeverity } from '@/lib/api';

interface PIIBadgeProps {
  count: number;
  severity?: PIISeverity;
  pulse?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export default function PIIBadge({ count, severity, pulse, onClick, size = 'sm' }: PIIBadgeProps) {
  if (count <= 0) return null;
  const isCritical = severity === 'critical';
  const isHighOrAbove = severity === 'critical' || severity === 'high';

  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative inline-flex items-center gap-1 rounded-full border transition-colors',
        isHighOrAbove
          ? 'bg-red-500/10 border-red-500/25 text-red-500 hover:bg-red-500/20'
          : 'bg-orange-500/10 border-orange-500/25 text-orange-500 hover:bg-orange-500/20',
        size === 'sm' ? 'px-1.5 py-[1px]' : 'px-2 py-0.5',
        onClick && 'cursor-pointer'
      )}
      title={`${count} PII finding${count !== 1 ? 's' : ''}`}
    >
      <ShieldAlert className={clsx(size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
      <span className={clsx('font-bold', size === 'sm' ? 'text-[9px]' : 'text-[10px]')}>{count}</span>
      {(pulse || isCritical) && (
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
      )}
    </button>
  );
}
