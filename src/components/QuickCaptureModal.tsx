'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  Lightbulb,
  FileText,
  Ticket,
  X,
  Send,
  Tag,
  ChevronDown,
} from 'lucide-react';
import { useProject } from '@/lib/project-context';
import { createTicket } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CaptureType = 'idea' | 'note' | 'ticket';

const CAPTURE_TYPES: { value: CaptureType; label: string; icon: typeof Lightbulb; description: string }[] = [
  { value: 'idea', label: 'Idea', icon: Lightbulb, description: 'Quick idea or feature thought' },
  { value: 'note', label: 'Note', icon: FileText, description: 'Freeform note or reminder' },
  { value: 'ticket', label: 'Ticket', icon: Ticket, description: 'Create a backlog ticket' },
];

const LOCAL_STORAGE_KEY = 'atlas_quick_captures';

interface QuickCapture {
  id: string;
  type: CaptureType;
  title: string;
  body?: string;
  labels?: string[];
  createdAt: string;
  pushed?: boolean;
}

function loadCaptures(): QuickCapture[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCaptures(captures: QuickCapture[]) {
  try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(captures)); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface QuickCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuickCaptureModal({ open, onOpenChange }: QuickCaptureModalProps) {
  const { activeProject } = useProject();
  const [captureType, setCaptureType] = useState<CaptureType>('idea');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [label, setLabel] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle('');
      setBody('');
      setLabels([]);
      setLabel('');
      setSuccess(false);
      setCaptureType('idea');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'n') {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (open && e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  const addLabel = useCallback(() => {
    const trimmed = label.trim();
    if (trimmed && !labels.includes(trimmed)) {
      setLabels(prev => [...prev, trimmed]);
    }
    setLabel('');
  }, [label, labels]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);

    const capture: QuickCapture = {
      id: crypto.randomUUID(),
      type: captureType,
      title: title.trim(),
      body: body.trim() || undefined,
      labels: labels.length > 0 ? labels : undefined,
      createdAt: new Date().toISOString(),
    };

    if (captureType === 'ticket' && activeProject?.id) {
      try {
        await createTicket(activeProject.id, {
          title: capture.title,
          description: capture.body,
          status: 'backlog',
          priority: 'medium',
          labels: capture.labels,
        });
        capture.pushed = true;
      } catch {
        capture.pushed = false;
      }
    }

    const captures = loadCaptures();
    captures.unshift(capture);
    saveCaptures(captures.slice(0, 100));

    setSubmitting(false);
    setSuccess(true);
    setTimeout(() => onOpenChange(false), 800);
  };

  const currentType = CAPTURE_TYPES.find(t => t.value === captureType) ?? CAPTURE_TYPES[0];
  const TypeIcon = currentType.icon;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            className="fixed z-50 left-1/2 top-[20%] w-full max-w-lg -translate-x-1/2"
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          >
            <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <button
                      onClick={() => setShowTypeSelector(!showTypeSelector)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/50 bg-secondary/50 hover:bg-secondary transition-colors text-sm font-medium"
                    >
                      <TypeIcon className="w-4 h-4 text-primary" />
                      <span className="text-foreground">{currentType.label}</span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </button>

                    <AnimatePresence>
                      {showTypeSelector && (
                        <motion.div
                          className="absolute top-full left-0 mt-1 w-56 bg-card border border-border rounded-xl shadow-lg z-10 py-1"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.12 }}
                        >
                          {CAPTURE_TYPES.map(t => {
                            const Icon = t.icon;
                            return (
                              <button
                                key={t.value}
                                onClick={() => { setCaptureType(t.value); setShowTypeSelector(false); }}
                                className={clsx(
                                  'flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-secondary transition-colors',
                                  captureType === t.value && 'bg-primary/5',
                                )}
                              >
                                <Icon className={clsx('w-4 h-4', captureType === t.value ? 'text-primary' : 'text-muted-foreground')} />
                                <div>
                                  <p className="text-sm font-medium text-foreground">{t.label}</p>
                                  <p className="text-[10px] text-muted-foreground">{t.description}</p>
                                </div>
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <span className="text-[10px] text-muted-foreground/50 font-mono">⌘⇧N</span>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-4 space-y-3">
                {success ? (
                  <motion.div
                    className="text-center py-6"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                      <Send className="w-5 h-5 text-success" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Captured!</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {captureType === 'ticket' ? 'Added to your backlog' : 'Saved locally'}
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder={captureType === 'ticket' ? 'Ticket title...' : captureType === 'idea' ? 'What\'s on your mind?' : 'Note title...'}
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && title.trim()) handleSubmit(); }}
                      className="w-full text-base font-medium bg-transparent border-none outline-none placeholder:text-muted-foreground/40 text-foreground"
                    />

                    <textarea
                      placeholder="Add details (optional)"
                      value={body}
                      onChange={e => setBody(e.target.value)}
                      rows={3}
                      className="w-full text-sm bg-secondary/50 border border-border/30 rounded-xl px-3 py-2.5 resize-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/20 placeholder:text-muted-foreground/40 text-foreground transition-all"
                    />

                    {/* Labels */}
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap mb-2">
                        {labels.map(l => (
                          <span
                            key={l}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/8 text-primary border border-primary/15"
                          >
                            {l}
                            <button onClick={() => setLabels(prev => prev.filter(x => x !== l))} className="hover:text-destructive">
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-muted-foreground/40" />
                        <input
                          type="text"
                          placeholder="Add label..."
                          value={label}
                          onChange={e => setLabel(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLabel(); } }}
                          className="flex-1 text-xs bg-transparent border-none outline-none placeholder:text-muted-foreground/30 text-foreground"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              {!success && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-border/60 bg-secondary/30">
                  <p className="text-[10px] text-muted-foreground/50">
                    {captureType === 'ticket' && activeProject ? `→ ${activeProject.name} backlog` : 'Saved locally'}
                  </p>
                  <button
                    onClick={handleSubmit}
                    disabled={!title.trim() || submitting}
                    className={clsx(
                      'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                      title.trim() && !submitting
                        ? 'bg-primary text-white hover:bg-primary/90 shadow-sm'
                        : 'bg-muted text-muted-foreground cursor-not-allowed',
                    )}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submitting ? 'Saving...' : 'Capture'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
