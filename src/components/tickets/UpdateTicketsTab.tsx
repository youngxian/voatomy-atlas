'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  Layers,
  Loader2,
  Pencil,
  Save,
  Square,
  X,
} from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { TicketIntelligenceIllustration } from '@/components/EmptyIllustrations';
import { type SprintTicket } from '@/lib/mock-data';
import * as api from '@/lib/api';
import { useTeamMembers } from '@/lib/queries';
import { useProject } from '@/lib/project-context';
import { statusColors, mapAPITicketToSprintTicket } from '@/lib/ticket-utils';
import { TicketUpdateCard } from './ticket-cards';

export function UpdateTicketsTab() {
  const { activeProjectId } = useProject();
  const { data: teamMembers = [] } = useTeamMembers(activeProjectId);
  const [editingTicket, setEditingTicket] = useState<string | null>(null);
  const [editedTickets, setEditedTickets] = useState<Record<string, Partial<SprintTicket>>>({});
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [rollbackError, setRollbackError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tickets, setTickets] = useState<SprintTicket[]>([]);
  const [ticketIdMap, setTicketIdMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'status' | 'priority' | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);

  useEffect(() => {
    if (!activeProjectId) {
      setLoading(false);
      setError('No active project selected. Please select a project first.');
      setTickets([]);
      setTicketIdMap({});
      return;
    }
    setLoading(true);
    setError(null);
    setTickets([]);
    setTicketIdMap({});
    api.getTickets(activeProjectId)
      .then((apiTickets) => {
        setTickets(apiTickets.map(mapAPITicketToSprintTicket));
        const idMap: Record<string, string> = {};
        apiTickets.forEach((t) => { idMap[t.external_id || t.id] = t.id; });
        setTicketIdMap(idMap);
      })
      .catch((err) => {
        setError(err instanceof api.APIError ? err.message : 'Failed to load tickets');
      })
      .finally(() => setLoading(false));
  }, [activeProjectId]);

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.assignee.toLowerCase().includes(q);
    }
    return true;
  });

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      const allIds = new Set(filteredTickets.map(t => t.id));
      const allSelected = filteredTickets.every(t => prev.has(t.id));
      return allSelected ? new Set() : allIds;
    });
  }, [filteredTickets]);

  const handleBulkStatusUpdate = useCallback(async (newStatus: string) => {
    if (!activeProjectId || selectedIds.size === 0) return;
    setBulkSaving(true);

    const snapshot = tickets.map(t => ({ ...t }));
    const statusReverseMap: Record<string, string> = {
      todo: 'todo', in_progress: 'in_progress', review: 'in_review', done: 'done',
    };

    setTickets(prev => prev.map(t =>
      selectedIds.has(t.id) ? { ...t, status: newStatus as SprintTicket['status'] } : t
    ));

    try {
      const ticketIds = [...selectedIds].map(id => ticketIdMap[id] || id);
      await api.bulkUpdateTickets(activeProjectId, {
        ticket_ids: ticketIds,
        status: statusReverseMap[newStatus] || newStatus,
      });
      setSelectedIds(new Set());
      setBulkAction(null);
    } catch {
      setTickets(snapshot);
      setRollbackError('Bulk update failed — changes reverted');
      setTimeout(() => setRollbackError(null), 3000);
    } finally {
      setBulkSaving(false);
    }
  }, [activeProjectId, selectedIds, tickets, ticketIdMap]);

  const handleBulkPriorityUpdate = useCallback(async (newPriority: string) => {
    if (!activeProjectId || selectedIds.size === 0) return;
    setBulkSaving(true);

    const snapshot = tickets.map(t => ({ ...t }));

    try {
      const ticketIds = [...selectedIds].map(id => ticketIdMap[id] || id);
      await api.bulkUpdateTickets(activeProjectId, {
        ticket_ids: ticketIds,
        priority: newPriority,
      });
      setSelectedIds(new Set());
      setBulkAction(null);
    } catch {
      setTickets(snapshot);
      setRollbackError('Bulk update failed — changes reverted');
      setTimeout(() => setRollbackError(null), 3000);
    } finally {
      setBulkSaving(false);
    }
  }, [activeProjectId, selectedIds, tickets, ticketIdMap]);

  const handleSave = async (id: string) => {
    const edits = editedTickets[id] || {};
    const snapshot = tickets.find(t => t.id === id);

    // Optimistic: update UI immediately
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...edits } : t)));
    setSaveSuccess(id);
    setEditingTicket(null);
    setTimeout(() => setSaveSuccess(null), 2000);

    if (activeProjectId) {
      const statusReverseMap: Record<string, string> = {
        todo: 'todo',
        in_progress: 'in_progress',
        review: 'in_review',
        done: 'done',
      };
      const apiUpdate: Parameters<typeof api.updateTicket>[2] = {};
      if (edits.title) apiUpdate.title = edits.title;
      if (edits.assignee) apiUpdate.assignee_id = edits.assignee;
      if (edits.status) apiUpdate.status = statusReverseMap[edits.status] as api.Ticket['status'];
      if (edits.atlasPoints !== undefined) apiUpdate.human_points = edits.atlasPoints;

      try {
        const internalId = ticketIdMap[id] || id;
        await api.updateTicket(activeProjectId, internalId, apiUpdate);
      } catch {
        if (snapshot) {
          setTickets((prev) => prev.map((t) => (t.id === id ? snapshot : t)));
        }
        setRollbackError(`Save failed for ${id} — changes reverted`);
        setTimeout(() => setRollbackError(null), 3000);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Loading tickets...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground mb-1">Unable to load tickets</p>
        <p className="text-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  const allSelected = filteredTickets.length > 0 && filteredTickets.every(t => selectedIds.has(t.id));
  const someSelected = selectedIds.size > 0;

  return (
    <div className="space-y-5">
      {/* Rollback error toast */}
      {rollbackError && (
        <div
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 flex items-center gap-3"
          style={{ animation: 'fadeSlideIn 0.2s ease-out both' }}
        >
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <span className="text-sm font-medium text-destructive">{rollbackError}</span>
          <button onClick={() => setRollbackError(null)} className="ml-auto p-1 rounded hover:bg-destructive/10 transition-colors">
            <X className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search tickets by title, ID, or assignee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1">
          {['all', 'todo', 'in_progress', 'review', 'done'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === s
                  ? 'bg-primary/10 border-primary/25 text-primary'
                  : 'bg-card border-border text-muted-foreground hover:border-border'
              }`}
            >
              {s === 'all' ? 'All' : statusColors[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {someSelected && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20"
          style={{ animation: 'fadeSlideIn 0.2s ease-out both' }}
        >
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            {selectedIds.size} selected
          </button>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">Set status:</span>
            {['todo', 'in_progress', 'review', 'done'].map(s => (
              <button
                key={s}
                disabled={bulkSaving}
                onClick={() => handleBulkStatusUpdate(s)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-border bg-card hover:bg-secondary hover:border-primary/30 text-foreground transition-colors disabled:opacity-50"
              >
                {statusColors[s]?.label || s}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-border" />
          <button
            onClick={() => { setSelectedIds(new Set()); setBulkAction(null); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
          >
            Clear selection
          </button>
          {bulkSaving && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />}
        </div>
      )}

      {/* Empty state */}
      {filteredTickets.length === 0 && (
        <EmptyState
          icon={Layers}
          title="No tickets found"
          description={
            searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters or search query.'
              : 'Sync your board to let ATLAS analyze tickets with AI-powered risk scoring, duplicate detection, and smart estimation.'
          }
          illustration={<TicketIntelligenceIllustration className="w-[220px] h-[176px]" />}
        />
      )}

      {/* Select all row */}
      {filteredTickets.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {allSelected
              ? <CheckSquare className="w-3.5 h-3.5 text-primary" />
              : <Square className="w-3.5 h-3.5" />
            }
            Select all ({filteredTickets.length})
          </button>
        </div>
      )}

      {/* Ticket list */}
      <div className="space-y-2">
        {filteredTickets.map((ticket, idx) => {
          const isEditing = editingTicket === ticket.id;
          const wasSaved = saveSuccess === ticket.id;
          const isSelected = selectedIds.has(ticket.id);

          if (wasSaved) {
            return (
              <div
                key={ticket.id}
                className="rounded-xl border border-success/20 bg-success/10 p-4 flex items-center gap-3"
                style={{ animation: 'successPop 0.3s ease-out both' }}
              >
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span className="text-sm font-medium text-success">{ticket.id} saved successfully</span>
              </div>
            );
          }

          if (isEditing) {
            const edits = editedTickets[ticket.id] || {};
            return (
              <div
                key={ticket.id}
                className="rounded-xl border-2 border-primary/40 bg-card p-5 shadow-lg"
                style={{ animation: 'borderGlow 2s ease-in-out infinite' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-foreground">Editing {ticket.id}</span>
                  </div>
                  <button
                    onClick={() => setEditingTicket(null)}
                    className="p-1 rounded-md hover:bg-secondary transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Title</label>
                    <input
                      type="text"
                      defaultValue={ticket.title}
                      onChange={(e) => setEditedTickets((prev) => ({ ...prev, [ticket.id]: { ...prev[ticket.id], title: e.target.value } }))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Assignee</label>
                    <select
                      defaultValue={ticket.assignee === 'Unassigned' ? '' : ticket.assignee}
                      onChange={(e) => setEditedTickets((prev) => ({ ...prev, [ticket.id]: { ...prev[ticket.id], assignee: e.target.value || undefined } }))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">ATLAS Points</label>
                    <input
                      type="number"
                      defaultValue={ticket.atlasPoints}
                      onChange={(e) => setEditedTickets((prev) => ({ ...prev, [ticket.id]: { ...prev[ticket.id], atlasPoints: Number(e.target.value) } }))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <select
                      defaultValue={ticket.status}
                      onChange={(e) => setEditedTickets((prev) => ({ ...prev, [ticket.id]: { ...prev[ticket.id], status: e.target.value as SprintTicket['status'] } }))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSave(ticket.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-warning text-white text-sm font-medium transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingTicket(null)}
                    className="px-4 py-2 rounded-lg bg-secondary hover:bg-muted text-muted-foreground text-sm font-medium border border-border transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={ticket.id} className="flex items-start gap-2">
              <button
                onClick={() => toggleSelect(ticket.id)}
                className={`mt-4 shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-primary text-white'
                    : 'border border-border hover:border-primary/40 text-transparent hover:text-muted-foreground'
                }`}
              >
                {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
              </button>
              <div className="flex-1 min-w-0">
                <TicketUpdateCard
                  ticket={ticket}
                  index={idx}
                  onEdit={setEditingTicket}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
