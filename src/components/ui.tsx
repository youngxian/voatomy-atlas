'use client';

import React, { useId } from 'react';
import clsx from 'clsx';
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import {
  ArrowUpRight,
  Inbox,
  Loader2,
  Check,
} from 'lucide-react';

// =============================================================================
// Badge
// =============================================================================

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'accent' | 'orange' | 'gradient';

const badgeVariants: Record<BadgeVariant, string> = {
  success: 'bg-success/8 text-success border-success/12 shadow-[0_1px_4px_rgba(22,163,74,0.06)]',
  warning: 'bg-warning/8 text-warning border-warning/12 shadow-[0_1px_4px_rgba(202,138,4,0.06)]',
  danger: 'bg-destructive/8 text-destructive border-destructive/12 shadow-[0_1px_4px_rgba(226,45,45,0.06)]',
  info: 'bg-primary/8 text-accent-foreground border-primary/12 shadow-[0_1px_4px_rgba(34,197,94,0.06)]',
  muted: 'bg-secondary text-muted-foreground border-border/80',
  accent: 'bg-primary/8 text-primary border-primary/12 shadow-[0_1px_4px_rgba(34,197,94,0.06)]',
  orange: 'bg-primary/8 text-primary border-primary/12',
  gradient: 'bg-gradient-to-r from-primary/10 to-primary/8 text-primary border-primary/15',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
  dotColor?: string;
}

export function Badge({ variant = 'muted', children, className, dot, dotColor }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-wide',
        badgeVariants[variant],
        className
      )}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: dotColor || 'currentColor' }}
        />
      )}
      {children}
    </span>
  );
}

// =============================================================================
// ProgressBar
// =============================================================================

type ProgressColor = 'accent' | 'green' | 'red' | 'yellow' | 'orange';
type ProgressSize = 'sm' | 'md' | 'lg';

const progressGradients: Record<ProgressColor, string> = {
  accent: 'from-primary to-primary/80',
  orange: 'from-primary to-primary/80',
  green: 'from-success to-success/80',
  red: 'from-destructive to-destructive/80',
  yellow: 'from-warning to-warning/80',
};

const progressSizes: Record<ProgressSize, string> = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2.5',
};

interface ProgressBarProps {
  percentage: number;
  color?: ProgressColor;
  size?: ProgressSize;
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export function ProgressBar({
  percentage,
  color = 'accent',
  size = 'md',
  showLabel = false,
  animated = false,
  className,
}: ProgressBarProps) {
  const clampedPct = Math.max(0, Math.min(100, percentage));

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div className={clsx('flex-1 bg-muted/80 rounded-full overflow-hidden', progressSizes[size])}>
        <div
          className={clsx(
            'h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out relative',
            progressGradients[color],
          )}
          style={{ width: `${clampedPct}%` }}
        >
          {animated && (
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div
                className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                style={{ animation: 'shimmer-slide 2s infinite' }}
              />
            </div>
          )}
        </div>
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground font-semibold tabular-nums min-w-[2.5rem] text-right">
          {Math.round(clampedPct)}%
        </span>
      )}
    </div>
  );
}

// =============================================================================
// Card
// =============================================================================

type CardVariant = 'default' | 'glass' | 'elevated' | 'gradient-border' | 'inset';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: CardVariant;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  role?: React.AriaRole;
  'aria-label'?: string;
}

export function Card({ children, className, variant = 'default', onClick, padding = 'md', role, 'aria-label': ariaLabel }: CardProps) {
  const reduceMotion = useReducedMotion();

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const variantClasses = {
    default: 'bg-card border border-border/50 shadow-sm shadow-black/5',
    glass: 'glass border border-white/40 shadow-layered',
    elevated: 'bg-card border border-border/40 shadow-layered',
    'gradient-border': 'bg-card gradient-border shadow-sm shadow-black/5',
    inset: 'bg-secondary/50 border border-border/40',
  };

  return (
    <motion.div
      onClick={onClick}
      whileHover={
        onClick && !reduceMotion ? { y: -2, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } } : undefined
      }
      whileTap={
        onClick && !reduceMotion ? { scale: 0.99 } : undefined
      }
      role={role}
      aria-label={ariaLabel}
      className={clsx(
        'rounded-2xl',
        'transition-all duration-200',
        variantClasses[variant],
        paddingClasses[padding],
        onClick && 'cursor-pointer hover:border-border hover:shadow-layered',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

// =============================================================================
// ExternalLink
// =============================================================================

interface ExternalLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function ExternalLink({ href, children, className }: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        'inline-flex items-center gap-1 text-sm text-primary hover:text-accent-foreground transition-colors font-medium',
        className
      )}
    >
      {children}
      <ArrowUpRight className="w-3.5 h-3.5" />
    </a>
  );
}

