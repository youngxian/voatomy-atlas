'use client';

import { useReducer, useRef, useCallback, useMemo, type RefObject } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type WorkflowNodeType =
  | 'trigger'
  | 'action'
  | 'condition'
  | 'ai'
  | 'notification'
  | 'meeting'
  | 'data';

export interface Port {
  id: string;
  type: 'input' | 'output';
  label?: string;
  side: 'top' | 'bottom' | 'left' | 'right';
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  config: Record<string, unknown>;
  ports: Port[];
  stats?: { count: number; throughput?: number; avgTime?: string };
}

export interface WorkflowEdge {
  id: string;
  sourceId: string;
  sourcePort: string;
  targetId: string;
  targetPort: string;
  label?: string;
  animated?: boolean;
  condition?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

interface WorkflowState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeIds: Set<string>;
  selectedEdgeIds: Set<string>;
  viewport: Viewport;
  snapToGrid: boolean;
  showGrid: boolean;
  gridSize: number;
  showFlow: boolean;
}

/* ------------------------------------------------------------------ */
/*  Actions                                                            */
/* ------------------------------------------------------------------ */

type Action =
  | { type: 'ADD_NODE'; node: WorkflowNode }
  | { type: 'MOVE_NODE'; id: string; x: number; y: number }
  | { type: 'REMOVE_NODES'; ids: string[] }
  | { type: 'UPDATE_NODE_CONFIG'; id: string; config: Record<string, unknown> }
  | { type: 'UPDATE_NODE_STATS'; id: string; stats: WorkflowNode['stats'] }
  | { type: 'CONNECT'; edge: WorkflowEdge }
  | { type: 'REMOVE_EDGES'; ids: string[] }
  | { type: 'DISCONNECT_NODE'; nodeId: string }
  | { type: 'SELECT_NODES'; ids: string[]; additive?: boolean }
  | { type: 'SELECT_EDGES'; ids: string[]; additive?: boolean }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SELECT_ALL' }
  | { type: 'DUPLICATE_SELECTED' }
  | { type: 'SET_VIEWPORT'; viewport: Viewport }
  | { type: 'TOGGLE_SNAP' }
  | { type: 'TOGGLE_GRID' }
  | { type: 'TOGGLE_FLOW' }
  | { type: 'REVERSE_EDGE'; id: string }
  | { type: 'UPDATE_EDGE_LABEL'; id: string; label: string }
  | { type: 'UPDATE_NODE_LABEL'; id: string; label: string }
  | { type: 'APPLY_TEMPLATE'; template: WorkflowTemplate }
  | { type: 'LOAD_STATE'; state: Pick<WorkflowState, 'nodes' | 'edges'> }
  | { type: 'RESTORE_SNAPSHOT'; snapshot: Pick<WorkflowState, 'nodes' | 'edges' | 'selectedNodeIds' | 'selectedEdgeIds'> };

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

let _nextId = 1;
export function genId(prefix = 'wf'): string {
  return `${prefix}_${Date.now()}_${_nextId++}`;
}

function snapValue(v: number, gridSize: number, enabled: boolean): number {
  return enabled ? Math.round(v / gridSize) * gridSize : v;
}

/* ------------------------------------------------------------------ */
/*  Reducer                                                            */
/* ------------------------------------------------------------------ */

