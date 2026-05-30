'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  pointerWithin,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import {
  GitBranch,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MousePointer2,
  Hand,
  Cable,
  Grid3X3,
  Magnet,
  Save,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
  Eye,
  Keyboard,
  X,
  Slack,
  MessageSquare,
  Settings,
  Plus,
  Trash2,
  TestTube,
  ArrowLeft,
  Share2,
  CheckCircle2,
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import { useWorkflowState, NODE_DEFAULTS, type WorkflowNodeType } from '@/hooks/useWorkflowState';
import WorkflowCanvas from '@/components/WorkflowCanvas';
import WorkflowNodePalette from '@/components/WorkflowNodePalette';
import WorkflowInspector from '@/components/WorkflowInspector';
import WorkflowMiniMap from '@/components/WorkflowMiniMap';
import WorkflowTemplates, { WORKFLOW_TEMPLATES } from '@/components/WorkflowTemplates';
import WorkflowContextMenu, { type ContextTarget } from '@/components/WorkflowContextMenu';
import * as atlas from '@/lib/api';
import { useProject } from '@/lib/project-context';

type Scenario = 'ticket_activity' | 'meeting_insights' | 'sprint_health' | 'pii_detection' | 'custom';
type CanvasTool = 'select' | 'pan' | 'connect';

const SCENARIO_OPTIONS: { key: Scenario; label: string }[] = [
  { key: 'ticket_activity', label: 'Ticket Activity' },
  { key: 'meeting_insights', label: 'Meeting Insights' },
  { key: 'sprint_health', label: 'Sprint Health' },
  { key: 'pii_detection', label: 'PII Detection' },
  { key: 'custom', label: 'Custom' },
];

const SCENARIO_TEMPLATE_MAP: Record<string, string> = {
  ticket_activity: 'ticket-activity',
  meeting_insights: 'meeting-insights',
  sprint_health: 'sprint-health',
  pii_detection: 'pii-detection',
};

function mapApiToInternal(wf: atlas.Workflow) {
  const nodes = (wf.nodes ?? []).map((n: atlas.WorkflowNode) => {
    const defaults = NODE_DEFAULTS[n.type as WorkflowNodeType];
    return {
      id: n.id,
      type: n.type as WorkflowNodeType,
      label: n.label,
      sublabel: n.sublabel,
      x: n.x,
      y: n.y,
      width: defaults?.width ?? 180,
      height: defaults?.height ?? 72,
      color: n.color || defaults?.color || 'var(--primary)',
      config: n.config ?? {},
      ports: n.ports?.length
        ? n.ports.map(p => ({
            ...p,
            type: (p.side === 'left' || p.side === 'top' ? 'input' : 'output') as 'input' | 'output',
          }))
        : (defaults?.ports ?? []).map(p => ({ ...p, id: `${n.id}_${p.id}` })),
    };
  });

  const edges = (wf.edges ?? []).map((e: atlas.WorkflowEdge) => ({
    id: e.id,
    sourceId: e.source,
    sourcePort: e.source_port ?? '',
    targetId: e.target,
    targetPort: e.target_port ?? '',
    label: e.label,
    animated: e.animated,
    condition: e.condition,
  }));

  return { nodes, edges, viewport: wf.viewport };
}

