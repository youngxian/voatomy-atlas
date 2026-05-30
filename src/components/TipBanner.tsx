'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Lightbulb, Sparkles, GripVertical, Bookmark, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DISMISSED_KEY_PREFIX = 'atlas_tip_dismissed_';

type TipVariant = 'info' | 'feature' | 'success';

interface TipBannerProps {
  tipId: string;
  title: string;
  description: string;
  variant?: TipVariant;
  icon?: React.ElementType;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const variantStyles: Record<TipVariant, { bg: string; border: string; iconBg: string; iconColor: string }> = {
  info: {
    bg: 'bg-primary/[0.04]',
    border: 'border-primary/15',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  feature: {
    bg: 'bg-violet-500/[0.04]',
    border: 'border-violet-500/15',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  success: {
    bg: 'bg-emerald-500/[0.04]',
    border: 'border-emerald-500/15',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
};

const defaultIcons: Record<TipVariant, React.ElementType> = {
  info: Lightbulb,
  feature: Sparkles,
  success: Target,
};

export default function TipBanner({
  tipId,
  title,
  description,
  variant = 'info',
  icon,
  actionLabel,
  onAction,
  className = '',
}: TipBannerProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const wasDismissed = localStorage.getItem(`${DISMISSED_KEY_PREFIX}${tipId}`) === '1';
      setDismissed(wasDismissed);
    } catch {
      setDismissed(false);
    }
  }, [tipId]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try { localStorage.setItem(`${DISMISSED_KEY_PREFIX}${tipId}`, '1'); } catch { /* ignore */ }
  }, [tipId]);

  const styles = variantStyles[variant];
  const Icon = icon ?? defaultIcons[variant];

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className={className}
        >
          <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${styles.bg} ${styles.border}`}>
            <div className={`w-7 h-7 rounded-lg ${styles.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
              <Icon className={`w-3.5 h-3.5 ${styles.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-foreground leading-tight">{title}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{description}</p>
              {actionLabel && onAction && (
                <button
                  onClick={() => { onAction(); dismiss(); }}
                  className={`mt-2 text-[11px] font-semibold ${styles.iconColor} hover:underline`}
                >
                  {actionLabel}
                </button>
              )}
            </div>
            <button
              onClick={dismiss}
              className="p-1 rounded-md hover:bg-secondary/60 transition-colors shrink-0"
              aria-label="Dismiss tip"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const TIPS = {
  dashboardReorder: {
    tipId: 'dashboard-drag-reorder',
    title: 'Drag to reorder sections',
    description: 'Hover over a section and grab the handle on the left to rearrange your dashboard layout.',
    variant: 'feature' as TipVariant,
    icon: GripVertical,
  },
  dashboardCustomize: {
    tipId: 'dashboard-customize',
    title: 'Customize your dashboard',
    description: 'Use the "Customize" button to show or hide dashboard sections to focus on what matters most to you.',
    variant: 'info' as TipVariant,
  },
  backlogSaveFilters: {
    tipId: 'backlog-save-filters',
    title: 'Save your filter presets',
    description: 'Apply filters and click "Save Filter" to create reusable presets. Access them anytime from the Presets dropdown.',
    variant: 'feature' as TipVariant,
    icon: Bookmark,
  },
  backlogDragReorder: {
    tipId: 'backlog-drag-reorder',
    title: 'Prioritize by dragging',
    description: 'Drag items using the grip handle to reorder your backlog. Changes are saved automatically.',
    variant: 'info' as TipVariant,
    icon: GripVertical,
  },
  sidenavReorder: {
    tipId: 'sidenav-reorder',
    title: 'Personalize your navigation',
    description: 'Hover and drag nav icons to reorder them. Your layout is saved automatically.',
    variant: 'feature' as TipVariant,
    icon: GripVertical,
  },
} as const;
