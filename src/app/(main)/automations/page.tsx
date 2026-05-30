'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  AlertTriangle,
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  Play,
  Pause,
  Clock,
  Zap,
  X,
  GripVertical,
  Settings,
  Trash2,
  Copy,
  Layers,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MousePointer2,
  Hand,
  Hexagon,
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Badge, Button, EmptyState } from '@/components/ui';
import { getAutomations, getMe, runAutomation, toggleAutomation, type AutomationRule } from '@/lib/api';
import { ACTION_CATEGORIES, type FlowNode, type ActionBlock } from '@/lib/automations-mock';

/* ------------------------------------------------------------------ */
/*  SVG Connection Lines                                                */
/* ------------------------------------------------------------------ */

function ConnectionLines({ nodes }: { nodes: FlowNode[] }) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  const lines: { from: FlowNode; to: FlowNode }[] = [];
  for (const node of nodes) {
    for (const targetId of node.connections) {
      const target = nodeMap.get(targetId);
      if (target) lines.push({ from: node, to: target });
    }
  }

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#D4D0C8" />
        </marker>
      </defs>
      {lines.map((line, i) => {
        const fromX = line.from.x + 70;
        const fromY = line.from.y + 35;
        const toX = line.to.x + 70;
        const toY = line.to.y + 35;
        const midY = (fromY + toY) / 2;

        return (
          <path
            key={i}
            d={`M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`}
            stroke="#D4D0C8"
            strokeWidth="1.5"
            fill="none"
            markerEnd="url(#arrowhead)"
            strokeDasharray={line.from.status === 'running' ? '6 3' : 'none'}
            className={line.from.status === 'running' ? 'animate-dash' : ''}
          />
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Flow Node Component                                                 */
/* ------------------------------------------------------------------ */

function FlowNodeCard({ node, selected, onClick }: { node: FlowNode; selected: boolean; onClick: () => void }) {
  const isCondition = node.type === 'trigger' || node.type === 'condition';
  const statusColors: Record<string, string> = {
    running: 'var(--warning)',
    success: 'var(--success)',
    error: 'var(--destructive)',
    pending: 'var(--muted-foreground)',
  };
  const statusColor = node.status ? statusColors[node.status] : 'var(--muted-foreground)';
  const Icon = node.icon;

  if (isCondition) {
    return (
      <div
        className="absolute cursor-pointer group"
        style={{ left: node.x, top: node.y, zIndex: 10 }}
        onClick={onClick}
      >
        <div
          className={`w-[140px] h-[70px] flex items-center justify-center transition-all duration-200 ${selected ? 'scale-105' : 'hover:scale-[1.02]'}`}
          style={{
            background: `${node.color}15`,
            border: `2px solid ${selected ? node.color : `${node.color}40`}`,
            borderRadius: '12px',
            transform: 'rotate(45deg)',
            width: '80px',
            height: '80px',
            marginLeft: '30px',
          }}
        >
          <div style={{ transform: 'rotate(-45deg)' }} className="flex flex-col items-center gap-0.5">
            <Icon className="w-4 h-4" style={{ color: node.color }} />
            <span className="text-[9px] font-semibold text-foreground leading-tight">{node.label}</span>
          </div>
        </div>
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-[9px] text-muted-foreground">{node.sublabel}</span>
        </div>
        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: statusColor }} />
      </div>
    );
  }

  return (
    <div
      className={`absolute cursor-pointer group transition-all duration-200 ${selected ? 'scale-105' : 'hover:scale-[1.02]'}`}
      style={{ left: node.x, top: node.y, zIndex: 10 }}
      onClick={onClick}
    >
      <div
        className="bento-card rounded-xl border-2 bg-white px-4 py-3 min-w-[140px] shadow-sm"
        style={{ borderColor: selected ? node.color : `${node.color}30` }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${node.color}15`, border: `1px solid ${node.color}25` }}
          >
            <Icon className="w-4 h-4" style={{ color: node.color }} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{node.label}</p>
            {node.sublabel && <p className="text-[10px] text-muted-foreground truncate">{node.sublabel}</p>}
          </div>
        </div>
      </div>
      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: statusColor }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Draggable Sidebar Block                                             */
/* ------------------------------------------------------------------ */

function DraggableSidebarBlock({ block }: { block: ActionBlock }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-${block.id}`,
    data: { block },
  });
  const BlockIcon = block.icon;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`bento-card flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-grab hover:bg-white hover:shadow-sm border border-transparent hover:border-border transition-all group touch-none ${isDragging ? 'opacity-30' : ''}`}
    >
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${block.color}12`, border: `1px solid ${block.color}20` }}
      >
        <BlockIcon className="w-3.5 h-3.5" style={{ color: block.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-foreground truncate">{block.name}</p>
        <p className="text-[9px] text-muted-foreground truncate">{block.description}</p>
      </div>
      <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Drag Overlay Preview                                                */
/* ------------------------------------------------------------------ */

function BlockDragOverlay({ block }: { block: ActionBlock }) {
  const BlockIcon = block.icon;
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white shadow-xl border-2 border-primary/30 w-[180px]">
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${block.color}15`, border: `1px solid ${block.color}25` }}
      >
        <BlockIcon className="w-3.5 h-3.5" style={{ color: block.color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-foreground truncate">{block.name}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Placed Canvas Block                                                 */
/* ------------------------------------------------------------------ */

interface PlacedBlock {
  id: string;
  blockId: string;
  type: string;
  label: string;
  icon: React.ElementType;
  color: string;
  x: number;
  y: number;
}

function PlacedBlockCard({ block, selected, onClick }: { block: PlacedBlock; selected: boolean; onClick: () => void }) {
  const Icon = block.icon;
  return (
    <div
      className={`absolute cursor-pointer group transition-all duration-200 ${selected ? 'scale-105' : 'hover:scale-[1.02]'}`}
      style={{ left: block.x, top: block.y, zIndex: 10 }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      <div
        className="bento-card rounded-xl border-2 bg-white px-4 py-3 min-w-[140px] shadow-sm"
        style={{ borderColor: selected ? block.color : `${block.color}30` }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${block.color}15`, border: `1px solid ${block.color}25` }}
          >
            <Icon className="w-4 h-4" style={{ color: block.color }} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{block.label}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Droppable Canvas Wrapper                                            */
/* ------------------------------------------------------------------ */

function DroppableCanvas({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'automations-canvas' });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 relative overflow-auto transition-colors duration-200 ${isOver ? 'bg-primary/[0.02]' : ''}`}
    >
      {isOver && (
        <div className="absolute inset-0 border-2 border-dashed border-primary/20 rounded-xl pointer-events-none z-50" />
      )}
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                           */
/* ------------------------------------------------------------------ */

export default function AutomationsPage() {
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Action Blocks']));
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [canvasTool, setCanvasTool] = useState<'select' | 'pan'>('select');
  const canvasRef = useRef<HTMLDivElement>(null);
  const [placedBlocks, setPlacedBlocks] = useState<PlacedBlock[]>([]);
  const [activeDragBlock, setActiveDragBlock] = useState<ActionBlock | null>(null);
  const [toggling, setToggling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedRule = selectedRuleId ? automationRules.find(r => r.id === selectedRuleId) : automationRules[0] ?? null;

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const allBlocks = ACTION_CATEGORIES.flatMap(c => c.blocks);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const block = event.active.data.current?.block as ActionBlock | undefined;
    if (block) setActiveDragBlock(block);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragBlock(null);
    const { active, over } = event;
    if (!over || over.id !== 'automations-canvas') return;

    const block = active.data.current?.block as ActionBlock | undefined;
    if (!block) return;

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    const pointerX = (event.activatorEvent as PointerEvent)?.clientX ?? 0;
    const pointerY = (event.activatorEvent as PointerEvent)?.clientY ?? 0;
    const deltaX = event.delta.x;
    const deltaY = event.delta.y;

    let x = 100;
    let y = 100;
    if (canvasRect) {
      x = Math.max(20, (pointerX + deltaX - canvasRect.left) / zoom);
      y = Math.max(20, (pointerY + deltaY - canvasRect.top) / zoom);
    }

    const placed: PlacedBlock = {
      id: `placed-${Date.now()}`,
      blockId: block.id,
      type: block.id,
      label: block.name,
      icon: block.icon,
      color: block.color,
      x,
      y,
    };
    setPlacedBlocks(prev => [...prev, placed]);
  }, [zoom]);

  useEffect(() => {
    getMe()
      .then(me => getAutomations(me.org_id))
      .then(rules => {
        if (rules.length > 0) {
          setAutomationRules(rules);
          setSelectedRuleId(prev => prev && rules.some(r => r.id === prev) ? prev : rules[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to load automations', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleCategory = (name: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (automationRules.length === 0) {
    return (
      <EmptyState
        icon={Zap}
        title="No automations yet"
        description="Create your first automation rule to streamline repetitive tasks like ticket transitions, notifications, and sprint management."
        actionLabel="Create Automation"
      />
    );
  }

  const filteredCategories = ACTION_CATEGORIES.map(cat => ({
    ...cat,
    blocks: cat.blocks.filter(b =>
      b.name.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
      b.description.toLowerCase().includes(sidebarSearch.toLowerCase())
    ),
  })).filter(cat => sidebarSearch === '' || cat.blocks.length > 0);

  return (
    <>
      <DndContext sensors={dndSensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="-m-6 lg:-m-8 -mt-[5.5rem] lg:-mt-[5.5rem] flex flex-col h-screen">
        {/* ── Top Bar ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-white shrink-0 mt-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground">{selectedRule?.name ?? 'Select automation'}</h1>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedRule?.enabled ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
                  {selectedRule?.enabled ? 'Active' : 'Paused'}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {selectedRule?.updated_at ? new Date(selectedRule.updated_at).toLocaleDateString() : '—'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedRule?.enabled ? (
              <>
                <Badge variant="success">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Live
                </Badge>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!selectedRule || toggling}
                  onClick={() => {
                    if (!selectedRule) return;
                    setToggling(true);
                    toggleAutomation(selectedRule.id, false)
                      .then(() => {
                        setAutomationRules(prev => prev.map(r => r.id === selectedRule.id ? { ...r, enabled: false } : r));
                        setActionError(null);
                      })
                      .catch((err) => {
                        setActionError(err?.message || 'Failed to pause automation');
                        console.error('Toggle automation failed', err);
                      })
                      .finally(() => setToggling(false));
                  }}
                >
                  <Pause className="w-3.5 h-3.5" /> Pause
                </Button>
              </>
            ) : (
              <>
                <Badge variant="muted">Paused</Badge>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!selectedRule || toggling}
                  onClick={() => {
                    if (!selectedRule) return;
                    setToggling(true);
                    toggleAutomation(selectedRule.id, true)
                      .then(() => {
                        setAutomationRules(prev => prev.map(r => r.id === selectedRule.id ? { ...r, enabled: true } : r));
                        setActionError(null);
                      })
                      .catch((err) => {
                        setActionError(err?.message || 'Failed to resume automation');
                        console.error('Toggle automation failed', err);
                      })
                      .finally(() => setToggling(false));
                  }}
                >
                  <Play className="w-3.5 h-3.5" /> Resume
                </Button>
              </>
            )}
            <Button
              variant="primary"
              size="sm"
              disabled={!selectedRule || toggling}
              onClick={() => {
                if (!selectedRule) return;
                setToggling(true);
                runAutomation(selectedRule.id)
                  .then(() => {
                    setAutomationRules(prev => prev.map(r => r.id === selectedRule.id ? { ...r, updated_at: new Date().toISOString() } : r));
                    setActionError(null);
                  })
                  .catch((err) => {
                    setActionError(err?.message || 'Failed to run automation');
                    console.error('Run automation failed', err);
                  })
                  .finally(() => setToggling(false));
              }}
            >
              <Play className="w-3.5 h-3.5" /> Run Now
            </Button>
          </div>
        </div>

        {/* ── Action Error Banner ── */}
        {actionError && (
          <div className="mx-5 mt-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <span className="text-sm font-medium text-destructive">{actionError}</span>
            <button onClick={() => setActionError(null)} className="ml-auto p-1 rounded hover:bg-destructive/10 transition-colors">
              <X className="w-3.5 h-3.5 text-destructive" />
            </button>
          </div>
        )}

        {/* ── Main Content: Sidebar + Canvas ── */}
        <div className="flex flex-1 min-h-0">

          {/* ── Left Sidebar: Rules + Action Blocks ── */}
          <div className="w-64 border-r border-border bg-[#F9F8F6] flex flex-col shrink-0 overflow-hidden">
            {/* Automations list */}
            <div className="px-4 pt-4 pb-2 border-b border-border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">Automations</span>
              </div>
              <div className="space-y-0.5 max-h-32 overflow-y-auto">
                {automationRules.map((rule) => (
                  <button
                    key={rule.id}
                    onClick={() => setSelectedRuleId(rule.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium truncate transition-colors ${
                      selectedRule?.id === rule.id
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground border border-transparent'
                    }`}
                  >
                    {rule.name}
                  </button>
                ))}
              </div>
            </div>
            {/* Sidebar Header: Action Blocks */}
            <div className="px-4 pt-2 pb-2 border-b border-border">
              <div className="flex items-center gap-2 mb-2">
                <Hexagon className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">Action Blocks</span>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search blocks..."
                  value={sidebarSearch}
                  onChange={e => setSidebarSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                />
              </div>
            </div>

            {/* Action Block Categories */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin">
              {filteredCategories.map(category => {
                const isExpanded = expandedCategories.has(category.name);
                const CatIcon = category.icon;

                return (
                  <div key={category.name}>
                    <button
                      onClick={() => toggleCategory(category.name)}
                      className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-muted/60 transition-colors"
                    >
                      {isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                      <CatIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{category.name}</span>
                    </button>

                    {isExpanded && (
                      <div className="ml-2 space-y-0.5 mt-1">
                        {category.blocks.map(block => (
                          <DraggableSidebarBlock key={block.id} block={block} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Main Canvas ── */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAF8]">

            {/* Canvas Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-white/80 backdrop-blur-sm">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCanvasTool('select')}
                  className={`p-1.5 rounded-md transition-colors ${canvasTool === 'select' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <MousePointer2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCanvasTool('pan')}
                  className={`p-1.5 rounded-md transition-colors ${canvasTool === 'pan' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Hand className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-border mx-1" />
                <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors">
                  <Undo2 className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors">
                  <Redo2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1 rounded hover:bg-muted transition-colors">
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="tabular-nums min-w-[36px] text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1 rounded hover:bg-muted transition-colors">
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setZoom(1)} className="p-1 rounded hover:bg-muted transition-colors">
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Canvas Area */}
            <DroppableCanvas>
              <div
                ref={canvasRef}
                className="relative min-h-full"
                style={{ cursor: canvasTool === 'pan' ? 'grab' : 'default' }}
                onClick={() => setSelectedNode(null)}
              >
                {/* Dot grid background */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #D4D0C8 0.8px, transparent 0.8px)',
                    backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
                  }}
                />

                {/* Flow content */}
                <div
                  className="relative min-w-[900px] min-h-[600px]"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                >
                  <ConnectionLines nodes={[]} />
                  {placedBlocks.map(block => (
                    <PlacedBlockCard
                      key={block.id}
                      block={block}
                      selected={selectedNode === block.id}
                      onClick={() => setSelectedNode(block.id)}
                    />
                  ))}
                </div>
              </div>
            </DroppableCanvas>

            {/* ── Bottom Toolbar ── */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-white">
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-border mx-1" />
                <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  <Layers className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search on Issues"
                    className="pl-8 pr-3 py-1.5 text-xs bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 w-48 transition-all"
                  />
                </div>
                <Button variant="primary" size="sm">
                  <Plus className="w-3.5 h-3.5" /> Quick Add
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <DragOverlay>
        {activeDragBlock && <BlockDragOverlay block={activeDragBlock} />}
      </DragOverlay>
      </DndContext>
    </>
  );
}