export default function WorkflowBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowId = params.id as string;
  const isNew = workflowId === 'new';
  const templateParam = searchParams.get('template');

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const workflow = useWorkflowState();
  const [scenario, setScenario] = useState<Scenario>('ticket_activity');
  const [canvasTool, setCanvasTool] = useState<CanvasTool>('select');
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [contextTarget, setContextTarget] = useState<ContextTarget | null>(null);
  const [showFlowParticles, setShowFlowParticles] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showScenarioDropdown, setShowScenarioDropdown] = useState(false);
  const [showChannelsModal, setShowChannelsModal] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState(isNew ? 'Untitled Workflow' : 'Loading...');
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 900, h: 600 });
  const [channels, setChannels] = useState<atlas.ChannelConfig[]>([]);
  const [pipelineStats, setPipelineStats] = useState<atlas.PipelineStats | null>(null);
  const { activeProjectId } = useProject();
  const [savedWorkflowId, setSavedWorkflowId] = useState<string | null>(isNew ? null : workflowId);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [activeDragData, setActiveDragData] = useState<{ nodeType: string; label: string; color: string } | null>(null);

  const selectedNode = workflow.selectedNodes.length === 1 ? workflow.selectedNodes[0] : null;

  useEffect(() => {
    let cancelled = false;

    // Apply template immediately for new workflows (no backend needed)
    if (isNew && workflow.nodes.length === 0) {
      const tplId = templateParam || 'ticket-activity';
      const tpl = WORKFLOW_TEMPLATES.find((t) => t.id === tplId) ?? WORKFLOW_TEMPLATES[0];
      if (tpl) {
        setWorkflowName(tpl.name);
        const scenarioKey = Object.entries(SCENARIO_TEMPLATE_MAP).find(([, v]) => v === tpl.id)?.[0] as Scenario | undefined;
        if (scenarioKey) setScenario(scenarioKey);
        workflow.applyTemplate(tpl);
      }
    }

    async function init() {
      if (!activeProjectId) return;

      // Load channels and stats in parallel (non-blocking)
      const [chs, stats] = await Promise.allSettled([
        atlas.getChannels(activeProjectId),
        atlas.getPipelineStats(activeProjectId),
      ]);
      if (cancelled) return;
      if (chs.status === 'fulfilled') setChannels(chs.value);
      if (stats.status === 'fulfilled') setPipelineStats(stats.value);

      // Load existing workflow from API
      if (!isNew) {
        try {
          const wf = await atlas.getWorkflow(activeProjectId, workflowId);
          if (cancelled) return;
          setWorkflowName(wf.name);
          setScenario(wf.scenario);
          const mapped = mapApiToInternal(wf);
          workflow.fromJSON(JSON.stringify(mapped));
        } catch {
          if (!cancelled) setLoadError(true);
        }
      }
    }
    init().catch((err) => console.error('Failed to init workflow', err));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjectId, workflowId, isNew, templateParam]);

  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaveError(null);

    if (!activeProjectId) {
      setSaveError('No project loaded. Refresh the page and try again.');
      return;
    }

    setSaving(true);
    try {
      const safeNum = (v: number, fallback = 0) => isFinite(v) ? v : fallback;

      const payload = {
        name: workflowName,
        scenario: scenario as atlas.WorkflowScenario,
        nodes: workflow.nodes.map((n) => ({
          id: n.id,
          type: n.type,
          label: n.label,
          sublabel: n.sublabel,
          x: safeNum(n.x),
          y: safeNum(n.y),
          color: n.color,
          config: n.config,
          ports: n.ports.map(p => ({ id: p.id, side: p.side })),
        })),
        edges: workflow.edges.map((e) => ({
          id: e.id,
          source: e.sourceId,
          source_port: e.sourcePort,
          target: e.targetId,
          target_port: e.targetPort,
          label: e.label,
          animated: e.animated,
          condition: e.condition,
        })),
        viewport: {
          x: safeNum(workflow.viewport.x),
          y: safeNum(workflow.viewport.y),
          zoom: safeNum(workflow.viewport.zoom, 1),
        },
      };

      if (savedWorkflowId) {
        await atlas.updateWorkflow(activeProjectId, savedWorkflowId, payload);
      } else {
        const created = await atlas.createWorkflow(activeProjectId, payload);
        setSavedWorkflowId(created.id);
        window.history.replaceState(null, '', `/workflow/${created.id}`);
      }
      setLastSaved(new Date().toLocaleTimeString());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      try { localStorage.setItem('workflow-state', workflow.toJSON()); } catch { /* ignore */ }
      setSaveError(msg);
      setLastSaved(new Date().toLocaleTimeString() + ' (local only)');
    } finally {
      setSaving(false);
    }
  }, [activeProjectId, savedWorkflowId, saving, workflowName, scenario, workflow]);

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey;
      if (e.key === 'v' && !isCmd && !e.shiftKey) { setCanvasTool('select'); return; }
      if (e.key === 'c' && !isCmd && !e.shiftKey) { setCanvasTool('connect'); return; }
      if (e.key === ' ') { e.preventDefault(); setCanvasTool('pan'); return; }
      if (e.key === 'Escape') { workflow.clearSelection(); setContextTarget(null); return; }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isCmd) { workflow.removeSelected(); return; }
      if (isCmd && e.key === 'z' && !e.shiftKey) { e.preventDefault(); workflow.undo(); return; }
      if (isCmd && e.key === 'z' && e.shiftKey) { e.preventDefault(); workflow.redo(); return; }
      if (isCmd && e.key === 'a') { e.preventDefault(); workflow.selectAll(); return; }
      if (isCmd && e.key === 'd') { e.preventDefault(); workflow.duplicateSelected(); return; }
      if (isCmd && e.key === 's') { e.preventDefault(); handleSaveRef.current(); return; }
      if (isCmd && e.key === '0') { e.preventDefault(); workflow.fitView(); return; }
      if (isCmd && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        workflow.setViewport({ ...workflow.viewport, zoom: Math.min(4, workflow.viewport.zoom * 1.2) });
        return;
      }
      if (isCmd && e.key === '-') {
        e.preventDefault();
        workflow.setViewport({ ...workflow.viewport, zoom: Math.max(0.25, workflow.viewport.zoom / 1.2) });
        return;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') setCanvasTool('select');
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [workflow]);

  const handleShareLink = useCallback(async () => {
    const id = savedWorkflowId || workflowId;
    if (!id || id === 'new') return;
    const url = `${window.location.origin}/workflow/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch { /* ignore */ }
  }, [savedWorkflowId, workflowId]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as { nodeType: string; label: string; color?: string } | undefined;
    if (data) {
      setActiveDragData({ nodeType: data.nodeType, label: data.label, color: data.color ?? 'var(--primary)' });
    }
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveDragData(null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      try {
        const { active, over } = event;
        if (over?.id === 'workflow-canvas' && active.data.current) {
          const data = active.data.current as { nodeType: WorkflowNodeType; label: string; sublabel?: string; color?: string };
          const rect = canvasContainerRef.current?.getBoundingClientRect();
          if (!rect) return;
          const activatorEvt = event.activatorEvent as PointerEvent | undefined;
          const zoom = workflow.viewport.zoom || 1;
          const dropX = (activatorEvt?.clientX ?? rect.left + rect.width / 2) + (event.delta?.x ?? 0);
          const dropY = (activatorEvt?.clientY ?? rect.top + rect.height / 2) + (event.delta?.y ?? 0);
          const canvasX = (dropX - rect.left - workflow.viewport.x) / zoom;
          const canvasY = (dropY - rect.top - workflow.viewport.y) / zoom;
          workflow.addNode(data.nodeType, canvasX, canvasY, {
            label: data.label,
            sublabel: data.sublabel,
          });
        }
      } finally {
        setActiveDragData(null);
      }
    },
    [workflow]
  );

  const handleScenarioChange = useCallback(
    (s: Scenario) => {
      setScenario(s);
      setShowScenarioDropdown(false);
      const templateId = SCENARIO_TEMPLATE_MAP[s];
      if (templateId) {
        const tpl = WORKFLOW_TEMPLATES.find((t) => t.id === templateId);
        if (tpl) {
          workflow.applyTemplate(tpl);
        }
      }
      if (activeProjectId) {
        atlas.getPipelineStats(activeProjectId).then(setPipelineStats).catch((err) => console.error('Failed to load pipeline stats', err));
      }
    },
    [workflow, activeProjectId]
  );

  const handleContextMenu = useCallback(
    (_e: React.MouseEvent, target: { type: 'canvas' | 'node' | 'edge'; id?: string; position: { x: number; y: number } }) => {
      setContextTarget(target as ContextTarget);
    },
    []
  );

  const handleAddNodeFromContext = useCallback(
    (type: WorkflowNodeType, screenPos: { x: number; y: number }) => {
      const rect = canvasContainerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = (screenPos.x - rect.left - workflow.viewport.x) / workflow.viewport.zoom;
      const cy = (screenPos.y - rect.top - workflow.viewport.y) / workflow.viewport.zoom;
      workflow.addNode(type, cx, cy);
    },
    [workflow]
  );

  if (loadError) {
    return (
      <div className="-m-6 lg:-m-8 -mt-[5.5rem] lg:-mt-[5.5rem] flex flex-col h-screen items-center justify-center bg-muted gap-4">
        <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
          <X className="w-6 h-6 text-destructive" />
        </div>
        <div className="text-center">
          <h2 className="text-sm font-bold text-foreground">Workflow not found</h2>
          <p className="text-xs text-muted-foreground mt-1">This workflow may have been deleted or you don't have access.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => router.push('/workflow')}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Workflows
        </Button>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="-m-6 lg:-m-8 -mt-[5.5rem] lg:-mt-[5.5rem] flex flex-col h-screen items-center justify-center bg-muted">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
        <div className="-m-6 lg:-m-8 -mt-[5.5rem] lg:-mt-[5.5rem] flex flex-col h-screen">
          {/* ── Top Bar ── */}
          <div className="flex items-center px-3 py-2 border-b border-border/60 bg-card shrink-0 mt-14 gap-2 overflow-x-auto">
            {/* Left: back + name + scenario */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => router.push('/workflow')}
                className="p-1.5 rounded-md text-secondary-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Back to Workflows"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <GitBranch className="w-3.5 h-3.5 text-primary" />
              </div>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="text-sm font-bold text-foreground bg-transparent border-none outline-none w-[140px] focus:ring-1 focus:ring-primary/30 rounded px-1"
              />
              <div className="relative">
                <button
                  onClick={() => setShowScenarioDropdown(!showScenarioDropdown)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-muted-foreground hover:bg-secondary transition-colors border border-border/60 whitespace-nowrap"
                >
                  {SCENARIO_OPTIONS.find((o) => o.key === scenario)?.label}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showScenarioDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowScenarioDropdown(false)} />
                    <div className="absolute top-full left-0 mt-1 z-50 bg-card rounded-xl border border-border/60 shadow-lg py-1 min-w-[160px]">
                      {SCENARIO_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => handleScenarioChange(opt.key)}
                          className={clsx(
                            'w-full text-left px-3 py-1.5 text-xs transition-colors',
                            scenario === opt.key ? 'bg-primary/10 text-primary font-medium' : 'text-secondary-foreground hover:bg-secondary'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="w-px h-5 bg-border shrink-0" />

            {/* Center: tools */}
            <div className="flex items-center gap-0.5 shrink-0">
              <Button variant="ghost" size="sm" onClick={() => setShowTemplates(true)} title="Templates">
                <Layers className="w-3.5 h-3.5" /> Templates
              </Button>

              <div className="w-px h-5 bg-border mx-1" />

              <button onClick={() => workflow.undo()} disabled={!workflow.canUndo} className="p-1.5 rounded-md text-secondary-foreground hover:text-muted-foreground disabled:opacity-30 transition-colors" title="Undo (⌘Z)">
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => workflow.redo()} disabled={!workflow.canRedo} className="p-1.5 rounded-md text-secondary-foreground hover:text-muted-foreground disabled:opacity-30 transition-colors" title="Redo (⌘⇧Z)">
                <Redo2 className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-5 bg-border mx-1" />

              {([
                { tool: 'select' as const, icon: MousePointer2, label: 'Select (V)' },
                { tool: 'pan' as const, icon: Hand, label: 'Pan (Space)' },
                { tool: 'connect' as const, icon: Cable, label: 'Connect (C)' },
              ]).map(({ tool, icon: TIcon, label }) => (
                <button
                  key={tool}
                  onClick={() => setCanvasTool(tool)}
                  className={clsx(
                    'p-1.5 rounded-md transition-colors',
                    canvasTool === tool ? 'bg-primary/10 text-primary' : 'text-secondary-foreground hover:text-muted-foreground'
                  )}
                  title={label}
                >
                  <TIcon className="w-3.5 h-3.5" />
                </button>
              ))}

              <div className="w-px h-5 bg-border mx-1" />

              <button onClick={() => workflow.setViewport({ ...workflow.viewport, zoom: Math.max(0.25, workflow.viewport.zoom / 1.2) })} className="p-1 rounded hover:bg-muted transition-colors text-secondary-foreground" title="Zoom Out">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] text-muted-foreground tabular-nums min-w-[32px] text-center">
                {Math.round(workflow.viewport.zoom * 100)}%
              </span>
              <button onClick={() => workflow.setViewport({ ...workflow.viewport, zoom: Math.min(4, workflow.viewport.zoom * 1.2) })} className="p-1 rounded hover:bg-muted transition-colors text-secondary-foreground" title="Zoom In">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => workflow.fitView()} className="p-1 rounded hover:bg-muted transition-colors text-secondary-foreground" title="Fit View (⌘0)">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="w-px h-5 bg-border shrink-0" />

            {/* Right: grid + share + save */}
            <div className="flex items-center gap-0.5 shrink-0 ml-auto">
              <button
                onClick={() => workflow.toggleGrid()}
                className={clsx('p-1.5 rounded-md transition-colors', workflow.showGrid ? 'bg-primary/10 text-primary' : 'text-secondary-foreground hover:text-muted-foreground')}
                title="Toggle Grid"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => workflow.toggleSnap()}
                className={clsx('p-1.5 rounded-md transition-colors', workflow.snapToGrid ? 'bg-primary/10 text-primary' : 'text-secondary-foreground hover:text-muted-foreground')}
                title="Snap to Grid"
              >
                <Magnet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowFlowParticles(!showFlowParticles)}
                className={clsx('p-1.5 rounded-md transition-colors', showFlowParticles ? 'bg-primary/10 text-primary' : 'text-secondary-foreground hover:text-muted-foreground')}
                title="Show Flow"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-5 bg-border mx-0.5" />

              <button
                onClick={() => setShowChannelsModal(!showChannelsModal)}
                className="p-1.5 rounded-md text-secondary-foreground hover:text-muted-foreground transition-colors"
                title="Channel Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>

              {savedWorkflowId && (
                <button
                  onClick={handleShareLink}
                  className="p-1.5 rounded-md text-secondary-foreground hover:text-muted-foreground transition-colors"
                  title={linkCopied ? 'Link copied!' : 'Copy share link'}
                >
                  {linkCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <Share2 className="w-3.5 h-3.5" />}
                </button>
              )}

              <Button variant={saveError ? 'danger' : 'primary'} size="sm" onClick={handleSave} disabled={saving}>
                <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : saveError ? 'Retry' : 'Save'}
              </Button>
            </div>
          </div>

          {/* ── Main Content ── */}
          <div className="flex flex-1 min-h-0">
            <div className="relative">
              <WorkflowNodePalette collapsed={paletteCollapsed} />
              <button
                onClick={() => setPaletteCollapsed(!paletteCollapsed)}
                className="absolute -right-3 top-4 z-20 w-6 h-6 rounded-full bg-card border border-border/60 shadow-sm flex items-center justify-center text-secondary-foreground hover:text-primary transition-colors"
                title={paletteCollapsed ? 'Expand palette' : 'Collapse palette'}
              >
                {paletteCollapsed ? <PanelLeftOpen className="w-3 h-3" /> : <PanelLeftClose className="w-3 h-3" />}
              </button>
            </div>

            <div ref={canvasContainerRef} className="flex-1 relative bg-muted min-w-0">
              <WorkflowCanvas workflow={workflow} canvasTool={canvasTool} onContextMenu={handleContextMenu} />
              <WorkflowMiniMap
                nodes={workflow.nodes}
                viewport={workflow.viewport}
                canvasWidth={canvasSize.w}
                canvasHeight={canvasSize.h}
                onViewportChange={workflow.setViewport}
                onFitView={workflow.fitView}
              />
            </div>

            <WorkflowInspector
              open={!!selectedNode}
              node={selectedNode}
              nodes={workflow.nodes}
              edges={workflow.edges}
              onClose={() => workflow.clearSelection()}
              onUpdateConfig={workflow.updateNodeConfig}
              onUpdateLabel={workflow.updateNodeLabel}
              onDelete={(id) => { workflow.selectNode(id); workflow.removeSelected(); }}
              onSelectNode={(id) => workflow.selectNode(id)}
            />
          </div>

          {/* ── Status Bar ── */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border/60 bg-card shrink-0">
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {workflow.nodes.length} nodes
              </span>
              <span>·</span>
              <span>{workflow.edges.length} edges</span>
              <span>·</span>
              <span>Zoom: {Math.round(workflow.viewport.zoom * 100)}%</span>
              <span>·</span>
              <span>Grid: {workflow.showGrid ? 'On' : 'Off'}</span>
              <span>·</span>
              <span>Snap: {workflow.snapToGrid ? 'On' : 'Off'}</span>
              {pipelineStats && (
                <>
                  <span>·</span>
                  <span className="text-primary font-medium">{pipelineStats.in_progress} in progress</span>
                  {pipelineStats.stale_count > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-destructive font-medium">{pipelineStats.stale_count} stale</span>
                    </>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              {saving && <span className="text-warning">Saving...</span>}
              {saveError && !saving && (
                <button onClick={() => setSaveError(null)} className="text-destructive hover:underline" title={saveError}>
                  Save failed — click to dismiss
                </button>
              )}
              {lastSaved && !saving && !saveError && <span>Saved {lastSaved}</span>}
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-secondary transition-colors"
              >
                <Keyboard className="w-3 h-3" />
                Shortcuts
              </button>
            </div>
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDragData && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border-2 shadow-lg pointer-events-none opacity-90"
              style={{ borderColor: activeDragData.color }}
            >
              <div className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ backgroundColor: `color-mix(in srgb, ${activeDragData.color} 15%, transparent)` }}
              >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeDragData.color }} />
              </div>
              <span className="text-xs font-medium text-foreground">{activeDragData.label}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <WorkflowTemplates
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        onApply={(tpl) => { workflow.applyTemplate(tpl); }}
      />

      <WorkflowContextMenu
        target={contextTarget}
        onClose={() => setContextTarget(null)}
        onAddNode={handleAddNodeFromContext}
        onDuplicate={() => workflow.duplicateSelected()}
        onDelete={() => workflow.removeSelected()}
        onDisconnectNode={(id) => workflow.disconnectNode(id)}
        onEditConfig={(id) => workflow.selectNode(id)}
        onSelectAll={() => workflow.selectAll()}
        onFitView={() => workflow.fitView()}
        onToggleGrid={() => workflow.toggleGrid()}
        onReverseEdge={(id) => workflow.reverseEdge(id)}
        onAddEdgeLabel={(id) => {
          const label = prompt('Edge label:');
          if (label) workflow.updateEdgeLabel(id, label);
        }}
        onRemoveEdge={(id) => {
          workflow.selectEdge(id);
          workflow.removeSelected();
        }}
      />

      {/* Keyboard Shortcuts Overlay */}
      <AnimatePresence>
        {showShortcuts && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              className="absolute inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShortcuts(false)}
            />
            <motion.div
              className="relative bg-card rounded-2xl border border-border/60 shadow-2xl w-full max-w-md p-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-foreground">Keyboard Shortcuts</h2>
                <button onClick={() => setShowShortcuts(false)} className="p-1 rounded-lg text-secondary-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                {[
                  ['V', 'Select tool'],
                  ['Space (hold)', 'Pan tool'],
                  ['C', 'Connect tool'],
                  ['Delete', 'Delete selected'],
                  ['⌘Z', 'Undo'],
                  ['⌘⇧Z', 'Redo'],
                  ['⌘A', 'Select all'],
                  ['⌘D', 'Duplicate'],
                  ['⌘S', 'Save'],
                  ['⌘+/-', 'Zoom in/out'],
                  ['⌘0', 'Fit view'],
                  ['Escape', 'Deselect all'],
                ].map(([key, desc]) => (
                  <div key={key} className="flex items-center gap-2 py-1">
                    <kbd className="text-[10px] font-mono bg-secondary border border-border px-1.5 py-0.5 rounded text-secondary-foreground min-w-[50px] text-center">{key}</kbd>
                    <span className="text-[11px] text-muted-foreground">{desc}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Channels Settings Modal */}
      <AnimatePresence>
        {showChannelsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              className="absolute inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChannelsModal(false)}
            />
            <motion.div
              className="relative bg-card rounded-2xl border border-border/60 shadow-2xl w-full max-w-lg max-h-[70vh] flex flex-col overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
                <h2 className="text-sm font-bold text-foreground">Notification Channels</h2>
                <button onClick={() => setShowChannelsModal(false)} className="p-1 rounded-lg text-secondary-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {channels.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-xs text-secondary-foreground">No notification channels configured.</p>
                  </div>
                )}
                {channels.map((ch) => (
                  <Card key={ch.id} className="p-4 bento-card">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 ${ch.channel_type === 'slack' ? 'bg-[#4A154B]/10' : 'bg-[#464EB8]/10'}`}>
                        {ch.channel_type === 'slack' ? (
                          <Slack className="w-4 h-4 text-[#4A154B]" />
                        ) : (
                          <MessageSquare className="w-4 h-4 text-[#464EB8]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-foreground">{ch.channel_name ?? ch.channel_type}</h4>
                          <Badge variant={ch.enabled ? 'success' : 'muted'}>{ch.enabled ? 'Active' : 'Off'}</Badge>
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-0.5 font-mono truncate">{ch.webhook_url}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {ch.events.map((evt) => (
                            <span key={evt} className="px-1.5 py-0.5 rounded bg-secondary text-[9px] font-medium text-secondary-foreground border border-border/40">
                              {evt.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Test"
                          onClick={async () => {
                            if (!activeProjectId) return;
                            try { await atlas.testChannel(activeProjectId, ch.id); } catch { /* ignore */ }
                          }}
                        >
                          <TestTube className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          title="Remove"
                          onClick={async () => {
                            if (!activeProjectId) return;
                            try {
                              await atlas.deleteChannel(activeProjectId, ch.id);
                              setChannels((prev) => prev.filter((c) => c.id !== ch.id));
                            } catch { /* ignore */ }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => { setShowChannelsModal(false); }}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Channel
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
