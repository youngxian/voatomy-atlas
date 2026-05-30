'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Database, Check, Loader2, Infinity } from 'lucide-react';

const RETENTION_OPTIONS = [
  { days: 60, label: '60 days' },
  { days: 90, label: '90 days' },
  { days: 120, label: '120 days' },
  { days: 180, label: '180 days' },
  { days: 365, label: '365 days' },
  { days: 0, label: 'Never' },
] as const;

interface DataRetentionModalProps {
  open: boolean;
  onClose: () => void;
  currentDays: number;
  staleCount: number;
  onSave: (days: number) => Promise<void>;
}

export default function DataRetentionModal({ open, onClose, currentDays, staleCount, onSave }: DataRetentionModalProps) {
  const [selected, setSelected] = useState(currentDays);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selected);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-md rounded-2xl bg-card shadow-2xl shadow-black/10 overflow-hidden">
              {/* Header */}
              <div className="relative px-6 pt-6 pb-4 overflow-hidden">
                <div className="absolute inset-0 opacity-[0.06] bg-gradient-to-br from-primary to-transparent" />
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="relative">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white mb-3 bg-primary">
                    <Database className="w-3 h-3" />
                    Data Retention
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Configure Data Retention</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose how long to keep stale data before it is automatically deleted.
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="px-6 pb-4">
                <div className="grid grid-cols-3 gap-2">
                  {RETENTION_OPTIONS.map((opt) => {
                    const isSelected = selected === opt.days;
                    return (
                      <button
                        key={opt.days}
                        onClick={() => setSelected(opt.days)}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border bg-card text-foreground hover:border-primary/40'
                        }`}
                      >
                        {opt.days === 0 && <Infinity className="w-3.5 h-3.5" />}
                        {opt.label}
                        {isSelected && opt.days !== 0 && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Impact preview */}
              <div className="mx-6 mb-4 rounded-lg px-3 py-2.5">
                {selected === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg bg-success/5 px-3 py-2">
                    <Infinity className="h-3.5 w-3.5 text-success shrink-0" />
                    <span className="text-xs font-medium text-success">
                      Data will be retained indefinitely. No automatic cleanup will occur.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg bg-warning/5 px-3 py-2">
                    <Database className="h-3.5 w-3.5 text-warning shrink-0" />
                    <span className="text-xs font-medium text-warning">
                      {staleCount > 0
                        ? `${staleCount} item${staleCount !== 1 ? 's' : ''} that haven't been updated in this period will be permanently deleted.`
                        : `Items not updated within ${selected} days will be permanently deleted.`}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 space-y-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] bg-primary disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save Retention Settings'
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
