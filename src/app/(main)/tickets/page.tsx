'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  Brain,
  Copy,
  Edit3,
  RefreshCw,
  Shield,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import * as api from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { animationStyles } from '@/lib/ticket-utils';
import { UpdateTicketsTab } from '@/components/tickets/UpdateTicketsTab';
import { AISuggestionsTab } from '@/components/tickets/AISuggestionsTab';
import { NextSprintTab } from '@/components/tickets/NextSprintTab';
import { AnticipateDelaysTab } from '@/components/tickets/AnticipateDelaysTab';
import { AICleanupTab } from '@/components/tickets/AICleanupTab';
import { VulnScanTab } from '@/components/tickets/VulnScanTab';

// ---------------------------------------------------------------------------
// Tab definition
// ---------------------------------------------------------------------------

type TabId = 'update' | 'suggestions' | 'next-sprint' | 'delays' | 'cleanup' | 'security';

type TabDef = { id: TabId; label: string; icon: React.ElementType; badge?: number | string };

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function TicketIntelligencePage() {
  const { activeProjectId } = useProject();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>('update');

  useEffect(() => {
    if (searchParams.get('suggest') === 'estimate') setActiveTab('suggestions');
  }, [searchParams]);
  const [apiSuggestions, setApiSuggestions] = useState<api.TicketSuggestion[] | null>(null);
  const [apiDelayRisks, setApiDelayRisks] = useState<api.DelayRisk[] | null>(null);
  const [apiNextSprint, setApiNextSprint] = useState<api.NextSprintRecommendation | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  useEffect(() => {
    if (!activeProjectId) {
      setApiSuggestions(null);
      setApiDelayRisks(null);
      setApiNextSprint(null);
      return;
    }
    setApiSuggestions(null);
    setApiDelayRisks(null);
    setApiNextSprint(null);
    api.getTicketSuggestions(activeProjectId).then(d => setApiSuggestions(Array.isArray(d) ? d : null)).catch((err) => console.error('Failed to load ticket suggestions', err));
    api.getDelayRisks(activeProjectId).then(d => setApiDelayRisks(Array.isArray(d) ? d : null)).catch((err) => console.error('Failed to load delay risks', err));
    api.getNextSprintRecommendation(activeProjectId).then(setApiNextSprint).catch((err) => console.error('Failed to load next sprint recommendation', err));
    api.indexProjectTickets(activeProjectId).catch((err) => console.error('Failed to index tickets', err));
  }, [activeProjectId]);

  const suggestionsBadge = Array.isArray(apiSuggestions) ? apiSuggestions.length : undefined;
  const nextSprintBadge =
    apiNextSprint != null && Array.isArray(apiNextSprint.tickets) ? apiNextSprint.tickets.length : undefined;
  const delaysHighCount = Array.isArray(apiDelayRisks)
    ? apiDelayRisks.filter((d) => d.risk_level === 'critical' || d.risk_level === 'high').length
    : undefined;

  const tabs: TabDef[] = [
    { id: 'update', label: 'Update Tickets', icon: Edit3 },
    { id: 'suggestions', label: 'AI Suggestions', icon: Wand2, badge: suggestionsBadge },
    { id: 'next-sprint', label: 'Next Sprint', icon: Sparkles, badge: nextSprintBadge },
    { id: 'delays', label: 'Anticipate Delays', icon: AlertTriangle, badge: delaysHighCount },
    { id: 'cleanup', label: 'AI Cleanup', icon: Copy },
    { id: 'security', label: 'Security Scan', icon: Shield },
  ];

  return (
    <>
      <Reveal>
        <div className="space-y-6 pb-10">
          {/* Header */}
          <div className="rounded-2xl page-header-gradient p-5 -mx-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
                  Ticket Intelligence
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Update tickets, review AI suggestions, plan next sprints, and anticipate delays
                </p>
              </div>
              <button
                disabled={syncing || !activeProjectId}
                onClick={async () => {
                  if (!activeProjectId) return;
                  setSyncing(true);
                  setSyncResult(null);
                  try {
                    const result = await api.triggerSync(activeProjectId);
                    setSyncResult(`Synced ${result.tickets_synced} ticket${result.tickets_synced !== 1 ? 's' : ''}`);
                    setTimeout(() => setSyncResult(null), 4000);
                    api.indexProjectTickets(activeProjectId).catch((err) => console.error('Failed to index tickets', err));
                  } catch {
                    setSyncResult('Sync failed');
                    setTimeout(() => setSyncResult(null), 4000);
                  } finally {
                    setSyncing(false);
                  }
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync'}
              </button>
              {syncResult && (
                <span className="text-xs text-muted-foreground">{syncResult}</span>
              )}
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/40 border border-border/40 overflow-x-auto w-fit">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium whitespace-nowrap rounded-lg transition-all ${
                    isActive
                      ? 'text-primary bg-card shadow-sm border border-border/60'
                      : 'text-muted-foreground hover:text-secondary-foreground hover:bg-secondary/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.badge !== undefined && (
                    <span
                      className={`min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold px-1 leading-none ${
                        isActive ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div>
            {activeTab === 'update' && <UpdateTicketsTab />}
            {activeTab === 'suggestions' && <AISuggestionsTab apiSuggestions={apiSuggestions} />}
            {activeTab === 'next-sprint' && <NextSprintTab apiNextSprint={apiNextSprint} />}
            {activeTab === 'delays' && <AnticipateDelaysTab apiDelayRisks={apiDelayRisks} />}
            {activeTab === 'cleanup' && <AICleanupTab />}
            {activeTab === 'security' && <VulnScanTab />}
          </div>
        </div>
      </Reveal>
    </>
  );
}
