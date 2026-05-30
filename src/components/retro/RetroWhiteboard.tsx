'use client';

import { useState, useRef, useCallback } from 'react';
import {
  MousePointer2,
  Hand,
  PenTool,
  StickyNote,
  Type,
  Eraser,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  GripVertical,
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { WbTool, StickyColor, StickyNoteData, DrawPath, RetroColumnId } from '@/lib/retro-types';
import { STICKY_COLORS } from '@/lib/retro-types';

const COLUMN_CONFIG: { id: RetroColumnId; label: string; colorClass: string; dotColor: string; borderColor: string }[] = [
  { id: 'www', label: 'What Went Well', colorClass: 'text-success', dotColor: 'bg-success/30 border-success/50', borderColor: 'border-success/20' },
  { id: 'cia', label: 'Could Improve', colorClass: 'text-warning', dotColor: 'bg-warning/30 border-warning/50', borderColor: 'border-warning/20' },
  { id: 'action', label: 'Action Items', colorClass: 'text-primary', dotColor: 'bg-primary/30 border-primary/50', borderColor: 'border-primary/20' },
];

function DroppableColumn({ id, children, label, colorClass, dotColor, borderColor, stickyCount }: {
  id: RetroColumnId;
  children: React.ReactNode;
  label: string;
  colorClass: string;
  dotColor: string;
  borderColor: string;
  stickyCount: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 flex flex-col min-h-[300px] rounded-xl border ${borderColor} bg-card/50 transition-colors duration-200 ${isOver ? 'bg-primary/[0.04] border-primary/30' : ''}`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-sm border ${dotColor}`} />
          <span className={`text-xs font-semibold ${colorClass}`}>{label}</span>
        </div>
        <span className="text-[10px] text-muted-foreground tabular-nums">{stickyCount}</span>
      </div>
      <div className="flex-1 p-3 space-y-2 overflow-y-auto min-h-[200px]">
        {children}
        {stickyCount === 0 && !isOver && (
          <div className="flex items-center justify-center h-24 text-[10px] text-muted-foreground/40 border border-dashed border-border/30 rounded-lg">
            Drop notes here
          </div>
        )}
      </div>
    </div>
  );
}

function SortableStickyCard({
  sticky,
  isSelected,
  isEditing,
  onSelect,
  onEdit,
  onDelete,
  onTextChange,
  onBlur,
}: {
  sticky: StickyNoteData;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTextChange: (text: string) => void;
  onBlur: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sticky.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : isSelected ? 30 : 'auto' as const,
  };

  const colors = STICKY_COLORS[sticky.color];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`wb-note-enter rounded-lg border-2 p-3 transition-shadow duration-200 ${isSelected ? 'shadow-lg shadow-primary/10 ring-2 ring-primary/30' : ''}`}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onDoubleClick={(e) => { e.stopPropagation(); onEdit(); }}
    >
      <div
        style={{
          backgroundColor: colors.bg,
          borderColor: isSelected ? colors.border : `${colors.border}60`,
          minHeight: 80,
        }}
        className="rounded-lg border p-3 relative"
      >
        <div className="flex items-start gap-2">
          <div
            className="shrink-0 cursor-grab touch-none opacity-40 hover:opacity-100 transition-opacity mt-0.5"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <textarea
                autoFocus
                value={sticky.text}
                onChange={e => onTextChange(e.target.value)}
                onBlur={onBlur}
                onKeyDown={e => { if (e.key === 'Escape') onBlur(); }}
                className="w-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed"
                style={{ color: colors.text }}
                placeholder="Type here..."
                rows={3}
              />
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: colors.text }}>
                {sticky.text || <span className="opacity-50 italic">Double-click to edit</span>}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 pt-1.5 border-t" style={{ borderColor: `${colors.border}40` }}>
          <div className="flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold text-white"
              style={{ backgroundColor: colors.border }}
            >
              {sticky.authorInitials}
            </div>
            <span className="text-[9px]" style={{ color: `${colors.text}80` }}>{sticky.author}</span>
          </div>
          {isSelected && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              className="p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StickyDragOverlay({ sticky }: { sticky: StickyNoteData }) {
  const colors = STICKY_COLORS[sticky.color];
  return (
    <div className="w-[220px] rounded-lg border-2 p-3 shadow-xl" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
      <p className="text-sm leading-relaxed truncate" style={{ color: colors.text }}>
        {sticky.text || 'Empty note'}
      </p>
      <div className="flex items-center gap-1.5 mt-2">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold text-white"
          style={{ backgroundColor: colors.border }}
        >
          {sticky.authorInitials}
        </div>
        <span className="text-[9px]" style={{ color: `${colors.text}80` }}>{sticky.author}</span>
      </div>
    </div>
  );
}

