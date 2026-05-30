'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import {
  ShieldAlert,
  Brain,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Clock,
  Zap,
  MessageSquare,
  Loader2,
  Send,
  X,
  Eye,
  Users,
  ArrowRight,
} from 'lucide-react';
import type { PIIFinding, PIISeverity, TicketAuditEvent } from '@/lib/api';
import {
  getTicketPIIFindings,
  resolvePIIFinding,
  executeAIAction,
  askAIAboutFinding,
  getTicketAudit,
} from '@/lib/api';

const SEVERITY_COLORS: Record<PIISeverity, { bg: string; text: string; border: string; label: string }> = {
  critical: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/30', label: 'Critical' },
  high: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30', label: 'High' },
  medium: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30', label: 'Medium' },
  low: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30', label: 'Low' },
};

const CATEGORY_ICONS: Record<string, string> = {
  email: '📧', phone: '📱', ssn_tax_id: '🆔', credit_card: '💳',
  address: '📍', passport: '🛂', api_key: '🔑', password: '🔒',
  ip_address: '🌐', health_data: '🏥', custom: '📋',
};

const RISK_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  safe: { bg: 'bg-success/10', text: 'text-success', label: 'Safe' },
  review_recommended: { bg: 'bg-warning/10', text: 'text-warning', label: 'Review Recommended' },
  requires_approval: { bg: 'bg-destructive/10', text: 'text-destructive', label: 'Requires Approval' },
};

