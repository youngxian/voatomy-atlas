'use client';

import { useState } from 'react';
import {
  ArrowRight,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Edit3,
  Eye,
  EyeOff,
  GripVertical,
  Lightbulb,
  Pencil,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui';
import type {
  SprintTicket,
  TicketModificationSuggestion,
  DelayAnticipation,
  TicketFieldDefinition,
} from '@/lib/mock-data';
import {
  suggestionTypeConfig,
  delayRiskConfig,
  assigneeColors,
  assigneeInitials,
  statusColors,
  riskColors,
  aiTypeConfig,
  fieldTypeIcons,
} from '@/lib/ticket-utils';

// ---------------------------------------------------------------------------
// TicketUpdateCard
// ---------------------------------------------------------------------------

export function TicketUpdateCard({
  ticket,
  index,
  onEdit,
}: {
  ticket: SprintTicket;
  index: number;
  onEdit: (id: string) => void;
}) {
  const sCfg = statusColors[ticket.status] || statusColors.todo;
  const rColor = riskColors[ticket.risk] || riskColors.low;

  return (
    <div
      className="group bento-card rounded-2xl border border-border/50 bg-card p-4 transition-all"
      style={{ animation: `fadeSlideIn 0.3s ease-out ${index * 0.04}s both` }}
    >
      <div className="flex items-start gap-3">
        <span className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${sCfg.color} ${sCfg.chipBg} border ${sCfg.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sCfg.bg}`} />
          {sCfg.label}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-primary">{ticket.id}</span>
            <span className={`text-[10px] font-semibold uppercase ${rColor}`}>{ticket.risk}</span>
            {ticket.ai_type && aiTypeConfig[ticket.ai_type] && (() => {
              const cfg = aiTypeConfig[ticket.ai_type!];
              const TypeIcon = cfg.icon;
              return (
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${cfg.color} ${cfg.bg} border ${cfg.border}`}>
                  <TypeIcon className="w-2.5 h-2.5" />
                  {cfg.label}
                </span>
              );
            })()}
          </div>
          <p className="text-sm font-medium text-foreground leading-snug mb-2">{ticket.title}</p>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                style={{ backgroundColor: assigneeColors[ticket.assignee] || 'var(--muted-foreground)' }}
              >
                {assigneeInitials[ticket.assignee] || '??'}
              </span>
              {ticket.assignee}
            </span>
            <span className="font-mono font-semibold text-foreground">{ticket.atlasPoints} pts</span>
            <span className="text-[10px] text-secondary-foreground">module: {ticket.module}</span>
          </div>

          {ticket.signals.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {ticket.signals.map((sig, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-secondary border border-border/80 text-muted-foreground"
                >
                  {sig.label}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => onEdit(ticket.id)}
          className="shrink-0 w-8 h-8 rounded-lg bg-secondary hover:bg-muted border border-border/60 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
          title="Edit ticket"
        >
          <Pencil className="w-3.5 h-3.5 text-primary" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SuggestionCard
// ---------------------------------------------------------------------------

export function SuggestionCard({
  suggestion,
  index,
  onAccept,
  onDismiss,
}: {
  suggestion: TicketModificationSuggestion;
  index: number;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = suggestionTypeConfig[suggestion.type];
  const Icon = cfg.icon;

  if (suggestion.accepted === true) {
    return (
      <div
        className="rounded-xl border border-success/20 bg-success/10 p-4"
        style={{ animation: 'successPop 0.4s ease-out both' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
            <Check className="w-4 h-4 text-success" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-success">Accepted: {suggestion.title}</p>
            <p className="text-xs text-success/60">Applied to {suggestion.ticketId}</p>
          </div>
        </div>
      </div>
    );
  }

  if (suggestion.accepted === false) return null;

  return (
    <div
      className="rounded-xl border border-border/60 bg-card overflow-hidden hover:shadow-md transition-all"
      style={{ animation: `fadeSlideIn 0.3s ease-out ${index * 0.06}s both` }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-9 h-9 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}>
            <Icon className={`w-4 h-4 ${cfg.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[10px] font-bold uppercase ${cfg.color}`}>{cfg.label}</span>
              <span className="text-xs font-mono text-primary">{suggestion.ticketId}</span>
            </div>
            <p className="text-sm font-semibold text-foreground">{suggestion.title}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-xs font-bold tabular-nums ${
              suggestion.confidencePercent >= 80 ? 'text-success' : suggestion.confidencePercent >= 60 ? 'text-warning' : 'text-destructive'
            }`}>
              {suggestion.confidencePercent}%
            </span>
            <span className="text-[10px] text-secondary-foreground">conf.</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{suggestion.description}</p>

        <div className="flex flex-wrap gap-1 mb-3">
          {suggestion.signalSources.map((src) => (
            <span key={src} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-primary/8 border border-primary/15 text-primary">
              {src}
            </span>
          ))}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[11px] text-primary hover:text-warning transition-colors mb-3"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Less detail' : 'More detail'}
        </button>

        {expanded && (
          <div className="space-y-2 mb-3 text-xs text-muted-foreground bg-secondary rounded-lg p-3 border border-border/60">
            <div>
              <span className="font-semibold text-foreground">Reason: </span>
              {suggestion.reason}
            </div>
            <div>
              <span className="font-semibold text-foreground">Impact: </span>
              {suggestion.impact}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => onAccept(suggestion.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-warning text-white text-xs font-medium transition-colors"
          >
            <Check className="w-3 h-3" />
            Accept
          </button>
          <button
            onClick={() => onDismiss(suggestion.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-muted text-muted-foreground text-xs font-medium border border-border transition-colors"
          >
            <X className="w-3 h-3" />
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DelayCard
// ---------------------------------------------------------------------------

export function DelayCard({ delay, index }: { delay: DelayAnticipation; index: number }) {
  const [showMitigation, setShowMitigation] = useState(false);
  const cfg = delayRiskConfig[delay.risk];

  return (
    <div
      className={`rounded-xl border bg-card overflow-hidden transition-all ${
        delay.risk === 'imminent' ? 'border-destructive/40' : 'border-border/60'
      }`}
      style={{
        animation: `fadeSlideIn 0.4s ease-out ${index * 0.08}s both`,
        ...(delay.risk === 'imminent' ? { animation: `fadeSlideIn 0.4s ease-out ${index * 0.08}s both, riskPulse 3s ease-in-out infinite` } : {}),
      }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-primary">{delay.ticketId}</span>
            <Badge variant={cfg.badge}>{cfg.label}</Badge>
            {delay.revenueAtRisk && (
              <span className="text-[10px] font-semibold text-destructive flex items-center gap-0.5">
                <DollarSign className="w-3 h-3" />
                ${(delay.revenueAtRisk / 1000).toFixed(0)}K at risk
              </span>
            )}
          </div>
          <span className={`text-lg font-bold tabular-nums ${cfg.color}`}>{delay.probability}%</span>
        </div>

        <p className="text-sm font-medium text-foreground mb-2">{delay.ticketTitle}</p>

        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="w-3 h-3 text-secondary-foreground" />
            <span className="text-muted-foreground">Original:</span>
            <span className="font-mono font-bold text-foreground">{delay.originalEstimate} pts</span>
          </div>
          <ArrowRight className="w-3 h-3 text-destructive" />
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Revised:</span>
            <span className={`font-mono font-bold ${cfg.color}`}>{delay.revisedEstimate} pts</span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-destructive/10 text-[10px] font-bold text-destructive">
            +{delay.delayDays}d delay
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
            style={{ backgroundColor: assigneeColors[delay.assignee] || 'var(--muted-foreground)' }}
          >
            {assigneeInitials[delay.assignee] || '??'}
          </span>
          <span className="text-xs text-muted-foreground">{delay.assignee}</span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{delay.reason}</p>

        {delay.impactedTickets.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-[10px] text-muted-foreground">Impacts:</span>
            {delay.impactedTickets.map((t) => (
              <span key={t} className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-destructive/8 text-destructive border border-destructive/15">
                {t}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={() => setShowMitigation(!showMitigation)}
          className="flex items-center gap-1.5 text-[11px] text-primary hover:text-warning font-medium transition-colors"
        >
          <Lightbulb className="w-3 h-3" />
          {showMitigation ? 'Hide mitigation plan' : 'View ATLAS mitigation plan'}
          {showMitigation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showMitigation && (
          <div className="mt-3 rounded-lg bg-primary/5 border border-primary/15 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Brain className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">AI Mitigation Plan</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{delay.mitigation}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FieldRow
// ---------------------------------------------------------------------------

export function FieldRow({
  field,
  index,
  onToggleVisibility,
}: {
  field: TicketFieldDefinition;
  index: number;
  onToggleVisibility: (id: string) => void;
}) {
  const FieldIcon = fieldTypeIcons[field.type] || Edit3;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
        field.visible
          ? 'bg-card border-border/60 hover:border-border'
          : 'bg-secondary/50 border-border/40 opacity-60'
      }`}
      style={{ animation: `fadeSlideIn 0.2s ease-out ${index * 0.03}s both` }}
    >
      <GripVertical className="w-3.5 h-3.5 text-muted-foreground cursor-grab shrink-0" />
      <div className="w-7 h-7 rounded-md bg-primary/8 border border-primary/15 flex items-center justify-center shrink-0">
        <FieldIcon className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{field.label}</span>
          {field.required && (
            <span className="text-[9px] font-bold text-destructive uppercase">Required</span>
          )}
        </div>
        <p className="text-[10px] text-secondary-foreground truncate">{field.description}</p>
      </div>
      <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded border border-border/60 shrink-0">
        {field.type}
      </span>
      {field.options && (
        <span className="text-[10px] text-secondary-foreground shrink-0">{field.options.length} opts</span>
      )}
      <button
        onClick={() => onToggleVisibility(field.id)}
        className="shrink-0 w-7 h-7 rounded-md bg-secondary hover:bg-muted border border-border/60 flex items-center justify-center transition-colors"
        title={field.visible ? 'Hide field' : 'Show field'}
      >
        {field.visible ? (
          <Eye className="w-3 h-3 text-primary" />
        ) : (
          <EyeOff className="w-3 h-3 text-secondary-foreground" />
        )}
      </button>
    </div>
  );
}
