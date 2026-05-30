'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, ThumbsUp, Star, Trash2, Clock, User, ExternalLink, CheckCircle2, Loader2, Ticket } from 'lucide-react';
import { Badge } from '@/components/ui';
import type { RetroItem, ActionItem } from '@/lib/retro-types';

/* ------------------------------------------------------------------ */
/*  Shared sub-components                                               */
/* ------------------------------------------------------------------ */

export function Avatar({ initials, color, size = 'sm' }: { initials: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-7 h-7 text-[10px]', md: 'w-9 h-9 text-xs', lg: 'w-11 h-11 text-sm' };
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}
    >
      {initials}
    </div>
  );
}

export function StarRating({ rating, maxStars = 5, animated = false }: { rating: number; maxStars?: number; animated?: boolean }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxStars }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const partial = !filled && i < rating;
        return (
          <Star
            key={i}
            className={`w-4 h-4 ${filled ? 'text-warning fill-warning' : partial ? 'text-warning fill-warning/50' : 'text-border'}`}
            style={animated ? { animation: `retro-star-pop 0.4s ease-out ${i * 0.1}s both` } : undefined}
          />
        );
      })}
    </div>
  );
}

function VoteButton({ count, onVote, disabled }: { count: number; onVote: () => void; disabled?: boolean }) {
  const [bumped, setBumped] = useState(false);
  return (
    <button
      onClick={() => { if (disabled) return; onVote(); setBumped(true); setTimeout(() => setBumped(false), 300); }}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-card border border-border transition-all duration-200 group ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/40 hover:bg-primary/5'}`}
    >
      <ThumbsUp
        className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors"
        style={bumped ? { animation: 'retro-vote-bump 0.3s ease-out' } : undefined}
      />
      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground tabular-nums transition-colors">{count}</span>
    </button>
  );
}

