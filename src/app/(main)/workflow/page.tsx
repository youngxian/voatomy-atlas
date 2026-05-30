'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import {
  GitBranch,
  Plus,
  Trash2,
  Share2,
  ExternalLink,
  Clock,
  Search,
  MoreVertical,
  Copy,
  CheckCircle2,
  AlertTriangle,
  X,
  Activity,
  Shield,
  Calendar,
  Gauge,
  Layers,
  Zap,
} from 'lucide-react';
import { Badge, Button, Card, EmptyState } from '@/components/ui';
import { WorkflowIllustration } from '@/components/EmptyIllustrations';
import WorkflowTemplates from '@/components/WorkflowTemplates';
import * as atlas from '@/lib/api';
import { useProject } from '@/lib/project-context';

type Scenario = atlas.WorkflowScenario;

const SCENARIO_META: Record<Scenario, { label: string; color: string; icon: React.ElementType }> = {
  ticket_activity: { label: 'Ticket Activity', color: 'var(--warning)', icon: Activity },
  meeting_insights: { label: 'Meeting Insights', color: 'var(--primary)', icon: Calendar },
  sprint_health: { label: 'Sprint Health', color: 'var(--success)', icon: Gauge },
  pii_detection: { label: 'PII Detection', color: 'var(--destructive)', icon: Shield },
  custom: { label: 'Custom', color: 'var(--primary)', icon: Zap },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export default function WorkflowListPage() {
  const router = useRouter();
  const { activeProjectId } = useProject();
  const [workflows, setWorkflows] = useState<atlas.Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<atlas.Workflow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const loadWorkflows = useCallback(async (pid: string) => {
    try {
      const wfs = await atlas.getWorkflows(pid);
      setWorkflows(wfs);
    } catch {
      setWorkflows([]);
    }
  }, []);

  useEffect(() => {
    if (!activeProjectId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    async function init() {
      try {
        await loadWorkflows(activeProjectId!);
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    }
    init();
    return () => { cancelled = true; };
  }, [activeProjectId, loadWorkflows]);

  const handleDelete = useCallback(async () => {
    if (!activeProjectId || !deleteTarget) return;
    setDeleting(true);
    try {
      await atlas.deleteWorkflow(activeProjectId, deleteTarget.id);
      setWorkflows(prev => prev.filter(w => w.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch { /* ignore */ }
    setDeleting(false);
  }, [activeProjectId, deleteTarget]);

  const handleShare = useCallback(async (wf: atlas.Workflow) => {
    const url = `${window.location.origin}/workflow/${wf.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(wf.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* ignore */ }
    setOpenMenu(null);
  }, []);

  const handleCreate = useCallback(() => {
    setShowTemplates(true);
  }, []);

  const filteredWorkflows = workflows.filter(wf =>
    !search || wf.name.toLowerCase().includes(search.toLowerCase()) ||
    (wf.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Workflows</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Build, manage, and share automated workflows for your project.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={handleCreate}>
          <Plus className="w-4 h-4" /> New Workflow
        </Button>
      </div>

      {/* Search + stats */}
      {workflows.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search workflows..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border/60 bg-card text-xs text-foreground placeholder:text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
            />
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>{workflows.length} workflow{workflows.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* Workflow grid */}
      {filteredWorkflows.length === 0 && !loading ? (
        workflows.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title="No workflows yet"
            description="Create your first workflow to automate your project pipeline."
            actionLabel="Create Workflow"
            onAction={handleCreate}
            illustration={<WorkflowIllustration className="w-[220px] h-[176px]" />}
          />
        ) : (
          <EmptyState
            icon={Search}
            title="No matching workflows"
            description="Try adjusting your search terms."
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredWorkflows.map(wf => {
            const meta = SCENARIO_META[wf.scenario] ?? SCENARIO_META.custom;
            const Icon = meta.icon;
            return (
              <Card
                key={wf.id}
                className="relative group bento-card"
                onClick={() => router.push(`/workflow/${wf.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="icon-box w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${meta.color} 15%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${meta.color} 25%, transparent)`,
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: meta.color }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">{wf.name}</h3>
                      <Badge variant="muted" className="mt-0.5">{meta.label}</Badge>
                    </div>
                  </div>

                  {/* Actions menu */}
                  <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setOpenMenu(openMenu === wf.id ? null : wf.id)}
                      className="p-1 rounded-md text-secondary-foreground hover:text-muted-foreground hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openMenu === wf.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
                        <div className="absolute right-0 top-full mt-1 z-50 bg-card rounded-xl border border-border/60 shadow-lg py-1 min-w-[160px]">
                          <button
                            onClick={() => { router.push(`/workflow/${wf.id}`); setOpenMenu(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-secondary-foreground hover:bg-secondary transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Edit Workflow
                          </button>
                          <button
                            onClick={() => handleShare(wf)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-secondary-foreground hover:bg-secondary transition-colors"
                          >
                            {copiedId === wf.id ? (
                              <><CheckCircle2 className="w-3.5 h-3.5 text-success" /> Link Copied!</>
                            ) : (
                              <><Share2 className="w-3.5 h-3.5" /> Share Link</>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(JSON.stringify({
                                name: wf.name,
                                scenario: wf.scenario,
                                nodes: wf.nodes,
                                edges: wf.edges,
                              }, null, 2));
                              setOpenMenu(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-secondary-foreground hover:bg-secondary transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy as JSON
                          </button>
                          <div className="my-1 border-t border-border/40" />
                          <button
                            onClick={() => { setDeleteTarget(wf); setOpenMenu(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/5 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {wf.description && (
                  <p className="text-[11px] text-muted-foreground mb-3 line-clamp-2">{wf.description}</p>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-3 text-[10px] text-secondary-foreground">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3" /> {wf.nodes?.length ?? 0} nodes
                  </span>
                  <span>·</span>
                  <span>{wf.edges?.length ?? 0} edges</span>
                  <span className="ml-auto flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDate(wf.updated_at)}
                  </span>
                </div>
              </Card>
            );
          })}

          {/* Create new card */}
          <motion.button
            onClick={handleCreate}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 hover:border-primary/40 p-6 min-h-[160px] transition-colors group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
              Create New Workflow
            </span>
          </motion.button>
        </div>
      )}

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              className="absolute inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !deleting && setDeleteTarget(null)}
            />
            <motion.div
              className="relative bg-card rounded-2xl border border-border/60 shadow-2xl w-full max-w-sm p-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Delete Workflow</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-xs text-secondary-foreground mb-4">
                Are you sure you want to delete <strong>{deleteTarget.name}</strong>? All nodes, edges, and configuration will be permanently removed.
              </p>
              <div className="flex items-center justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                  Cancel
                </Button>
                <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
                  <Trash2 className="w-3.5 h-3.5" /> {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Template picker for new workflows */}
      <WorkflowTemplates
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        onApply={(tpl) => {
          router.push(`/workflow/new?template=${tpl.id}`);
        }}
      />
    </div>
  );
}
