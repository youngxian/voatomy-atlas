'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Copy,
  Trash2,
  Unlink,
  Maximize2,
  Grid3X3,
  Settings,
  Tag,
  ArrowLeftRight,
  Clipboard,
  MousePointer2,
  Zap,
  Play,
  GitBranch,
  Brain,
  Bell,
  Calendar,
  Database,
  FileText,
} from 'lucide-react';
import type { WorkflowNodeType } from '@/hooks/useWorkflowState';

export type ContextTarget =
  | { type: 'canvas'; position: { x: number; y: number } }
  | { type: 'node'; id: string; position: { x: number; y: number } }
  | { type: 'edge'; id: string; position: { x: number; y: number } };

interface WorkflowContextMenuProps {
  target: ContextTarget | null;
  onClose: () => void;
  onAddNode: (type: WorkflowNodeType, screenPosition: { x: number; y: number }) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDisconnectNode: (id: string) => void;
  onEditConfig: (id: string) => void;
  onSelectAll: () => void;
  onFitView: () => void;
  onToggleGrid: () => void;
  onReverseEdge: (id: string) => void;
  onAddEdgeLabel: (id: string) => void;
  onRemoveEdge: (id: string) => void;
}

const NODE_TYPE_OPTIONS: { type: WorkflowNodeType; label: string; icon: React.ElementType; color: string }[] = [
  { type: 'trigger', label: 'Trigger', icon: Zap, color: '#f59e0b' },
  { type: 'action', label: 'Action', icon: Play, color: '#22C55E' },
  { type: 'condition', label: 'Condition', icon: GitBranch, color: '#ca8a04' },
  { type: 'ai', label: 'AI', icon: Brain, color: '#8b5cf6' },
  { type: 'notification', label: 'Notification', icon: Bell, color: '#e22d2d' },
  { type: 'meeting', label: 'Meeting', icon: Calendar, color: '#2563EB' },
  { type: 'data', label: 'Data', icon: Database, color: '#06b6d4' },
];

interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
  shortcut?: string;
  color?: string;
}

function MenuItem({ icon: Icon, label, onClick, danger, shortcut, color }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-left rounded-md transition-colors ${
        danger
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-secondary-foreground hover:bg-secondary'
      }`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" style={color ? { color } : undefined} />
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-[9px] text-secondary-foreground font-mono">{shortcut}</span>}
    </button>
  );
}

function Divider() {
  return <div className="h-px bg-border/60 my-1 mx-2" />;
}

export default function WorkflowContextMenu({
  target,
  onClose,
  onAddNode,
  onDuplicate,
  onDelete,
  onDisconnectNode,
  onEditConfig,
  onSelectAll,
  onFitView,
  onToggleGrid,
  onReverseEdge,
  onAddEdgeLabel,
  onRemoveEdge,
}: WorkflowContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showNodeSubmenu, setShowNodeSubmenu] = React.useState(false);

  useEffect(() => {
    if (!target) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [target, onClose]);

  if (!target) return null;

  const pos = target.position;
  const menuX = Math.min(pos.x, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 220);
  const menuY = Math.min(pos.y, (typeof window !== 'undefined' ? window.innerHeight : 800) - 300);

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        className="fixed z-[60] min-w-[180px] bg-card rounded-xl border border-border/60 shadow-xl py-1.5 overflow-hidden"
        style={{ left: menuX, top: menuY }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.12 }}
      >
        {target.type === 'canvas' && (
          <>
            <div className="relative">
              <button
                onClick={() => setShowNodeSubmenu(!showNodeSubmenu)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-secondary-foreground hover:bg-secondary rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="flex-1 text-left">Add Node</span>
                <span className="text-[9px] text-secondary-foreground">▸</span>
              </button>
              {showNodeSubmenu && (
                <div className="absolute left-full top-0 ml-1 min-w-[160px] bg-card rounded-xl border border-border/60 shadow-xl py-1.5">
                  {NODE_TYPE_OPTIONS.map((opt) => {
                    const OptIcon = opt.icon;
                    return (
                      <button
                        key={opt.type}
                        onClick={() => { onAddNode(opt.type, pos); onClose(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-secondary-foreground hover:bg-secondary rounded-md transition-colors"
                      >
                        <OptIcon className="w-3.5 h-3.5" style={{ color: opt.color }} />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <MenuItem icon={Clipboard} label="Paste" onClick={onClose} shortcut="⌘V" />
            <Divider />
            <MenuItem icon={MousePointer2} label="Select All" onClick={() => { onSelectAll(); onClose(); }} shortcut="⌘A" />
            <MenuItem icon={Maximize2} label="Fit View" onClick={() => { onFitView(); onClose(); }} shortcut="⌘0" />
            <MenuItem icon={Grid3X3} label="Toggle Grid" onClick={() => { onToggleGrid(); onClose(); }} />
          </>
        )}

        {target.type === 'node' && target.id && (
          <>
            <MenuItem icon={Settings} label="Edit Configuration" onClick={() => { onEditConfig(target.id!); onClose(); }} />
            <MenuItem icon={Copy} label="Duplicate" onClick={() => { onDuplicate(); onClose(); }} shortcut="⌘D" />
            <Divider />
            <MenuItem icon={Unlink} label="Disconnect All" onClick={() => { onDisconnectNode(target.id!); onClose(); }} />
            <MenuItem icon={FileText} label="View Tickets at Stage" onClick={onClose} />
            <Divider />
            <MenuItem icon={Trash2} label="Delete" onClick={() => { onDelete(); onClose(); }} danger shortcut="⌫" />
          </>
        )}

        {target.type === 'edge' && target.id && (
          <>
            <MenuItem icon={Tag} label="Add Label" onClick={() => { onAddEdgeLabel(target.id!); onClose(); }} />
            <MenuItem icon={ArrowLeftRight} label="Reverse Direction" onClick={() => { onReverseEdge(target.id!); onClose(); }} />
            <Divider />
            <MenuItem icon={Trash2} label="Delete" onClick={() => { onRemoveEdge(target.id!); onClose(); }} danger shortcut="⌫" />
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
