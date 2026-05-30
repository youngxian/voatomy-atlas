'use client';

import { useEffect, useCallback } from 'react';
import { X, Command } from 'lucide-react';

interface ShortcutGroup {
  label: string;
  shortcuts: { keys: string[]; description: string }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    label: 'Navigation',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['Esc'], description: 'Close modal / overlay' },
    ],
  },
  {
    label: 'Command Palette',
    shortcuts: [
      { keys: ['↑', '↓'], description: 'Navigate results' },
      { keys: ['↵'], description: 'Open selected result' },
      { keys: ['> ...'], description: 'Quick actions mode' },
      { keys: ['t: ...'], description: 'Search tickets only' },
      { keys: ['p: ...'], description: 'Search pages only' },
      { keys: ['@atlas ...'], description: 'Search ATLAS only' },
    ],
  },
  {
    label: 'Backlog & Tickets',
    shortcuts: [
      { keys: ['Drag'], description: 'Reorder backlog items' },
      { keys: ['Click ☐'], description: 'Select items for bulk actions' },
    ],
  },
  {
    label: 'Dashboard',
    shortcuts: [
      { keys: ['Drag'], description: 'Reorder dashboard sections' },
    ],
  },
];

interface KeyboardShortcutsOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function KeyboardShortcutsOverlay({ open, onOpenChange }: KeyboardShortcutsOverlayProps) {
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, close]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[100]"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.50)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          animation: 'kbdOverlayIn 150ms ease-out forwards',
        }}
        onClick={close}
      />

      <div
        className="fixed inset-0 z-[101] flex items-center justify-center p-4"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
          className="w-full max-w-lg rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden"
          style={{ animation: 'kbdPanelIn 200ms ease-out forwards' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Command className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Keyboard Shortcuts</h2>
            </div>
            <button
              onClick={close}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="px-6 py-5 max-h-[60vh] overflow-y-auto space-y-5">
            {shortcutGroups.map((group, gi) => (
              <div key={group.label}>
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                  {group.label}
                </h3>
                <div className="space-y-1">
                  {group.shortcuts.map((shortcut, si) => (
                    <div
                      key={si}
                      className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-secondary/60 transition-colors"
                      style={{ animation: `kbdRowIn 0.2s ease-out ${(gi * 3 + si) * 0.03}s both` }}
                    >
                      <span className="text-sm text-foreground">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, ki) => (
                          <span key={ki}>
                            {ki > 0 && key !== '...' && <span className="text-[10px] text-muted-foreground mx-0.5">+</span>}
                            <kbd className="inline-flex items-center justify-center min-w-[24px] h-[24px] px-1.5 rounded-md bg-secondary border border-border text-[11px] font-semibold text-foreground shadow-sm">
                              {key}
                            </kbd>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 py-3 border-t border-border bg-secondary/30 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Press <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded bg-secondary border border-border text-[10px] font-semibold text-foreground">?</kbd> anytime to toggle this overlay
            </span>
            <button
              onClick={close}
              className="text-[11px] text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes kbdOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes kbdPanelIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes kbdRowIn {
          from { opacity: 0; transform: translateX(-4px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