// =============================================================================
// ConfidenceScore
// =============================================================================

interface ConfidenceScoreProps {
  percentage: number;
  className?: string;
}

export function ConfidenceScore({ percentage, className }: ConfidenceScoreProps) {
  const clampedPct = Math.max(0, Math.min(100, percentage));

  let gradient: string;
  let textColor: string;
  if (clampedPct < 40) {
    gradient = 'from-destructive to-destructive/80';
    textColor = 'text-destructive';
  } else if (clampedPct < 70) {
    gradient = 'from-warning to-warning/80';
    textColor = 'text-warning';
  } else {
    gradient = 'from-success to-success/80';
    textColor = 'text-success';
  }

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div className="flex-1 h-1.5 bg-muted/80 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out', gradient)}
          style={{ width: `${clampedPct}%` }}
        />
      </div>
      <span className={clsx('text-xs font-bold tabular-nums', textColor)}>
        {Math.round(clampedPct)}%
      </span>
    </div>
  );
}

// =============================================================================
// StatusDot
// =============================================================================

type StatusDotVariant = 'live' | 'stale' | 'error' | 'disconnected';

const statusDotColors: Record<StatusDotVariant, string> = {
  live: 'bg-success',
  stale: 'bg-warning',
  error: 'bg-destructive',
  disconnected: 'bg-muted-foreground',
};

const statusDotGlows: Record<StatusDotVariant, string> = {
  live: 'shadow-[0_0_6px_rgba(22,163,74,0.4)]',
  stale: 'shadow-[0_0_6px_rgba(202,138,4,0.3)]',
  error: 'shadow-[0_0_6px_rgba(226,45,45,0.3)]',
  disconnected: '',
};

const statusDotLabels: Record<StatusDotVariant, string> = {
  live: 'Live',
  stale: 'Stale',
  error: 'Error',
  disconnected: 'Disconnected',
};

interface StatusDotProps {
  status: StatusDotVariant;
  showLabel?: boolean;
  className?: string;
}

export function StatusDot({ status, showLabel = false, className }: StatusDotProps) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5', className)}>
      <span className="relative flex h-2 w-2">
        {status === 'live' && (
          <span className={clsx('animate-ping absolute inline-flex h-full w-full rounded-full opacity-50', statusDotColors[status])} />
        )}
        <span
          className={clsx(
            'relative inline-flex w-2 h-2 rounded-full shrink-0',
            statusDotColors[status],
            statusDotGlows[status],
          )}
        />
      </span>
      {showLabel && (
        <span className="text-xs text-muted-foreground font-medium">{statusDotLabels[status]}</span>
      )}
    </span>
  );
}

// =============================================================================
// EmptyState
// =============================================================================

interface EmptyStateProps {
  icon?: React.ElementType;
  illustration?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  illustration,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
    >
      {illustration ? (
        <div className="mb-6 w-[240px] h-[192px] flex items-center justify-center">
          {illustration}
        </div>
      ) : (
        <div className="relative mb-5">
          <div className="absolute inset-0 bg-primary/[0.06] rounded-2xl blur-xl scale-150" />
          <div className="relative icon-box-violet w-14 h-14 rounded-2xl">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      )}
      <h3 className="text-lg font-bold text-foreground mb-2 font-serif">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">{description}</p>
      )}
      {children}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-3 mt-1">
          {actionLabel && onAction && (
            <Button variant="primary" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="secondary" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SignalBadge
// =============================================================================

interface SignalBadgeProps {
  name: string;
  status: StatusDotVariant;
  source?: string;
  className?: string;
}

export function SignalBadge({ name, status, source, className }: SignalBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card/80 border border-border/50 text-xs shadow-sm shadow-black/5',
        className
      )}
    >
      <StatusDot status={status} />
      <span className="font-semibold text-foreground">{name}</span>
      {source && (
        <span className="text-secondary-foreground">{source}</span>
      )}
    </span>
  );
}

// =============================================================================
// Button
// =============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'board-link';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-b from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 text-primary-foreground border-accent-foreground/30 shadow-[0_1px_2px_rgba(0,17,44,0.1),0_2px_4px_rgba(34,197,94,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]',
  secondary:
    'bg-card hover:bg-secondary text-secondary-foreground border-border shadow-[0_1px_2px_rgba(0,17,44,0.04)]',
  ghost:
    'bg-transparent hover:bg-secondary text-muted-foreground hover:text-foreground border-transparent',
  danger:
    'bg-destructive/8 hover:bg-destructive/12 text-destructive border-destructive/12 shadow-[0_1px_2px_rgba(226,45,45,0.06)]',
  'board-link':
    'bg-card hover:bg-secondary text-secondary-foreground border-border shadow-[0_1px_2px_rgba(0,17,44,0.04)]',
};