function reducer(state: WorkflowState, action: Action): WorkflowState {
  switch (action.type) {
    case 'ADD_NODE': {
      const rawX = isFinite(action.node.x) ? action.node.x : 100;
      const rawY = isFinite(action.node.y) ? action.node.y : 100;
      const node = {
        ...action.node,
        x: snapValue(rawX, state.gridSize, state.snapToGrid),
        y: snapValue(rawY, state.gridSize, state.snapToGrid),
      };
      return { ...state, nodes: [...state.nodes, node] };
    }

    case 'MOVE_NODE': {
      const rawX = isFinite(action.x) ? action.x : 0;
      const rawY = isFinite(action.y) ? action.y : 0;
      const x = snapValue(rawX, state.gridSize, state.snapToGrid);
      const y = snapValue(rawY, state.gridSize, state.snapToGrid);
      return {
        ...state,
        nodes: state.nodes.map(n => n.id === action.id ? { ...n, x, y } : n),
      };
    }

    case 'REMOVE_NODES': {
      const idSet = new Set(action.ids);
      const nextSelected = new Set(state.selectedNodeIds);
      action.ids.forEach(id => nextSelected.delete(id));
      return {
        ...state,
        nodes: state.nodes.filter(n => !idSet.has(n.id)),
        edges: state.edges.filter(e => !idSet.has(e.sourceId) && !idSet.has(e.targetId)),
        selectedNodeIds: nextSelected,
      };
    }

    case 'UPDATE_NODE_CONFIG':
      return {
        ...state,
        nodes: state.nodes.map(n =>
          n.id === action.id ? { ...n, config: { ...n.config, ...action.config } } : n
        ),
      };

    case 'UPDATE_NODE_STATS':
      return {
        ...state,
        nodes: state.nodes.map(n =>
          n.id === action.id ? { ...n, stats: action.stats } : n
        ),
      };

    case 'CONNECT': {
      const exists = state.edges.some(
        e => e.sourceId === action.edge.sourceId &&
             e.sourcePort === action.edge.sourcePort &&
             e.targetId === action.edge.targetId &&
             e.targetPort === action.edge.targetPort
      );
      if (exists) return state;
      return { ...state, edges: [...state.edges, action.edge] };
    }

    case 'REMOVE_EDGES': {
      const idSet = new Set(action.ids);
      const nextSelectedEdges = new Set(state.selectedEdgeIds);
      action.ids.forEach(id => nextSelectedEdges.delete(id));
      return {
        ...state,
        edges: state.edges.filter(e => !idSet.has(e.id)),
        selectedEdgeIds: nextSelectedEdges,
      };
    }

    case 'DISCONNECT_NODE':
      return {
        ...state,
        edges: state.edges.filter(
          e => e.sourceId !== action.nodeId && e.targetId !== action.nodeId
        ),
      };

    case 'SELECT_NODES': {
      const next = action.additive ? new Set(state.selectedNodeIds) : new Set<string>();
      action.ids.forEach(id => next.add(id));
      return { ...state, selectedNodeIds: next, selectedEdgeIds: action.additive ? state.selectedEdgeIds : new Set() };
    }

    case 'SELECT_EDGES': {
      const next = action.additive ? new Set(state.selectedEdgeIds) : new Set<string>();
      action.ids.forEach(id => next.add(id));
      return { ...state, selectedEdgeIds: next, selectedNodeIds: action.additive ? state.selectedNodeIds : new Set() };
    }

    case 'CLEAR_SELECTION':
      return { ...state, selectedNodeIds: new Set(), selectedEdgeIds: new Set() };

    case 'SELECT_ALL':
      return {
        ...state,
        selectedNodeIds: new Set(state.nodes.map(n => n.id)),
        selectedEdgeIds: new Set(state.edges.map(e => e.id)),
      };

    case 'DUPLICATE_SELECTED': {
      const idMap = new Map<string, string>();
      const newNodes = state.nodes
        .filter(n => state.selectedNodeIds.has(n.id))
        .map(n => {
          const newId = genId('node');
          idMap.set(n.id, newId);
          return {
            ...n,
            id: newId,
            x: n.x + 40,
            y: n.y + 40,
            ports: n.ports.map(p => ({ ...p, id: `${newId}_${p.type}_${p.label ?? p.id}` })),
          };
        });
      const newEdges = state.edges
        .filter(e => state.selectedNodeIds.has(e.sourceId) && state.selectedNodeIds.has(e.targetId))
        .map(e => ({
          ...e,
          id: genId('edge'),
          sourceId: idMap.get(e.sourceId) ?? e.sourceId,
          targetId: idMap.get(e.targetId) ?? e.targetId,
        }));
      return {
        ...state,
        nodes: [...state.nodes, ...newNodes],
        edges: [...state.edges, ...newEdges],
        selectedNodeIds: new Set(newNodes.map(n => n.id)),
      };
    }

    case 'SET_VIEWPORT': {
      const zoom = Math.max(0.1, Math.min(4, action.viewport.zoom || 1));
      return { ...state, viewport: { ...action.viewport, zoom } };
    }

    case 'TOGGLE_SNAP':
      return { ...state, snapToGrid: !state.snapToGrid };

    case 'TOGGLE_GRID':
      return { ...state, showGrid: !state.showGrid };

    case 'TOGGLE_FLOW':
      return { ...state, showFlow: !state.showFlow };

    case 'REVERSE_EDGE': {
      return {
        ...state,
        edges: state.edges.map(e => {
          if (e.id !== action.id) return e;
          return { ...e, sourceId: e.targetId, sourcePort: e.targetPort, targetId: e.sourceId, targetPort: e.sourcePort };
        }),
      };
    }

    case 'UPDATE_EDGE_LABEL':
      return {
        ...state,
        edges: state.edges.map(e => e.id === action.id ? { ...e, label: action.label } : e),
      };

    case 'UPDATE_NODE_LABEL':
      return {
        ...state,
        nodes: state.nodes.map(n => n.id === action.id ? { ...n, label: action.label } : n),
      };

    case 'APPLY_TEMPLATE':
      return {
        ...state,
        nodes: action.template.nodes,
        edges: action.template.edges,
        selectedNodeIds: new Set(),
        selectedEdgeIds: new Set(),
      };

    case 'LOAD_STATE':
      return {
        ...state,
        nodes: action.state.nodes,
        edges: action.state.edges,
        selectedNodeIds: new Set(),
        selectedEdgeIds: new Set(),
      };

    case 'RESTORE_SNAPSHOT':
      return {
        ...state,
        nodes: action.snapshot.nodes,
        edges: action.snapshot.edges,
        selectedNodeIds: action.snapshot.selectedNodeIds,
        selectedEdgeIds: action.snapshot.selectedEdgeIds,
      };

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/*  History (undo/redo)                                                */
/* ------------------------------------------------------------------ */

interface Snapshot {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeIds: Set<string>;
  selectedEdgeIds: Set<string>;
}

const MAX_HISTORY = 50;

const HISTORY_ACTIONS = new Set<Action['type']>([
  'ADD_NODE', 'MOVE_NODE', 'REMOVE_NODES', 'UPDATE_NODE_CONFIG', 'UPDATE_NODE_LABEL',
  'CONNECT', 'REMOVE_EDGES', 'DISCONNECT_NODE', 'DUPLICATE_SELECTED',
  'APPLY_TEMPLATE', 'LOAD_STATE', 'REVERSE_EDGE', 'UPDATE_EDGE_LABEL',
]);

/* ------------------------------------------------------------------ */
/*  Initial state                                                      */
/* ------------------------------------------------------------------ */

const INITIAL_STATE: WorkflowState = {
  nodes: [],
  edges: [],
  selectedNodeIds: new Set(),
  selectedEdgeIds: new Set(),
  viewport: { x: 0, y: 0, zoom: 1 },
  snapToGrid: true,
  showGrid: true,
  gridSize: 20,
  showFlow: true,
};

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useWorkflowState() {
  const [state, rawDispatch] = useReducer(reducer, INITIAL_STATE);
  const undoStack = useRef<Snapshot[]>([]);
  const redoStack = useRef<Snapshot[]>([]);

  const takeSnapshot = useCallback((): Snapshot => ({
    nodes: state.nodes.map(n => ({ ...n })),
    edges: state.edges.map(e => ({ ...e })),
    selectedNodeIds: new Set(state.selectedNodeIds),
    selectedEdgeIds: new Set(state.selectedEdgeIds),
  }), [state.nodes, state.edges, state.selectedNodeIds, state.selectedEdgeIds]);

  const dispatch = useCallback((action: Action) => {
    if (HISTORY_ACTIONS.has(action.type)) {
      undoStack.current = [
        ...undoStack.current.slice(-(MAX_HISTORY - 1)),
        {
          nodes: state.nodes.map(n => ({ ...n })),
          edges: state.edges.map(e => ({ ...e })),
          selectedNodeIds: new Set(state.selectedNodeIds),
          selectedEdgeIds: new Set(state.selectedEdgeIds),
        },
      ];
      redoStack.current = [];
    }
    rawDispatch(action);
  }, [state.nodes, state.edges, state.selectedNodeIds, state.selectedEdgeIds]);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    redoStack.current.push(takeSnapshot());
    rawDispatch({ type: 'RESTORE_SNAPSHOT', snapshot: prev });
  }, [takeSnapshot]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(takeSnapshot());
    rawDispatch({ type: 'RESTORE_SNAPSHOT', snapshot: next });
  }, [takeSnapshot]);

  /* ---- Convenience API ---- */

  const addNode = useCallback((type: WorkflowNodeType, x: number, y: number, overrides?: Partial<WorkflowNode>) => {
    const id = genId('node');
    const defaults = NODE_DEFAULTS[type];
    const node: WorkflowNode = {
      id,
      type,
      label: defaults.label,
      x: isFinite(x) ? x : 100,
      y: isFinite(y) ? y : 100,
      width: defaults.width,
      height: defaults.height,
      color: defaults.color,
      config: {},
      ports: defaults.ports.map(p => ({ ...p, id: `${id}_${p.id}` })),
      ...overrides,
    };
    dispatch({ type: 'ADD_NODE', node });
    return id;
  }, [dispatch]);

  const moveNode = useCallback((id: string, x: number, y: number) => {
    dispatch({ type: 'MOVE_NODE', id, x, y });
  }, [dispatch]);

  const removeSelected = useCallback(() => {
    const nodeIds = [...state.selectedNodeIds];
    const edgeIds = [...state.selectedEdgeIds];
    if (nodeIds.length) dispatch({ type: 'REMOVE_NODES', ids: nodeIds });
    if (edgeIds.length) dispatch({ type: 'REMOVE_EDGES', ids: edgeIds });
  }, [dispatch, state.selectedNodeIds, state.selectedEdgeIds]);

  const connectNodes = useCallback((sourceId: string, sourcePort: string, targetId: string, targetPort: string) => {
    const edge: WorkflowEdge = {
      id: genId('edge'),
      sourceId,
      sourcePort,
      targetId,
      targetPort,
      animated: true,
    };
    dispatch({ type: 'CONNECT', edge });
    return edge.id;
  }, [dispatch]);

  const updateNodeConfig = useCallback((id: string, config: Record<string, unknown>) => {
    dispatch({ type: 'UPDATE_NODE_CONFIG', id, config });
  }, [dispatch]);

  const updateNodeStats = useCallback((id: string, stats: WorkflowNode['stats']) => {
    dispatch({ type: 'UPDATE_NODE_STATS', id, stats });
  }, [dispatch]);

  const selectNode = useCallback((id: string, additive = false) => {
    dispatch({ type: 'SELECT_NODES', ids: [id], additive });
  }, [dispatch]);

  const selectMultiple = useCallback((ids: string[]) => {
    dispatch({ type: 'SELECT_NODES', ids });
  }, [dispatch]);

  const selectEdge = useCallback((id: string, additive = false) => {
    dispatch({ type: 'SELECT_EDGES', ids: [id], additive });
  }, [dispatch]);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, [dispatch]);

  const selectAll = useCallback(() => {
    dispatch({ type: 'SELECT_ALL' });
  }, [dispatch]);

  const duplicateSelected = useCallback(() => {
    dispatch({ type: 'DUPLICATE_SELECTED' });
  }, [dispatch]);

  const setViewport = useCallback((viewport: Viewport) => {
    dispatch({ type: 'SET_VIEWPORT', viewport });
  }, [dispatch]);

  const toggleSnap = useCallback(() => {
    dispatch({ type: 'TOGGLE_SNAP' });
  }, [dispatch]);

  const toggleGrid = useCallback(() => {
    dispatch({ type: 'TOGGLE_GRID' });
  }, [dispatch]);

  const toggleFlow = useCallback(() => {
    dispatch({ type: 'TOGGLE_FLOW' });
  }, [dispatch]);

  const disconnectNode = useCallback((nodeId: string) => {
    dispatch({ type: 'DISCONNECT_NODE', nodeId });
  }, [dispatch]);

  const reverseEdge = useCallback((id: string) => {
    dispatch({ type: 'REVERSE_EDGE', id });
  }, [dispatch]);

  const updateEdgeLabel = useCallback((id: string, label: string) => {
    dispatch({ type: 'UPDATE_EDGE_LABEL', id, label });
  }, [dispatch]);

  const updateNodeLabel = useCallback((id: string, label: string) => {
    dispatch({ type: 'UPDATE_NODE_LABEL', id, label });
  }, [dispatch]);

  const applyTemplate = useCallback((template: WorkflowTemplate) => {
    dispatch({ type: 'APPLY_TEMPLATE', template });

    // Compute fitted viewport directly from template nodes (not stale state)
    const cw = canvasSizeRef.current.w;
    const ch = canvasSizeRef.current.h;
    if (template.nodes.length === 0 || cw <= 0 || ch <= 0) {
      rawDispatch({ type: 'SET_VIEWPORT', viewport: { x: 0, y: 0, zoom: 1 } });
      return;
    }
    const padding = 80;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of template.nodes) {
      if (!isFinite(n.x) || !isFinite(n.y)) continue;
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + (n.width || 180));
      maxY = Math.max(maxY, n.y + (n.height || 72));
    }
    if (!isFinite(minX)) {
      rawDispatch({ type: 'SET_VIEWPORT', viewport: { x: 0, y: 0, zoom: 1 } });
      return;
    }
    const w = maxX - minX + padding * 2;
    const h = maxY - minY + padding * 2;
    const zoom = Math.max(0.25, Math.min(cw / w, ch / h, 4));
    const vx = (cw - w * zoom) / 2 - minX * zoom + padding * zoom;
    const vy = (ch - h * zoom) / 2 - minY * zoom + padding * zoom;
    rawDispatch({ type: 'SET_VIEWPORT', viewport: { x: vx, y: vy, zoom } });
  }, [dispatch]);

  const canvasSizeRef = useRef({ w: 900, h: 600 });
  const setCanvasSize = useCallback((w: number, h: number) => {
    canvasSizeRef.current = { w, h };
  }, []);

  const fitView = useCallback((containerWidth?: number, containerHeight?: number) => {
    const cw = containerWidth ?? canvasSizeRef.current.w;
    const ch = containerHeight ?? canvasSizeRef.current.h;
    if (state.nodes.length === 0 || cw <= 0 || ch <= 0) {
      dispatch({ type: 'SET_VIEWPORT', viewport: { x: 0, y: 0, zoom: 1 } });
      return;
    }
    const padding = 80;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of state.nodes) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    }
    const w = maxX - minX + padding * 2;
    const h = maxY - minY + padding * 2;
    const zoom = Math.max(0.25, Math.min(cw / w, ch / h, 4));
    const x = (cw - w * zoom) / 2 - minX * zoom + padding * zoom;
    const y = (ch - h * zoom) / 2 - minY * zoom + padding * zoom;
    dispatch({ type: 'SET_VIEWPORT', viewport: { x, y, zoom } });
  }, [dispatch, state.nodes]);

  /* ---- Serialization ---- */

  const toJSON = useCallback(() => {
    return JSON.stringify({
      nodes: state.nodes,
      edges: state.edges,
    });
  }, [state.nodes, state.edges]);

  const fromJSON = useCallback((json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.nodes && data.edges) {
        dispatch({ type: 'LOAD_STATE', state: { nodes: data.nodes, edges: data.edges } });
        if (data.viewport && isFinite(data.viewport.zoom)) {
          rawDispatch({ type: 'SET_VIEWPORT', viewport: data.viewport });
        }
      }
    } catch {
      // invalid JSON — ignore
    }
  }, [dispatch]);

  const save = useCallback(() => {
    try {
      localStorage.setItem('atlas_workflow', toJSON());
      return true;
    } catch {
      return false;
    }
  }, [toJSON]);

  const load = useCallback(() => {
    try {
      const json = localStorage.getItem('atlas_workflow');
      if (json) fromJSON(json);
    } catch {
      // noop
    }
  }, [fromJSON]);

  const canUndo = undoStack.current.length > 0;
  const canRedo = redoStack.current.length > 0;

  const selectedNodes = useMemo(() =>
    state.nodes.filter(n => state.selectedNodeIds.has(n.id)),
    [state.nodes, state.selectedNodeIds]
  );

  return useMemo(() => ({
    ...state,
    selectedNodes,
    addNode,
    moveNode,
    removeSelected,
    connectNodes,
    updateNodeConfig,
    updateNodeStats,
    updateNodeLabel,
    selectNode,
    selectMultiple,
    selectEdge,
    clearSelection,
    selectAll,
    duplicateSelected,
    setViewport,
    setCanvasSize,
    toggleSnap,
    toggleGrid,
    toggleFlow,
    disconnectNode,
    reverseEdge,
    updateEdgeLabel,
    applyTemplate,
    fitView,
    undo,
    redo,
    canUndo,
    canRedo,
    toJSON,
    fromJSON,
    save,
    load,
    dispatch,
  }), [
    state, selectedNodes, addNode, moveNode, removeSelected, connectNodes,
    updateNodeConfig, updateNodeStats, updateNodeLabel, selectNode, selectMultiple,
    selectEdge, clearSelection, selectAll, duplicateSelected,
    setViewport, setCanvasSize, toggleSnap, toggleGrid, toggleFlow,
    disconnectNode, reverseEdge, updateEdgeLabel, applyTemplate, fitView,
    undo, redo, canUndo, canRedo, toJSON, fromJSON, save, load, dispatch,
  ]);
}