function RetroCard({ item, accentColor, onVote, onDelete, voteDisabled }: { item: RetroItem; accentColor: string; onVote: () => void; onDelete?: () => void; voteDisabled?: boolean }) {
  return (
    <div
      className="retro-card-anim bento-card p-3 rounded-lg bg-card border border-border hover:border-opacity-60 transition-all duration-200 group/card"
      style={{ borderLeftWidth: '3px', borderLeftColor: accentColor }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-foreground leading-relaxed mb-3 flex-1">{item.text}</p>
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover/card:opacity-100"
            title="Delete item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar initials={item.authorInitials} color={item.authorColor} />
          <span className="text-xs text-muted-foreground">{item.author}</span>
        </div>
        <VoteButton count={item.votes} onVote={onVote} disabled={voteDisabled} />
      </div>
    </div>
  );
}

function ActionCard({
  item,
  onVote,
  onDelete,
  onTrackAction,
  onMarkComplete,
  voteDisabled,
  trackDisabled,
  completeDisabled,
  canEdit,
}: {
  item: ActionItem;
  onVote: () => void;
  onDelete?: () => void;
  onTrackAction?: () => void;
  onMarkComplete?: () => void;
  voteDisabled?: boolean;
  trackDisabled?: boolean;
  completeDisabled?: boolean;
  canEdit?: boolean;
}) {
  const hasLinkedTicket = !!(item.externalTicketUrl || item.externalTicketId);
  const isCompleted = item.completed;

  return (
    <div
      className={`retro-card-anim bento-card p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-all duration-200 group/card ${isCompleted ? 'opacity-75' : ''}`}
      style={{ borderLeftWidth: '3px', borderLeftColor: isCompleted ? 'var(--success)' : 'var(--primary)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isCompleted && (
              <span title="Completed" className="shrink-0">
                <CheckCircle2 className="w-4 h-4 text-success" />
              </span>
            )}
            <p className={`text-sm text-foreground leading-relaxed flex-1 ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
              {item.text}
            </p>
          </div>
        </div>
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover/card:opacity-100 shrink-0"
            title="Delete item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <User className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{item.owner}</span>
        </div>
        <span className="text-border">|</span>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{item.due}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && onMarkComplete && (
            <button
              onClick={onMarkComplete}
              disabled={completeDisabled}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                isCompleted
                  ? 'bg-success/15 text-success border border-success/30'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border'
              } ${completeDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isCompleted ? 'Completed' : 'Mark complete'}
            >
              {completeDisabled ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3 h-3" />
              )}
              {isCompleted ? 'Done' : 'Mark done'}
            </button>
          )}
          {canEdit && onTrackAction && !hasLinkedTicket && (
            <button
              onClick={onTrackAction}
              disabled={trackDisabled}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-all disabled:opacity-50"
              title="Create board ticket from this action"
            >
              {trackDisabled ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ticket className="w-3 h-3" />}
              Create Ticket
            </button>
          )}
          {hasLinkedTicket && (
            <a
              href={item.externalTicketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-all"
              title="View linked ticket"
            >
              <ExternalLink className="w-3 h-3" />
              {item.externalTicketId || 'View ticket'}
            </a>
          )}
          <Badge variant={item.due === 'Immediate' ? 'danger' : 'orange'}>
            {item.due === 'Immediate' ? 'Urgent' : 'Planned'}
          </Badge>
        </div>
        <VoteButton count={item.votes} onVote={onVote} disabled={voteDisabled} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AddItemForm — the unified inline form (replaces 3 duplicates)      */
/* ------------------------------------------------------------------ */

function AddItemForm({
  accentColor,
  accentVar,
  placeholder,
  newItemText,
  onTextChange,
  onAdd,
  onCancel,
  adding,
}: {
  accentColor: string;
  accentVar: string;
  placeholder: string;
  newItemText: string;
  onTextChange: (v: string) => void;
  onAdd: () => void;
  onCancel: () => void;
  adding: boolean;
}) {
  return (
    <div className={`p-3 rounded-lg bg-card border border-${accentColor}/30`} style={{ borderLeftWidth: '3px', borderLeftColor: `var(--${accentVar})` }}>
      <textarea
        autoFocus
        value={newItemText}
        onChange={e => onTextChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onAdd(); } if (e.key === 'Escape') onCancel(); }}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none mb-2"
        rows={2}
      />
      <div className="flex items-center justify-end gap-2">
        <button onClick={onCancel} className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
        <button onClick={onAdd} disabled={adding || !newItemText.trim()} className={`px-3 py-1 text-xs font-medium bg-${accentColor}/20 text-${accentColor} border border-${accentColor}/30 rounded-md hover:bg-${accentColor}/30 transition-all disabled:opacity-50`}>
          {adding ? 'Adding…' : 'Add'}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  RetroSection — collapsible column with built-in add form           */
/* ------------------------------------------------------------------ */

export interface RetroSectionProps {
  title: string;
  icon: React.ElementType;
  accentColor: string;
  accentVar: string;
  expanded: boolean;
  onToggle: () => void;
  category: 'went_well' | 'to_improve' | 'action_item';
  items: RetroItem[];
  actionItems?: ActionItem[];
  addingCategory: string | null;
  onStartAdd: () => void;
  onCancelAdd: () => void;
  newItemText: string;
  onNewItemTextChange: (v: string) => void;
  onAdd: () => void;
  addingInFlight: boolean;
  canEdit: boolean;
  onVote: (id: string) => void;
  onDelete: (id: string) => void;
  onTrackAction?: (id: string) => void;
  onMarkComplete?: (id: string) => void;
  getVotes: (id: string, base: number) => number;
  votingIds: Set<string>;
  trackIds?: Set<string>;
  completeIds?: Set<string>;
  placeholder: string;
}

export function RetroSection({
  title,
  icon: Icon,
  accentColor,
  accentVar,
  expanded,
  onToggle,
  category,
  items,
  actionItems,
  addingCategory,
  onStartAdd,
  onCancelAdd,
  newItemText,
  onNewItemTextChange,
  onAdd,
  addingInFlight,
  canEdit,
  onVote,
  onDelete,
  onTrackAction,
  onMarkComplete,
  getVotes,
  votingIds,
  trackIds = new Set(),
  completeIds = new Set(),
  placeholder,
}: RetroSectionProps) {
  const isAdding = addingCategory === category;
  const count = actionItems ? actionItems.length : items.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={`section-${category}`}
          className="flex items-center gap-2.5 group"
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${accentColor}/10 border border-${accentColor}/20`}>
            <Icon className={`w-4 h-4 text-${accentColor}`} />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            <span className="text-xs text-muted-foreground">{count} items</span>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {canEdit && (
          <button
            onClick={() => isAdding ? onCancelAdd() : onStartAdd()}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-${accentColor} bg-${accentColor}/10 border border-${accentColor}/20 hover:bg-${accentColor}/15 transition-all`}
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        )}
      </div>
      {expanded && (
        <div id={`section-${category}`} role="region" aria-label={title} className="space-y-3">
          {isAdding && (
            <AddItemForm
              accentColor={accentColor}
              accentVar={accentVar}
              placeholder={placeholder}
              newItemText={newItemText}
              onTextChange={onNewItemTextChange}
              onAdd={onAdd}
              onCancel={onCancelAdd}
              adding={addingInFlight}
            />
          )}
          {actionItems
            ? actionItems.map((item, i) => (
                <div key={item.id} style={{ animationDelay: `${i * 0.08}s` }}>
                  <ActionCard
                    item={{ ...item, votes: getVotes(item.id, item.votes) }}
                    onVote={() => onVote(item.id)}
                    onDelete={canEdit ? () => onDelete(item.id) : undefined}
                    onTrackAction={canEdit && onTrackAction ? () => onTrackAction(item.id) : undefined}
                    onMarkComplete={canEdit && onMarkComplete ? () => onMarkComplete(item.id) : undefined}
                    voteDisabled={votingIds.has(item.id)}
                    trackDisabled={trackIds.has(item.id)}
                    completeDisabled={completeIds.has(item.id)}
                    canEdit={canEdit}
                  />
                </div>
              ))
            : items.map((item, i) => (
                <div key={item.id} style={{ animationDelay: `${i * 0.08}s` }}>
                  <RetroCard
                    item={{ ...item, votes: getVotes(item.id, item.votes) }}
                    accentColor={`var(--${accentVar})`}
                    onVote={() => onVote(item.id)}
                    onDelete={canEdit ? () => onDelete(item.id) : undefined}
                    voteDisabled={votingIds.has(item.id)}
                  />
                </div>
              ))}
        </div>
      )}
    </div>
  );
}
