'use client';

import { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Check,
  FolderKanban,
  Building2,
  LayoutGrid,
  AlertTriangle,
  Import,
} from 'lucide-react';
import {
  getProviderWorkspaces,
  getProviderProjects,
  getProviderBoards,
  importProviderBoard,
  type DiscoveryWorkspace,
  type DiscoveryProject,
  type DiscoveryBoard,
  type ImportProviderResult,
} from '@/lib/api';
import { PROVIDER_LABELS } from '@/lib/project-utils';

// ---------------------------------------------------------------------------
// Provider metadata for discovery steps
// ---------------------------------------------------------------------------

interface ProviderDiscoveryMeta {
  hasWorkspaces: boolean;
  hasProjects: boolean;
  workspaceLabel: string;
  projectLabel: string;
  boardLabel: string;
}

const DISCOVERY_META: Record<string, ProviderDiscoveryMeta> = {
  clickup:          { hasWorkspaces: true,  hasProjects: true,  workspaceLabel: 'Team',         projectLabel: 'Space / Folder', boardLabel: 'List' },
  jira:             { hasWorkspaces: true,  hasProjects: true,  workspaceLabel: 'Cloud Site',   projectLabel: 'Project',        boardLabel: 'Board' },
  linear:           { hasWorkspaces: true,  hasProjects: false, workspaceLabel: 'Organization', projectLabel: 'Team',           boardLabel: 'Team' },
  asana:            { hasWorkspaces: true,  hasProjects: true,  workspaceLabel: 'Workspace',    projectLabel: 'Project',        boardLabel: 'Section' },
  monday:           { hasWorkspaces: true,  hasProjects: true,  workspaceLabel: 'Account',      projectLabel: 'Workspace',      boardLabel: 'Board' },
  github_projects:  { hasWorkspaces: true,  hasProjects: false, workspaceLabel: 'Organization', projectLabel: 'Project',        boardLabel: 'Project V2' },
  azuredevops:      { hasWorkspaces: true,  hasProjects: true,  workspaceLabel: 'Organization', projectLabel: 'Project',        boardLabel: 'Team' },
  shortcut:         { hasWorkspaces: true,  hasProjects: true,  workspaceLabel: 'Workspace',    projectLabel: 'Group',          boardLabel: 'Project' },
};

function getMeta(provider: string): ProviderDiscoveryMeta {
  return DISCOVERY_META[provider] ?? {
    hasWorkspaces: true,
    hasProjects: true,
    workspaceLabel: 'Workspace',
    projectLabel: 'Project',
    boardLabel: 'Board',
  };
}

// ---------------------------------------------------------------------------
// Types & Props
// ---------------------------------------------------------------------------

type PickerStep = 'workspace' | 'project' | 'board' | 'importing' | 'done';

