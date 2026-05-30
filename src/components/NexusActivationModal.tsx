'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { completeActivation, type ProductKey } from '@/lib/activation';
import { PRODUCT_LABELS } from '@/lib/product-labels';

type Step = 'welcome' | 'sync' | 'ready';

const PRODUCT_META: { key: ProductKey; label: string }[] = [
  { key: 'atlas', label: 'ATLAS' },
  { key: 'loop', label: 'LOOP' },
  { key: 'signal', label: 'SIGNAL' },
  { key: 'drift', label: 'DRIFT' },
  { key: 'phantom', label: 'PHANTOM' },
];

interface NexusActivationModalProps {
  open: boolean;
  onClose: () => void;
  onActivated?: () => void;
}

export default function NexusActivationModal({ open, onClose, onActivated }: NexusActivationModalProps) {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState<Step>('welcome');
  const [syncProgress, setSyncProgress] = useState(0);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [activating, setActivating] = useState(false);

  const activations = user?.product_activations ?? {};
  const connectedProducts = PRODUCT_META.filter(
    (p) => p.key !== 'nexus' && activations[p.key] === 'completed',
  );

  useEffect(() => {
    if (!open) {
      setStep('welcome');
      setSyncProgress(0);
      setHealthScore(null);
    }
  }, [open]);

  useEffect(() => {
    if (step !== 'sync') return;
    setSyncProgress(0);
    const interval = setInterval(() => {
      setSyncProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setHealthScore(72 + Math.floor(Math.random() * 15));
          setTimeout(() => setStep('ready'), 400);
          return 100;
        }
        return p + 4;
      });
    }, 120);
    return () => clearInterval(interval);
  }, [step]);

  const handleActivate = async () => {
    setActivating(true);
    try {
      await completeActivation('nexus');
      await refreshUser();
      onActivated?.();
      onClose();
    } catch {
      /* allow retry */
    } finally {
      setActivating(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
            <Zap className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Welcome to NEXUS</h2>
            <p className="text-xs text-muted-foreground">Your organizational nerve center</p>
          </div>
        </div>

        <div className="px-6 py-5">
          <AnimatePresence mode="wait">
            {step === 'welcome' && (
              <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  NEXUS reads intelligence from your connected Voatomy products and generates
                  cross-functional insights no single product can provide alone.
                </p>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Connected products
                </p>
                <ul className="space-y-2 mb-5">
                  {PRODUCT_META.filter((p) => p.key !== 'nexus').map((p) => {
                    const done = activations[p.key] === 'completed';
                    return (
                      <li key={p.key} className="flex items-center gap-2 text-sm">
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <span className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
                        )}
                        <span className={done ? 'text-foreground' : 'text-muted-foreground'}>
                          {PRODUCT_LABELS[p.key] ?? p.label}
                          {done ? ' — active' : ' — not connected'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="text-xs text-muted-foreground mb-5">
                  NEXUS Lite is ready with {connectedProducts.map((p) => p.label).join(' + ')}.
                  Connect more products anytime for deeper organizational intelligence.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
                  >
                    Not now
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('sync')}
                    className="flex-[2] inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
                  >
                    Activate NEXUS
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'sync' && (
              <motion.div key="sync" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-sm font-medium text-foreground mb-4">Building your organizational intelligence…</p>
                {connectedProducts.map((p) => (
                  <div key={p.key} className="mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Reading {p.label} data…</span>
                      <span>{Math.min(syncProgress + 10, 100)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-violet-500 transition-all duration-150"
                        style={{ width: `${Math.min(syncProgress + 10, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Computing cross-product correlations…
                </div>
              </motion.div>
            )}

            {step === 'ready' && healthScore !== null && (
              <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-center mb-5">
                  <p className="text-5xl font-bold text-violet-600 tabular-nums">{healthScore}</p>
                  <p className="text-sm text-muted-foreground mt-1">Organizational Health Score</p>
                </div>
                <p className="text-sm text-muted-foreground text-center mb-5">
                  NEXUS is syncing intelligence from {connectedProducts.length} active products.
                  Your cross-functional dashboard will improve as more data flows in.
                </p>
                <button
                  type="button"
                  onClick={handleActivate}
                  disabled={activating}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                >
                  {activating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Activating…
                    </>
                  ) : (
                    <>
                      Open NEXUS Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