function FindingCard({ finding, projectID, onUpdate }: {
  finding: PIIFinding;
  projectID: string;
  onUpdate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [executing, setExecuting] = useState<number | null>(null);
  const [resolving, setResolving] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const sev = SEVERITY_COLORS[finding.severity];

  const handleExecute = async (index: number) => {
    setExecuting(index);
    try {
      await executeAIAction(projectID, finding.id, index);
      onUpdate();
    } catch { /* ignore */ }
    setExecuting(null);
  };

  const handleResolve = async (status: 'remediated' | 'dismissed') => {
    setResolving(true);
    try {
      await resolvePIIFinding(projectID, finding.id, status);
      onUpdate();
    } catch { /* ignore */ }
    setResolving(false);
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const q = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: q }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await askAIAboutFinding(projectID, finding.id, q);
      setChatMessages(prev => [...prev, { role: 'ai', text: res.answer }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I could not process that request.' }]);
    }
    setChatLoading(false);
  };

  if (finding.status !== 'open') {
    return (
      <div className="rounded-lg bg-[#1a1a2e]/50 border border-[#2a2a3a]/50 p-3 opacity-60">
        <div className="flex items-center gap-2">
          <span className="text-sm">{CATEGORY_ICONS[finding.category] || '📋'}</span>
          <span className="text-xs text-[#6b6b80] line-through">{finding.category}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success ml-auto">{finding.status}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-[#1a1a2e] border border-[#2a2a3a] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        <span className="text-lg">{CATEGORY_ICONS[finding.category] || '📋'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white">{finding.category.replace(/_/g, ' ')}</span>
            <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded border', sev.bg, sev.text, sev.border)}>
              {sev.label}
            </span>
          </div>
          <p className="text-[10px] text-[#6b6b80] mt-0.5">{finding.field}</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
            <div className="w-12 h-1.5 rounded-full bg-[#2a2a3a] overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${finding.ai_confidence * 100}%`,
                backgroundColor: finding.ai_confidence >= 0.8 ? 'var(--success)' : finding.ai_confidence >= 0.5 ? 'var(--warning)' : 'var(--destructive)',
              }}
            />
          </div>
          <span className="text-[#6b6b80] font-mono">{Math.round(finding.ai_confidence * 100)}%</span>
        </div>
        <ChevronDown className={clsx('w-4 h-4 text-[#6b6b80] transition-transform', expanded && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3 border-t border-[#2a2a3a]">
              {/* Matched text + context */}
              <div className="mt-3 rounded-md bg-[#12121a] p-2.5">
                <p className="text-[10px] text-[#6b6b80] mb-1">Matched text (masked)</p>
                <p className="text-xs text-white font-mono">{finding.matched_text}</p>
                {finding.context && (
                  <p className="text-[10px] text-[#6b6b80] mt-1.5 leading-relaxed">&ldquo;...{finding.context}...&rdquo;</p>
                )}
              </div>

              {/* AI reasoning */}
              <div>
                <p className="text-[10px] text-[#6b6b80] mb-1 flex items-center gap-1">
                  <Brain className="w-3 h-3" /> AI Reasoning
                </p>
                <p className="text-xs text-[#9b9bb0] leading-relaxed">{finding.ai_reasoning}</p>
              </div>

              {/* AI remediation */}
              <div>
                <p className="text-[10px] text-[#6b6b80] mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> AI Remediation
                </p>
                <p className="text-xs text-[#9b9bb0] leading-relaxed">{finding.remediation}</p>
              </div>

              {/* AI-suggested actions */}
              {finding.ai_actions.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-[#6b6b80]">Suggested Actions</p>
                  {finding.ai_actions.map((action, j) => {
                    const risk = RISK_STYLES[action.risk] || RISK_STYLES.safe;
                    return (
                      <div key={j} className="flex items-center gap-2 p-2 rounded-md bg-[#12121a] border border-[#2a2a3a]">
                        <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-white font-medium">{action.label}</span>
                          <p className="text-[10px] text-[#6b6b80]">{action.description}</p>
                        </div>
                        <span className={clsx('text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0', risk.bg, risk.text)}>
                          {risk.label}
                        </span>
                        <button
                          onClick={() => handleExecute(j)}
                          disabled={executing !== null}
                          className="text-[10px] font-bold text-primary hover:text-primary/90 px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 transition-colors disabled:opacity-50 shrink-0"
                        >
                          {executing === j ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Execute'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Manual actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleResolve('remediated')}
                  disabled={resolving}
                  className="flex items-center gap-1 text-[10px] font-semibold text-success px-2.5 py-1 rounded bg-success/10 hover:bg-success/20 transition-colors"
                >
                  <CheckCircle2 className="w-3 h-3" /> Mark Fixed
                </button>
                <button
                  onClick={() => handleResolve('dismissed')}
                  disabled={resolving}
                  className="flex items-center gap-1 text-[10px] font-semibold text-[#6b6b80] px-2.5 py-1 rounded bg-[#2a2a3a] hover:bg-[#3a3a4a] transition-colors"
                >
                  <XCircle className="w-3 h-3" /> Dismiss
                </button>
                <button
                  onClick={() => setChatOpen(!chatOpen)}
                  className="flex items-center gap-1 text-[10px] font-semibold text-primary px-2.5 py-1 rounded bg-primary/10 hover:bg-primary/20 transition-colors ml-auto"
                >
                  <MessageSquare className="w-3 h-3" /> Ask AI
                </button>
              </div>

              {/* Chat panel */}
              <AnimatePresence>
                {chatOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-md bg-[#12121a] border border-[#2a2a3a] p-2.5 space-y-2">
                      {chatMessages.length > 0 && (
                        <div className="space-y-2 max-h-[150px] overflow-y-auto">
                          {chatMessages.map((msg, k) => (
                            <div key={k} className={clsx('text-xs leading-relaxed', msg.role === 'user' ? 'text-white' : 'text-[#9b9bb0]')}>
                              <span className="text-[9px] font-bold text-[#6b6b80]">{msg.role === 'user' ? 'You' : 'AI'}:</span>{' '}
                              {msg.text}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleChat()}
                          placeholder="Ask about this finding..."
                          className="flex-1 bg-[#1a1a2e] border border-[#2a2a3a] rounded px-2 py-1.5 text-xs text-white placeholder-[#6b6b80] outline-none focus:border-primary transition-colors"
                        />
                        <button
                          onClick={handleChat}
                          disabled={chatLoading || !chatInput.trim()}
                          className="p-1.5 rounded bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          {chatLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OwnershipTimeline({ events }: { events: TicketAuditEvent[] }) {
  const ownerEvents = events.filter(e => e.event_type === 'owner_changed');
  if (ownerEvents.length === 0) return null;

  return (
    <div className="space-y-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#6b6b80] mb-2 flex items-center gap-1">
        <Users className="w-3 h-3" /> Ownership Timeline
      </p>
      {ownerEvents.map((event, i) => (
        <div key={event.id} className="relative pl-5 pb-3">
          {i < ownerEvents.length - 1 && (
            <div className="absolute left-[7px] top-3 bottom-0 w-px bg-[#2a2a3a]" />
          )}
          <div className="absolute left-0 top-1 w-[15px] h-[15px] rounded-full bg-[#1a1a2e] border-2 border-primary flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
          <div>
            <p className="text-xs text-white">
              {event.old_value || 'Unassigned'} <ArrowRight className="w-3 h-3 inline text-[#6b6b80]" /> {event.new_value || 'Unassigned'}
            </p>
            <p className="text-[10px] text-[#6b6b80]">
              {event.actor_name || 'System'} &middot; {event.created_at}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

interface PIIRemediationPanelProps {
  projectID: string;
  ticketID: string;
  open: boolean;
  onClose: () => void;
}

export default function PIIRemediationPanel({ projectID, ticketID, open, onClose }: PIIRemediationPanelProps) {
  const [findings, setFindings] = useState<PIIFinding[]>([]);
  const [auditEvents, setAuditEvents] = useState<TicketAuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!projectID || !ticketID) return;
    setLoading(true);
    setError(null);
    try {
      const [f, a] = await Promise.all([
        getTicketPIIFindings(projectID, ticketID),
        getTicketAudit(projectID, ticketID).catch(() => []),
      ]);
      setFindings(f);
      setAuditEvents(a);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load findings');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) loadData();
  }, [open, projectID, ticketID]);

  if (!open) return null;

  const openFindings = findings.filter(f => f.status === 'open');
  const resolvedFindings = findings.filter(f => f.status !== 'open');
  const highestSeverity = openFindings.length > 0
    ? (['critical', 'high', 'medium', 'low'] as PIISeverity[]).find(s => openFindings.some(f => f.severity === s)) || 'low'
    : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-lg bg-[#0e0e1a] border-l border-[#2a2a3a] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[#0e0e1a]/95 backdrop-blur-md border-b border-[#2a2a3a] px-5 py-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-destructive" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">AI Remediation</h2>
                  <p className="text-[10px] text-[#6b6b80]">
                    {openFindings.length} open finding{openFindings.length !== 1 ? 's' : ''}
                    {highestSeverity && (
                      <span className={clsx('ml-1 font-bold', SEVERITY_COLORS[highestSeverity].text)}>
                        &middot; {highestSeverity}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#6b6b80] hover:text-white hover:bg-[#2a2a3a] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <p className="text-xs text-[#6b6b80]">Loading findings...</p>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-center">
                <XCircle className="w-5 h-5 text-destructive mx-auto mb-2" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            {!loading && !error && (
              <>
                {/* AI Summary */}
                {openFindings.length > 0 && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Brain className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] font-bold text-primary">AI Summary</span>
                    </div>
                    <p className="text-xs text-[#9b9bb0] leading-relaxed">
                      This ticket contains {openFindings.length} open finding{openFindings.length !== 1 ? 's' : ''}: {
                        [...new Set(openFindings.map(f => f.category.replace(/_/g, ' ')))].join(', ')
                      }. Review the AI-suggested actions below for recommended remediation steps.
                    </p>
                  </div>
                )}

                {/* Open findings */}
                {openFindings.length > 0 && (
                  <div className="space-y-2">
                    {openFindings.map(f => (
                      <FindingCard key={f.id} finding={f} projectID={projectID} onUpdate={loadData} />
                    ))}
                  </div>
                )}

                {/* Resolved findings */}
                {resolvedFindings.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#6b6b80]">Resolved</p>
                    {resolvedFindings.map(f => (
                      <FindingCard key={f.id} finding={f} projectID={projectID} onUpdate={loadData} />
                    ))}
                  </div>
                )}

                {/* Ownership timeline */}
                <OwnershipTimeline events={auditEvents} />

                {/* Empty state */}
                {findings.length === 0 && (
                  <div className="py-12 text-center">
                    <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-3" />
                    <p className="text-sm text-white font-medium">No PII findings</p>
                    <p className="text-xs text-[#6b6b80] mt-1">This ticket is clean.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
}
