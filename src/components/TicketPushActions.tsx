'use client';

import { useState } from 'react';
import clsx from 'clsx';
import {
  Upload,
  MessageSquare,
  Tag,
  Loader2,
  Check,
  AlertTriangle,
  ChevronDown,
  X,
} from 'lucide-react';
import {
  pushTicketStatus,
  pushTicketComment,
  pushTicketLabel,
  type Ticket,
} from '@/lib/api';
import { getProviderLabelByKey, getProviderColorByKey } from '@/lib/project-utils';

interface TicketPushActionsProps {
  projectId: string;
  ticket: Ticket;
  provider: string;
  className?: string;
}

type PushState = 'idle' | 'loading' | 'success' | 'error';

interface ActionState {
  status: PushState;
  error?: string;
}

export default function TicketPushActions({
  projectId,
  ticket,
  provider,
  className,
}: TicketPushActionsProps) {
  const [statusState, setStatusState] = useState<ActionState>({ status: 'idle' });
  const [commentState, setCommentState] = useState<ActionState>({ status: 'idle' });
  const [labelState, setLabelState] = useState<ActionState>({ status: 'idle' });

  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [labelOpen, setLabelOpen] = useState(false);
  const [labelText, setLabelText] = useState('');

  const providerLabel = getProviderLabelByKey(provider);
  const providerColor = getProviderColorByKey(provider);

  const handlePushStatus = async () => {
    setStatusState({ status: 'loading' });
    try {
      await pushTicketStatus(projectId, ticket.id, ticket.status);
      setStatusState({ status: 'success' });
      setTimeout(() => setStatusState({ status: 'idle' }), 3000);
    } catch (err) {
      setStatusState({ status: 'error', error: err instanceof Error ? err.message : 'Push failed' });
      setTimeout(() => setStatusState({ status: 'idle' }), 5000);
    }
  };

  const handlePushComment = async () => {
    if (!commentText.trim()) return;
    setCommentState({ status: 'loading' });
    try {
      await pushTicketComment(projectId, ticket.id, commentText.trim());
      setCommentState({ status: 'success' });
      setCommentText('');
      setCommentOpen(false);
      setTimeout(() => setCommentState({ status: 'idle' }), 3000);
    } catch (err) {
      setCommentState({ status: 'error', error: err instanceof Error ? err.message : 'Push failed' });
      setTimeout(() => setCommentState({ status: 'idle' }), 5000);
    }
  };

  const handlePushLabel = async () => {
    if (!labelText.trim()) return;
    setLabelState({ status: 'loading' });
    try {
      await pushTicketLabel(projectId, ticket.id, labelText.trim());
      setLabelState({ status: 'success' });
      setLabelText('');
      setLabelOpen(false);
      setTimeout(() => setLabelState({ status: 'idle' }), 3000);
    } catch (err) {
      setLabelState({ status: 'error', error: err instanceof Error ? err.message : 'Push failed' });
      setTimeout(() => setLabelState({ status: 'idle' }), 5000);
    }
  };

  function renderStateIcon(state: ActionState) {
    if (state.status === 'loading') return <Loader2 className="w-3 h-3 animate-spin" />;
    if (state.status === 'success') return <Check className="w-3 h-3 text-success" />;
    if (state.status === 'error') return <AlertTriangle className="w-3 h-3 text-destructive" />;
    return null;
  }

  return (
    <div className={clsx('space-y-2', className)}>
      <div className="flex items-center gap-2 mb-1">
        <span className={clsx('text-[8px] font-bold text-white px-1 py-[1px] rounded', providerColor)}>
          {providerLabel}
        </span>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Push to Provider
        </span>
      </div>

      {/* Push Status */}
      <button
        onClick={handlePushStatus}
        disabled={statusState.status === 'loading'}
        className={clsx(
          'w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors text-left',
          statusState.status === 'error'
            ? 'border-destructive/30 bg-destructive/5 text-destructive'
            : statusState.status === 'success'
              ? 'border-success/30 bg-success/5 text-success'
              : 'border-border/60 bg-secondary/30 text-secondary-foreground hover:bg-secondary/60',
        )}
      >
        <Upload className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1">
          Push status <span className="font-semibold text-foreground">&ldquo;{ticket.status}&rdquo;</span> to {providerLabel}
        </span>
        {renderStateIcon(statusState)}
      </button>

      {/* Add Comment */}
      <div>
        <button
          onClick={() => { setCommentOpen(!commentOpen); setLabelOpen(false); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 bg-secondary/30 text-xs font-medium text-secondary-foreground hover:bg-secondary/60 transition-colors text-left"
        >
          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1">Add comment on {providerLabel}</span>
          {renderStateIcon(commentState) || (
            <ChevronDown className={clsx('w-3 h-3 transition-transform', commentOpen && 'rotate-180')} />
          )}
        </button>
        {commentOpen && (
          <div className="mt-1.5 px-3 py-2 rounded-lg border border-border/60 bg-card space-y-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              className="w-full text-xs bg-transparent text-foreground placeholder:text-muted-foreground resize-none outline-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => { setCommentOpen(false); setCommentText(''); }}
                className="px-2 py-1 rounded text-[10px] text-muted-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePushComment}
                disabled={!commentText.trim() || commentState.status === 'loading'}
                className="px-3 py-1 rounded text-[10px] font-semibold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {commentState.status === 'loading' ? 'Pushing...' : 'Push Comment'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Push Label */}
      <div>
        <button
          onClick={() => { setLabelOpen(!labelOpen); setCommentOpen(false); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 bg-secondary/30 text-xs font-medium text-secondary-foreground hover:bg-secondary/60 transition-colors text-left"
        >
          <Tag className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1">Sync label to {providerLabel}</span>
          {renderStateIcon(labelState) || (
            <ChevronDown className={clsx('w-3 h-3 transition-transform', labelOpen && 'rotate-180')} />
          )}
        </button>
        {labelOpen && (
          <div className="mt-1.5 px-3 py-2 rounded-lg border border-border/60 bg-card space-y-2">
            <input
              type="text"
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              placeholder="Label name..."
              className="w-full text-xs bg-transparent text-foreground placeholder:text-muted-foreground outline-none py-1 border-b border-border/40"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => { setLabelOpen(false); setLabelText(''); }}
                className="px-2 py-1 rounded text-[10px] text-muted-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePushLabel}
                disabled={!labelText.trim() || labelState.status === 'loading'}
                className="px-3 py-1 rounded text-[10px] font-semibold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {labelState.status === 'loading' ? 'Pushing...' : 'Push Label'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error message display */}
      {(statusState.error || commentState.error || labelState.error) && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/5 border border-destructive/15 text-xs text-destructive">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span className="flex-1">{statusState.error || commentState.error || labelState.error}</span>
          <button
            onClick={() => {
              setStatusState({ status: 'idle' });
              setCommentState({ status: 'idle' });
              setLabelState({ status: 'idle' });
            }}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
