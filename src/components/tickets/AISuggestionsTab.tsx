'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Brain,
  Check,
  Loader2,
  Wand2,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui';
import type { TicketModificationSuggestion } from '@/lib/mock-data';
import * as api from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { mapAPISuggestionToMock } from '@/lib/ticket-utils';
import { SuggestionCard } from './ticket-cards';

export function AISuggestionsTab({ apiSuggestions }: { apiSuggestions?: api.TicketSuggestion[] | null }) {
  const { activeProjectId } = useProject();
  const [suggestions, setSuggestions] = useState<TicketModificationSuggestion[]>([]);

  useEffect(() => {
    if (apiSuggestions == null) {
      setSuggestions([]);
      return;
    }
    setSuggestions(apiSuggestions.map(mapAPISuggestionToMock));
  }, [apiSuggestions]);

  const handleAccept = async (id: string) => {
    const suggestion = suggestions.find((s) => s.id === id);
    if (!suggestion) return;
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, accepted: true } : s))
    );
    if (activeProjectId) {
      if (suggestion.type === 're-estimate' && suggestion.ticketId) {
        try {
          await api.estimateTickets(activeProjectId, [suggestion.ticketId]);
        } catch {
          // Revert UI on failure
          setSuggestions((prev) =>
            prev.map((s) => (s.id === id ? { ...s, accepted: null } : s))
          );
          return;
        }
      }
      api.acceptSuggestion(activeProjectId, id).catch((err) => console.error('Failed to accept suggestion', err));
    }
  };

  const handleDismiss = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, accepted: false } : s))
    );
    if (activeProjectId) {
      api.dismissSuggestion(activeProjectId, id).catch((err) => console.error('Failed to dismiss suggestion', err));
    }
  };

  if (!activeProjectId) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No active project selected</p>
      </div>
    );
  }

  if (apiSuggestions === null) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Loading suggestions...</span>
      </div>
    );
  }

  const pending = suggestions.filter((s) => s.accepted === null);
  const accepted = suggestions.filter((s) => s.accepted === true);
  const dismissed = suggestions.filter((s) => s.accepted === false);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="bento-card rounded-2xl">
          <div className="flex items-center gap-2 mb-1">
            <Wand2 className="w-4 h-4 text-primary" />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pending</p>
          </div>
          <p className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>{pending.length}</p>
        </Card>
        <Card className="bento-card rounded-2xl">
          <div className="flex items-center gap-2 mb-1">
            <Check className="w-4 h-4 text-success" />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Accepted</p>
          </div>
          <p className="text-2xl font-bold text-success" style={{ fontFamily: 'var(--font-serif)' }}>{accepted.length}</p>
        </Card>
        <Card className="bento-card rounded-2xl">
          <div className="flex items-center gap-2 mb-1">
            <X className="w-4 h-4 text-secondary-foreground" />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Dismissed</p>
          </div>
          <p className="text-2xl font-bold text-secondary-foreground" style={{ fontFamily: 'var(--font-serif)' }}>{dismissed.length}</p>
        </Card>
      </div>

      {/* AI context card */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary">ATLAS Ticket Intelligence</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          ATLAS analyzed sprint tickets against code complexity, capacity signals, historical velocity, and customer data.
          Found {suggestions.length} optimization opportunities with an average confidence of{' '}
          <span className="font-bold text-foreground">
            {suggestions.length > 0
              ? `${Math.round(suggestions.reduce((s, sg) => s + sg.confidencePercent, 0) / suggestions.length)}%`
              : '—'}
          </span>.
        </p>
      </div>

      {/* Suggestions */}
      <div className="space-y-3">
        {suggestions.map((suggestion, idx) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            index={idx}
            onAccept={handleAccept}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  );
}