const buttonSizes: Record<ButtonSize, string> = {
  xs: 'px-2 py-0.5 text-[11px] gap-1 rounded-md',
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'px-4 py-2 text-sm gap-2 rounded-lg',
  lg: 'px-5 py-2.5 text-sm gap-2 rounded-xl',
};

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const reduceMotion = useReducedMotion();
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={!isDisabled && !reduceMotion ? { y: -1 } : undefined}
      whileTap={!isDisabled && !reduceMotion ? { scale: 0.98 } : undefined}
      disabled={isDisabled}
      className={clsx(
        'inline-flex items-center justify-center font-semibold border transition-all duration-200 whitespace-nowrap relative overflow-hidden',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        buttonVariants[variant],
        buttonSizes[size],
        variant === 'primary' && 'hover:shadow-[0_2px_4px_rgba(0,17,44,0.12),0_4px_8px_rgba(34,197,94,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]',
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
      {!loading && children}
      {variant === 'board-link' && !loading && <ArrowUpRight className="w-3.5 h-3.5" />}
    </motion.button>
  );
}

// =============================================================================
// Avatar
// =============================================================================

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

const avatarSizes: Record<AvatarSize, { container: string; text: string; status: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[8px]', status: 'w-1.5 h-1.5 -bottom-px -right-px ring-1' },
  sm: { container: 'w-7 h-7', text: 'text-[9px]', status: 'w-2 h-2 bottom-0 right-0 ring-[1.5px]' },
  md: { container: 'w-9 h-9', text: 'text-xs', status: 'w-2.5 h-2.5 bottom-0 right-0 ring-2' },
  lg: { container: 'w-11 h-11', text: 'text-sm', status: 'w-3 h-3 bottom-0 right-0 ring-2' },
};

interface AvatarProps {
  initials: string;
  name?: string;
  color?: string;
  size?: AvatarSize;
  status?: 'online' | 'offline' | 'busy';
  src?: string;
  className?: string;
}

export function Avatar({ initials, name, color, size = 'md', status, src, className }: AvatarProps) {
  const sizeConfig = avatarSizes[size];
  const statusColors = { online: 'bg-success', offline: 'bg-muted-foreground', busy: 'bg-destructive' };
  const bgColor = color || 'var(--primary)';

  return (
    <div className={clsx('relative inline-flex shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={name || initials}
          className={clsx('rounded-full object-cover', sizeConfig.container)}
        />
      ) : (
        <div
          className={clsx(
            'rounded-full flex items-center justify-center font-bold text-primary-foreground shadow-sm',
            sizeConfig.container,
            sizeConfig.text,
          )}
          style={{ backgroundColor: bgColor }}
          aria-label={name || initials}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={clsx(
            'absolute rounded-full ring-background',
            sizeConfig.status,
            statusColors[status],
          )}
        />
      )}
    </div>
  );
}

// =============================================================================
// Tooltip
// =============================================================================

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const tooltipId = useId();
  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <span className={clsx('relative group inline-flex', className)} tabIndex={0} aria-describedby={tooltipId}>
      {children}
      <span
        id={tooltipId}
        role="tooltip"
        className={clsx(
          'absolute z-50 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap',
          'bg-foreground text-primary-foreground/90 shadow-layered-lg',
          'opacity-0 scale-95 pointer-events-none',
          'group-hover:opacity-100 group-hover:scale-100',
          'group-focus-within:opacity-100 group-focus-within:scale-100',
          'transition-all duration-150',
          sideClasses[side],
        )}
      >
        {content}
      </span>
    </span>
  );
}

// =============================================================================
// Divider
// =============================================================================

interface DividerProps {
  label?: string;
  className?: string;
}

export function Divider({ label, className }: DividerProps) {
  if (!label) {
    return <div className={clsx('h-px bg-border/60', className)} />;
  }
  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <div className="flex-1 h-px bg-border/60" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-secondary-foreground">{label}</span>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  );
}

// =============================================================================
// Skeleton
// =============================================================================

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = 'text', width, height }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'skeleton animate-pulse',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded-md h-4',
        variant === 'rectangular' && 'rounded-xl',
        className,
      )}
      style={{ width, height }}
    />
  );
}

// =============================================================================
// Metric (KPI display)
// =============================================================================

interface MetricProps {
  label: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  accentColor?: string;
  icon?: React.ElementType;
  className?: string;
}

