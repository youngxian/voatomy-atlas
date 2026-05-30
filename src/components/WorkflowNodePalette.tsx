'use client';

import React, { useState, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Zap,
  Play,
  GitBranch,
  Brain,
  Bell,
  Calendar,
  Database,
  MessageSquare,
  AlertTriangle,
  Clock,
  ListChecks,
  Shield,
  Activity,
  Sparkles,
  Mail,
  Hash,
  Timer,
  Merge,
  Split,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import type { WorkflowNodeType } from '@/hooks/useWorkflowState';

/* ------------------------------------------------------------------ */
/*  Block definition                                                   */
/* ------------------------------------------------------------------ */

export interface PaletteBlock {
  id: string;
  nodeType: WorkflowNodeType;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

interface PaletteCategory {
  name: string;
  icon: React.ElementType;
  blocks: PaletteBlock[];
}

/* ------------------------------------------------------------------ */
/*  Categories                                                         */
/* ------------------------------------------------------------------ */

const PALETTE_CATEGORIES: PaletteCategory[] = [
  {
    name: 'Ticket Lifecycle',
    icon: Activity,
    blocks: [
      { id: 'pal-ticket-created', nodeType: 'trigger', name: 'Ticket Created', description: 'New ticket synced from board', icon: Zap, color: '#f59e0b' },
      { id: 'pal-status-changed', nodeType: 'trigger', name: 'Status Changed', description: 'Ticket status transition', icon: Zap, color: '#f59e0b' },
      { id: 'pal-in-progress', nodeType: 'action', name: 'In Progress', description: 'Ticket actively worked on', icon: Play, color: '#22C55E' },
      { id: 'pal-done', nodeType: 'action', name: 'Done', description: 'Ticket completed', icon: Play, color: '#16a34a' },
      { id: 'pal-blocked', nodeType: 'notification', name: 'Blocked', description: 'Ticket blocked alert', icon: AlertTriangle, color: '#e22d2d' },
    ],
  },
  {
    name: 'Activity Tracking',
    icon: MessageSquare,
    blocks: [
      { id: 'pal-comment-check', nodeType: 'condition', name: 'Comment Check', description: 'Check for recent activity', icon: MessageSquare, color: '#ca8a04' },
      { id: 'pal-stale-detect', nodeType: 'condition', name: 'Stale Detection', description: 'Detect inactive tickets', icon: AlertTriangle, color: '#e22d2d' },
      { id: 'pal-reminder', nodeType: 'action', name: 'Reminder Create', description: 'Create board reminder', icon: ListChecks, color: '#8b5cf6' },
      { id: 'pal-sprint-stale', nodeType: 'condition', name: 'Sprint Staleness', description: 'Check sprint-level activity', icon: BarChart3, color: '#ca8a04' },
    ],
  },
  {
    name: 'Meetings',
    icon: Calendar,
    blocks: [
      { id: 'pal-meeting-created', nodeType: 'meeting', name: 'Meeting Created', description: 'New meeting from calendar', icon: Calendar, color: '#2563EB' },
      { id: 'pal-notes-added', nodeType: 'data', name: 'Notes Added', description: 'Meeting notes recorded', icon: Database, color: '#06b6d4' },
      { id: 'pal-meeting-analysis', nodeType: 'ai', name: 'AI Analysis', description: 'AI processes meeting notes', icon: Brain, color: '#8b5cf6' },
      { id: 'pal-calendar-sync', nodeType: 'trigger', name: 'Calendar Sync', description: 'Sync from Google/Outlook', icon: Clock, color: '#f59e0b' },
    ],
  },
  {
    name: 'AI Intelligence',
    icon: Brain,
    blocks: [
      { id: 'pal-ai-estimate', nodeType: 'ai', name: 'AI Estimate', description: 'Auto-estimate story points', icon: Brain, color: '#8b5cf6' },
      { id: 'pal-ai-classify', nodeType: 'ai', name: 'AI Classify', description: 'Classify tickets by type/risk', icon: Shield, color: '#8b5cf6' },
      { id: 'pal-ai-recommend', nodeType: 'ai', name: 'AI Recommend', description: 'Suggest next actions', icon: Sparkles, color: '#8b5cf6' },
      { id: 'pal-meeting-analyzer', nodeType: 'ai', name: 'Meeting Analyzer', description: 'Extract action items', icon: Brain, color: '#8b5cf6' },
    ],
  },
  {
    name: 'Notifications',
    icon: Bell,
    blocks: [
      { id: 'pal-slack', nodeType: 'notification', name: 'Slack', description: 'Send Slack message', icon: Hash, color: '#e22d2d' },
      { id: 'pal-teams', nodeType: 'notification', name: 'Teams', description: 'Post to Teams channel', icon: Bell, color: '#e22d2d' },
      { id: 'pal-email', nodeType: 'notification', name: 'Email', description: 'Send email notification', icon: Mail, color: '#e22d2d' },
      { id: 'pal-in-app', nodeType: 'notification', name: 'In-App', description: 'In-app notification', icon: Bell, color: '#e22d2d' },
    ],
  },
  {
    name: 'Logic',
    icon: GitBranch,
    blocks: [
      { id: 'pal-condition', nodeType: 'condition', name: 'Condition', description: 'Branch on true/false', icon: GitBranch, color: '#ca8a04' },
      { id: 'pal-delay', nodeType: 'action', name: 'Delay', description: 'Wait for N minutes/hours', icon: Timer, color: '#22C55E' },
      { id: 'pal-merge', nodeType: 'action', name: 'Merge', description: 'Merge multiple inputs', icon: Merge, color: '#22C55E' },
      { id: 'pal-split', nodeType: 'action', name: 'Split', description: 'Split to parallel branches', icon: Split, color: '#22C55E' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Draggable block                                                    */
/* ------------------------------------------------------------------ */

function DraggablePaletteBlock({ block }: { block: PaletteBlock }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.id,
    data: { nodeType: block.nodeType, label: block.name, sublabel: block.description, color: block.color },
  });

  const Icon = block.icon;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-grab active:cursor-grabbing hover:bg-card hover:shadow-sm border border-transparent hover:border-border/60 transition-all group"
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${block.color}12`, border: `1px solid ${block.color}20` }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: block.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-foreground truncate">{block.name}</p>
        <p className="text-[9px] text-secondary-foreground truncate">{block.description}</p>
      </div>
      <GripVertical className="w-3 h-3 text-[#d1d5da] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main palette component                                             */
/* ------------------------------------------------------------------ */

interface WorkflowNodePaletteProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function WorkflowNodePalette({
  collapsed = false,
  onToggleCollapse,
}: WorkflowNodePaletteProps) {
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(PALETTE_CATEGORIES.map(c => c.name))
  );

  const toggleCategory = (name: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return PALETTE_CATEGORIES;
    return PALETTE_CATEGORIES
      .map(cat => ({
        ...cat,
        blocks: cat.blocks.filter(b =>
          b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q)
        ),
      }))
      .filter(cat => cat.blocks.length > 0);
  }, [search]);

  /* ---- Collapsed rail ---- */
  if (collapsed) {
    return (
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 48, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="border-r border-border/60 bg-[#F9F8F6] flex flex-col items-center py-3 gap-2 shrink-0 overflow-hidden"
      >
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md text-secondary-foreground hover:text-primary hover:bg-card transition-colors"
          title="Expand palette"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
        <div className="w-6 h-px bg-[#d1d5da] my-1" />
        {PALETTE_CATEGORIES.map(cat => {
          const CatIcon = cat.icon;
          return (
            <div
              key={cat.name}
              title={cat.name}
              className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-card transition-colors cursor-default"
            >
              <CatIcon className="w-4 h-4" />
            </div>
          );
        })}
      </motion.div>
    );
  }

  /* ---- Expanded panel ---- */
  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 256, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="border-r border-border/60 bg-[#F9F8F6] flex flex-col shrink-0 overflow-hidden"
      style={{ width: 256 }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-2 border-b border-border/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">Nodes</span>
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-md text-secondary-foreground hover:text-primary hover:bg-card transition-colors"
            title="Collapse palette"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary-foreground" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-card border border-border rounded-lg text-foreground placeholder:text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin">
        <AnimatePresence initial={false}>
          {filteredCategories.map(category => {
            const isExpanded = expandedCategories.has(category.name);
            const CatIcon = category.icon;

            return (
              <div key={category.name}>
                <button
                  onClick={() => toggleCategory(category.name)}
                  className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-xs font-semibold text-secondary-foreground hover:bg-muted/60 transition-colors"
                >
                  {isExpanded
                    ? <ChevronDown className="w-3 h-3 text-secondary-foreground" />
                    : <ChevronRight className="w-3 h-3 text-secondary-foreground" />
                  }
                  <CatIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="flex-1 text-left">{category.name}</span>
                  <span className="text-[10px] text-secondary-foreground font-normal tabular-nums">
                    {category.blocks.length}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="ml-2 space-y-0.5 mt-1">
                        {category.blocks.map(block => (
                          <DraggablePaletteBlock key={block.id} block={block} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </AnimatePresence>

        {filteredCategories.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-secondary-foreground">No matching nodes found.</p>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2.5 border-t border-border/40 bg-secondary/50">
        <p className="text-[9px] text-secondary-foreground text-center">
          Drag blocks onto the canvas to build your workflow
        </p>
      </div>
    </motion.div>
  );
}