/* ------------------------------------------------------------------ */
/*  Node defaults per type                                             */
/* ------------------------------------------------------------------ */

interface NodeDefaults {
  label: string;
  color: string;
  width: number;
  height: number;
  ports: Port[];
}

export const NODE_DEFAULTS: Record<WorkflowNodeType, NodeDefaults> = {
  trigger: {
    label: 'Trigger',
    color: '#f59e0b',
    width: 180,
    height: 72,
    ports: [{ id: 'out', type: 'output', label: 'out', side: 'right' }],
  },
  action: {
    label: 'Action',
    color: '#22C55E',
    width: 180,
    height: 72,
    ports: [
      { id: 'in', type: 'input', label: 'in', side: 'left' },
      { id: 'out', type: 'output', label: 'out', side: 'right' },
    ],
  },
  condition: {
    label: 'Condition',
    color: '#ca8a04',
    width: 180,
    height: 72,
    ports: [
      { id: 'in', type: 'input', label: 'in', side: 'left' },
      { id: 'yes', type: 'output', label: 'yes', side: 'right' },
      { id: 'no', type: 'output', label: 'no', side: 'right' },
    ],
  },
  ai: {
    label: 'AI Analysis',
    color: '#8b5cf6',
    width: 180,
    height: 72,
    ports: [
      { id: 'in', type: 'input', label: 'in', side: 'left' },
      { id: 'out', type: 'output', label: 'out', side: 'right' },
      { id: 'alt1', type: 'output', label: 'alt1', side: 'right' },
      { id: 'alt2', type: 'output', label: 'alt2', side: 'right' },
    ],
  },
  notification: {
    label: 'Notification',
    color: '#e22d2d',
    width: 180,
    height: 72,
    ports: [
      { id: 'in', type: 'input', label: 'in', side: 'left' },
      { id: 'out', type: 'output', label: 'out', side: 'right' },
    ],
  },
  meeting: {
    label: 'Meeting',
    color: '#2563EB',
    width: 180,
    height: 72,
    ports: [
      { id: 'in', type: 'input', label: 'in', side: 'left' },
      { id: 'out', type: 'output', label: 'out', side: 'right' },
    ],
  },
  data: {
    label: 'Data',
    color: '#06b6d4',
    width: 180,
    height: 72,
    ports: [
      { id: 'in', type: 'input', label: 'in', side: 'left' },
      { id: 'out', type: 'output', label: 'out', side: 'right' },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Pre-built templates                                                */
/* ------------------------------------------------------------------ */

export function getDefaultPorts(type: WorkflowNodeType): Port[] {
  const d = NODE_DEFAULTS[type];
  return d.ports.map(p => ({ ...p }));
}