export function Metric({ label, value, delta, deltaLabel, accentColor, icon: Icon, className }: MetricProps) {
  const color = accentColor || 'var(--primary)';
  return (
    <div className={clsx('rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm shadow-black/5', className)}>
      <div className="h-1" style={{ background: `linear-gradient(to right, ${color}, color-mix(in srgb, ${color} 53%, transparent))` }} />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {Icon && (
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `color-mix(in srgb, ${color} 7%, transparent)` }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color }} />
            </div>
          )}
          <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary-foreground">{label}</span>
        </div>
        <p className="text-2xl font-bold tabular-nums text-foreground font-serif">
          {value}
        </p>
        {delta !== undefined && (
          <p className={clsx('text-xs font-medium mt-1', delta >= 0 ? 'text-success' : 'text-destructive')}>
            {delta >= 0 ? '+' : ''}{delta}% {deltaLabel || ''}
          </p>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Toggle
// =============================================================================

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, size = 'md', className, disabled }: ToggleProps) {
  const sizes = {
    sm: { track: 'w-8 h-[18px]', thumb: 'w-3.5 h-3.5', translate: 'translate-x-[14px]' },
    md: { track: 'w-10 h-[22px]', thumb: 'w-4 h-4', translate: 'translate-x-[18px]' },
  };
  const s = sizes[size];

  return (
    <label className={clsx('inline-flex items-center gap-2.5 select-none', disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={clsx(
          'relative inline-flex shrink-0 rounded-full p-0.5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
          s.track,
          checked ? 'bg-primary' : 'bg-muted',
        )}
      >
        <span
          className={clsx(
            'inline-flex items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200',
            s.thumb,
            checked ? s.translate : 'translate-x-0',
          )}
        >
          {checked && <Check className="w-2 h-2 text-primary" />}
        </span>
      </button>
      {label && <span className="text-sm text-secondary-foreground font-medium">{label}</span>}
    </label>
  );
}

// =============================================================================
// Input
// =============================================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ElementType;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, className, ...props }, ref) => {
    const inputId = useId();
    const errorId = useId();

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-secondary-foreground">{label}</label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Icon className="w-4 h-4 text-secondary-foreground" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-describedby={error ? errorId : undefined}
            aria-invalid={error ? true : undefined}
            className={clsx(
              'w-full rounded-lg border bg-card text-sm text-foreground placeholder-muted-foreground',
              'transition-all duration-200',
              'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/12',
              error
                ? 'border-destructive/40 focus:border-destructive focus:ring-destructive/12'
                : 'border-border',
              Icon ? 'pl-10 pr-3 py-2' : 'px-3 py-2',
              className,
            )}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} className="text-[11px] text-destructive font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

// =============================================================================
// SectionHeader — Consistent section heading with optional action slot
// =============================================================================

interface SectionHeaderProps {
  icon?: React.ElementType;
  iconClassName?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  as?: 'h2' | 'h3';
  className?: string;
}

export function SectionHeader({
  icon: Icon,
  iconClassName,
  title,
  subtitle,
  action,
  as: Tag = 'h2',
  className,
}: SectionHeaderProps) {
  return (
    <div className={clsx('flex items-center justify-between gap-3', className)}>
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && (
          <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border', iconClassName ?? 'bg-primary/8 border-primary/12')}>
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div className="min-w-0">
          <Tag className="text-sm font-semibold text-foreground leading-tight truncate">{title}</Tag>
          {subtitle && <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// =============================================================================
// DataCard — Enterprise metric card: label, value, trend/status, optional action
// =============================================================================

interface DataCardProps {
  icon?: React.ElementType;
  iconClassName?: string;
  label: string;
  value: React.ReactNode;
  unit?: string;
  trend?: React.ReactNode;
  status?: 'healthy' | 'at-risk' | 'over' | 'neutral';
  action?: React.ReactNode;
  className?: string;
}

const dataCardStatusColor: Record<string, string> = {
  healthy: 'text-success',
  'at-risk': 'text-warning',
  over: 'text-destructive',
  neutral: 'text-foreground',
};

export function DataCard({
  icon: Icon,
  iconClassName,
  label,
  value,
  unit,
  trend,
  status = 'neutral',
  action,
  className,
}: DataCardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-border bg-card p-4 space-y-2 bento-card',
        className,
      )}
      role="group"
      aria-label={label}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border', iconClassName ?? 'bg-muted border-border')}>
              <Icon className="w-3.5 h-3.5" />
            </div>
          )}
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={clsx('text-2xl font-bold tabular-nums', dataCardStatusColor[status])} style={{ fontFamily: 'var(--font-serif)' }}>
          {value}
        </span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {trend && <div className="text-[10px] text-muted-foreground">{trend}</div>}
    </div>
  );
}