export function RetroWhiteboard() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tool, setTool] = useState<WbTool>('select');
  const [zoom, setZoom] = useState(1);
  const [stickies, setStickies] = useState<StickyNoteData[]>([]);
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [, setTexts] = useState<{ id: string; text: string; x: number; y: number; color: string; fontSize: number }[]>([]);
  const [currentPath, setCurrentPath] = useState<DrawPath | null>(null);
  const [penColor, setPenColor] = useState('var(--primary)');
  const [penWidth] = useState(2);
  const [stickyColor, setStickyColor] = useState<StickyColor>('green');
  const [selectedSticky, setSelectedSticky] = useState<string | null>(null);
  const [editingSticky, setEditingSticky] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeDragSticky, setActiveDragSticky] = useState<StickyNoteData | null>(null);
  const isDrawing = useRef(false);

  void setTexts;

  const penColors = ['var(--primary)', 'var(--success)', 'var(--warning)', 'var(--primary)', '#ec4899', 'var(--primary)', 'var(--foreground)', 'var(--muted-foreground)'];

  const defaultColumnForColor: Record<StickyColor, RetroColumnId> = {
    green: 'www',
    yellow: 'cia',
    orange: 'cia',
    blue: 'action',
    pink: 'www',
    purple: 'action',
  };

  const addSticky = useCallback((toColumn?: RetroColumnId) => {
    const col = toColumn ?? defaultColumnForColor[stickyColor] ?? 'www';
    const newNote: StickyNoteData = {
      id: `ws-${Date.now()}`,
      text: '',
      x: 0,
      y: 0,
      color: stickyColor,
      author: 'You',
      authorInitials: 'YO',
      width: 200,
      height: 140,
      rotation: 0,
      columnId: col,
    };
    setStickies(prev => [...prev, newNote]);
    setEditingSticky(newNote.id);
    setSelectedSticky(newNote.id);
  }, [stickyColor]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const getColumnStickies = useCallback((columnId: RetroColumnId) => {
    return stickies.filter(s => s.columnId === columnId);
  }, [stickies]);

  const findColumnForSticky = useCallback((stickyId: string): RetroColumnId | undefined => {
    return stickies.find(s => s.id === stickyId)?.columnId;
  }, [stickies]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const s = stickies.find(st => st.id === event.active.id);
    if (s) setActiveDragSticky(s);
  }, [stickies]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumnForSticky(activeId);
    const overColumn = COLUMN_CONFIG.some(c => c.id === overId)
      ? overId as RetroColumnId
      : findColumnForSticky(overId);

    if (!activeColumn || !overColumn || activeColumn === overColumn) return;

    setStickies(prev => prev.map(s =>
      s.id === activeId ? { ...s, columnId: overColumn } : s
    ));
  }, [findColumnForSticky]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragSticky(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumnForSticky(activeId);

    if (COLUMN_CONFIG.some(c => c.id === overId)) {
      if (activeColumn !== overId) {
        setStickies(prev => prev.map(s =>
          s.id === activeId ? { ...s, columnId: overId as RetroColumnId } : s
        ));
      }
      return;
    }

    const overColumn = findColumnForSticky(overId);

    if (activeColumn && activeColumn === overColumn) {
      const colStickies = getColumnStickies(activeColumn);
      const oldIdx = colStickies.findIndex(s => s.id === activeId);
      const newIdx = colStickies.findIndex(s => s.id === overId);
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        const reordered = arrayMove(colStickies, oldIdx, newIdx);
        setStickies(prev => {
          const otherStickies = prev.filter(s => s.columnId !== activeColumn);
          return [...otherStickies, ...reordered];
        });
      }
    }
  }, [findColumnForSticky, getColumnStickies]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (tool === 'pen' || tool === 'eraser') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      isDrawing.current = true;
      setCurrentPath({
        id: `p-${Date.now()}`,
        points: [{ x, y }],
        color: tool === 'eraser' ? 'hsl(var(--muted))' : penColor,
        width: tool === 'eraser' ? 20 : penWidth,
      });
    }
  }, [tool, zoom, penColor, penWidth]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDrawing.current && currentPath) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      setCurrentPath(prev => prev ? { ...prev, points: [...prev.points, { x, y }] } : null);
    }
  }, [currentPath, zoom]);

  const handleCanvasMouseUp = useCallback(() => {
    if (isDrawing.current && currentPath) {
      setPaths(prev => [...prev, currentPath]);
      setCurrentPath(null);
      isDrawing.current = false;
    }
  }, [currentPath]);

  const deleteSticky = useCallback((id: string) => {
    setStickies(prev => prev.filter(s => s.id !== id));
    setSelectedSticky(null);
    setEditingSticky(null);
  }, []);

  const updateStickyText = useCallback((id: string, text: string) => {
    setStickies(prev => prev.map(s => s.id === id ? { ...s, text } : s));
  }, []);

  const pathToD = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      d += ` Q ${prev.x} ${prev.y}, ${midX} ${midY}`;
    }
    return d;
  };

  const toolItems: { tool: WbTool; icon: React.ElementType; label: string }[] = [
    { tool: 'select', icon: MousePointer2, label: 'Select' },
    { tool: 'pan', icon: Hand, label: 'Pan' },
    { tool: 'pen', icon: PenTool, label: 'Draw' },
    { tool: 'sticky', icon: StickyNote, label: 'Sticky Note' },
    { tool: 'text', icon: Type, label: 'Text' },
    { tool: 'eraser', icon: Eraser, label: 'Eraser' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-240px)] min-h-[600px] rounded-xl border border-border overflow-hidden bg-muted">

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-1">
          {toolItems.map(item => {
            const ToolIcon = item.icon;
            return (
              <button
                key={item.tool}
                onClick={() => setTool(item.tool)}
                className={`p-2 rounded-lg transition-all duration-150 ${tool === item.tool ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                title={item.label}
              >
                <ToolIcon className="w-4 h-4" />
              </button>
            );
          })}

          <div className="w-px h-6 bg-muted mx-1" />

          {/* Pen Color */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              title="Color"
            >
              <div className="w-4 h-4 rounded-full border-2 border-border" style={{ backgroundColor: penColor }} />
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-card border border-border rounded-lg shadow-xl z-50 flex gap-1.5">
                {penColors.map(c => (
                  <button
                    key={c}
                    onClick={() => { setPenColor(c); setShowColorPicker(false); }}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${penColor === c ? 'border-primary scale-110' : 'border-border hover:border-muted-foreground'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-muted mx-1" />

          {/* Sticky Color Picker */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground mr-1">Note:</span>
            {(Object.keys(STICKY_COLORS) as StickyColor[]).map(c => (
              <button
                key={c}
                onClick={() => setStickyColor(c)}
                className={`w-5 h-5 rounded-md border transition-all ${stickyColor === c ? 'border-foreground scale-110' : 'border-border hover:border-muted-foreground'}`}
                style={{ backgroundColor: STICKY_COLORS[c].bg, borderColor: stickyColor === c ? STICKY_COLORS[c].border : undefined }}
              />
            ))}
          </div>

          <div className="w-px h-6 bg-muted mx-1" />

          <button
            onClick={() => setPaths([])}
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            title="Clear drawings"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-muted-foreground tabular-nums min-w-[36px] text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setZoom(1)} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Add Note Bar */}
      <div className="flex items-center gap-4 px-4 py-1.5 border-b border-border/60 bg-card">
        {COLUMN_CONFIG.map(col => (
          <button
            key={col.id}
            onClick={() => addSticky(col.id)}
            className={`flex items-center gap-1.5 text-[10px] font-medium ${col.colorClass} hover:underline transition-colors`}
          >
            <Plus className="w-3 h-3" /> {col.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => addSticky()}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-all"
        >
          <Plus className="w-3 h-3" /> Add Note
        </button>
      </div>

      {/* Canvas with Columns */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-auto select-none"
        style={{ cursor: tool === 'pan' ? 'grab' : tool === 'pen' ? 'crosshair' : tool === 'eraser' ? 'cell' : 'default' }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onClick={() => { if (tool === 'select') { setSelectedSticky(null); setEditingSticky(null); } }}
      >
        {/* Drawing Paths (SVG overlay) */}
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 5 }}
        >
          <g style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
            {paths.map(path => (
              <path
                key={path.id}
                d={pathToD(path.points)}
                stroke={path.color}
                strokeWidth={path.width}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.8}
              />
            ))}
            {currentPath && (
              <path
                d={pathToD(currentPath.points)}
                stroke={currentPath.color}
                strokeWidth={currentPath.width}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.8}
              />
            )}
          </g>
        </svg>

        {/* Sortable Columns */}
        <div className="relative p-4" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', minWidth: '900px' }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-3 gap-4 min-h-[500px]">
              {COLUMN_CONFIG.map(col => {
                const colStickies = getColumnStickies(col.id);
                return (
                  <SortableContext
                    key={col.id}
                    items={colStickies.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <DroppableColumn
                      id={col.id}
                      label={col.label}
                      colorClass={col.colorClass}
                      dotColor={col.dotColor}
                      borderColor={col.borderColor}
                      stickyCount={colStickies.length}
                    >
                      {colStickies.map(sticky => (
                        <SortableStickyCard
                          key={sticky.id}
                          sticky={sticky}
                          isSelected={selectedSticky === sticky.id}
                          isEditing={editingSticky === sticky.id}
                          onSelect={() => setSelectedSticky(sticky.id)}
                          onEdit={() => { setEditingSticky(sticky.id); setSelectedSticky(sticky.id); }}
                          onDelete={() => deleteSticky(sticky.id)}
                          onTextChange={(text) => updateStickyText(sticky.id, text)}
                          onBlur={() => setEditingSticky(null)}
                        />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                );
              })}
            </div>

            <DragOverlay>
              {activeDragSticky && <StickyDragOverlay sticky={activeDragSticky} />}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-card">
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span>{stickies.length} notes</span>
          <span>{paths.length} drawings</span>
          <span className="flex items-center gap-2">
            {COLUMN_CONFIG.map(col => (
              <span key={col.id} className={`${col.colorClass}`}>
                {getColumnStickies(col.id).length} {col.label.split(' ')[0].toLowerCase()}
              </span>
            ))}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            5 participants
          </span>
        </div>
      </div>
    </div>
  );
}