interface ProviderProjectPickerProps {
  provider: string;
  open: boolean;
  onClose: () => void;
  onImported: (result: ImportProviderResult) => void;
  projectName?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProviderProjectPicker({
  provider,
  open,
  onClose,
  onImported,
  projectName,
}: ProviderProjectPickerProps) {
  const meta = getMeta(provider);
  const label = PROVIDER_LABELS[provider] ?? provider;

  const [step, setStep] = useState<PickerStep>('workspace');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [workspaces, setWorkspaces] = useState<DiscoveryWorkspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<DiscoveryWorkspace | null>(null);

  const [projects, setProjects] = useState<DiscoveryProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<DiscoveryProject | null>(null);

  const [boards, setBoards] = useState<DiscoveryBoard[]>([]);
  const [selectedBoards, setSelectedBoards] = useState<Set<string>>(new Set());

  const [importResult, setImportResult] = useState<ImportProviderResult | null>(null);

  // Reset state when provider or open state changes
  useEffect(() => {
    if (open) {
      setStep('workspace');
      setLoading(false);
      setError(null);
      setWorkspaces([]);
      setSelectedWorkspace(null);
      setProjects([]);
      setSelectedProject(null);
      setBoards([]);
      setSelectedBoards(new Set());
      setImportResult(null);
    }
  }, [open, provider]);

  // Fetch workspaces on open
  useEffect(() => {
    if (!open || !meta.hasWorkspaces) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const ws = await getProviderWorkspaces(provider);
        if (!cancelled) {
          setWorkspaces(ws);
          if (ws.length === 1) {
            setSelectedWorkspace(ws[0]);
            if (meta.hasProjects) {
              setStep('project');
            } else {
              setStep('board');
            }
          }
        }
      } catch {
        if (!cancelled) setError('Failed to load workspaces. Check your connection.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [open, provider, meta.hasWorkspaces, meta.hasProjects]);

  // Fetch projects when a workspace is selected
  useEffect(() => {
    if (!selectedWorkspace || !meta.hasProjects || step !== 'project') return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const projs = await getProviderProjects(provider, selectedWorkspace.id);
        if (!cancelled) setProjects(projs);
      } catch {
        if (!cancelled) setError('Failed to load projects.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedWorkspace, meta.hasProjects, step, provider]);

  // Fetch boards when workspace (and optionally project) is selected
  useEffect(() => {
    if (!selectedWorkspace || step !== 'board') return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const bds = await getProviderBoards(provider, selectedWorkspace.id, selectedProject?.id);
        if (!cancelled) setBoards(bds);
      } catch {
        if (!cancelled) setError('Failed to load boards.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedWorkspace, selectedProject, step, provider]);

  const handleWorkspaceSelect = useCallback((ws: DiscoveryWorkspace) => {
    setSelectedWorkspace(ws);
    setSelectedProject(null);
    setSelectedBoards(new Set());
    if (meta.hasProjects) {
      setStep('project');
    } else {
      setStep('board');
    }
  }, [meta.hasProjects]);

  const handleProjectSelect = useCallback((proj: DiscoveryProject) => {
    setSelectedProject(proj);
    setSelectedBoards(new Set());
    setStep('board');
  }, []);

  const toggleBoard = useCallback((id: string) => {
    setSelectedBoards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleImport = useCallback(async () => {
    if (selectedBoards.size === 0) return;
    setStep('importing');
    setError(null);

    try {
      const result = await importProviderBoard(provider, {
        workspace_id: selectedWorkspace?.id,
        project_id: selectedProject?.id,
        board_ids: Array.from(selectedBoards),
        project_name: projectName,
      });
      setImportResult(result);
      setStep('done');
      onImported(result);
    } catch {
      setError('Import failed. Please try again.');
      setStep('board');
    }
  }, [selectedBoards, provider, selectedWorkspace, selectedProject, projectName, onImported]);

  const handleBack = useCallback(() => {
    setError(null);
    if (step === 'board' && meta.hasProjects) {
      setStep('project');
      setSelectedProject(null);
      setSelectedBoards(new Set());
    } else if (step === 'board' || step === 'project') {
      setStep('workspace');
      setSelectedWorkspace(null);
      setSelectedProject(null);
      setSelectedBoards(new Set());
    }
  }, [step, meta.hasProjects]);

  if (!open) return null;

  const stepTitle =
    step === 'workspace' ? `Select ${meta.workspaceLabel}` :
    step === 'project' ? `Select ${meta.projectLabel}` :
    step === 'board' ? `Select ${meta.boardLabel}` :
    step === 'importing' ? 'Importing…' :
    'Import Complete';

  const canGoBack =
    (step === 'project' && meta.hasWorkspaces && workspaces.length > 1) ||
    (step === 'board' && (meta.hasProjects || (meta.hasWorkspaces && workspaces.length > 1)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            {canGoBack && (
              <button
                onClick={handleBack}
                className="p-1 rounded-md hover:bg-secondary text-muted-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="text-sm font-semibold text-foreground">{stepTitle}</h2>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="mb-4 rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground">Loading…</p>
            </div>
          )}

          {/* Workspace list */}
          {step === 'workspace' && !loading && workspaces.length > 0 && (
            <div className="space-y-1.5">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => handleWorkspaceSelect(ws)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left',
                    selectedWorkspace?.id === ws.id
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border hover:border-border/80 hover:bg-secondary/50',
                  )}
                >
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{ws.name}</p>
                    {ws.member_count != null && (
                      <p className="text-xs text-muted-foreground">{ws.member_count} members</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}

          {step === 'workspace' && !loading && workspaces.length === 0 && !error && (
            <div className="text-center py-12">
              <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No workspaces found</p>
            </div>
          )}

          {/* Project list */}
          {step === 'project' && !loading && projects.length > 0 && (
            <div className="space-y-1.5">
              {projects.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => handleProjectSelect(proj)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:border-border/80 hover:bg-secondary/50 transition-all text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <FolderKanban className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{proj.name}</p>
                    {proj.description && (
                      <p className="text-xs text-muted-foreground truncate">{proj.description}</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}

          {step === 'project' && !loading && projects.length === 0 && !error && (
            <div className="text-center py-12">
              <FolderKanban className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No projects found in this workspace</p>
            </div>
          )}

          {/* Board list (multi-select) */}
          {step === 'board' && !loading && boards.length > 0 && (
            <div className="space-y-1.5">
              {boards.map((board) => {
                const selected = selectedBoards.has(board.id);
                return (
                  <button
                    key={board.id}
                    onClick={() => toggleBoard(board.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left',
                      selected
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border hover:border-border/80 hover:bg-secondary/50',
                    )}
                  >
                    <div
                      className={clsx(
                        'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors',
                        selected
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground/30 bg-transparent',
                      )}
                    >
                      {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{board.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {board.has_sprints && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            Sprints
                          </span>
                        )}
                        {board.ticket_count != null && (
                          <span className="text-xs text-muted-foreground">
                            {board.ticket_count} items
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {step === 'board' && !loading && boards.length === 0 && !error && (
            <div className="text-center py-12">
              <LayoutGrid className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No boards found</p>
            </div>
          )}

          {/* Importing */}
          {step === 'importing' && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">
                Importing {selectedBoards.size} {selectedBoards.size === 1 ? 'board' : 'boards'}…
              </p>
            </div>
          )}

          {/* Done */}
          {step === 'done' && importResult && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">Import Complete</h3>
              <p className="text-sm text-muted-foreground mb-1">
                {importResult.created.length} project{importResult.created.length !== 1 ? 's' : ''} created
              </p>
              {importResult.skipped.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {importResult.skipped.length} skipped (already imported)
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'board' && boards.length > 0 && (
          <div className="px-5 py-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {selectedBoards.size} selected
            </p>
            <button
              onClick={handleImport}
              disabled={selectedBoards.size === 0}
              className={clsx(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                selectedBoards.size > 0
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-secondary text-muted-foreground cursor-not-allowed',
              )}
            >
              <Import className="w-4 h-4" />
              Import
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="px-5 py-4 border-t border-border flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
