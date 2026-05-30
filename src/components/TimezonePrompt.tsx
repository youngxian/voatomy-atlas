'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const TZ_PROMPT_DISMISSED_KEY = 'tz-prompt-dismissed';

function getBrowserTimezone(): string {
  if (typeof window === 'undefined') return '';
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return '';
  }
}

export default function TimezonePrompt() {
  const { user, loading, isDemo, updateProfile } = useAuth();
  const [visible, setVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [detected, setDetected] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined' || loading || isDemo || !user) return;

    // Skip entirely if user has no timezone — first-time users get it auto-set in auth.tsx
    const storedTz = user.timezone?.trim();
    if (!storedTz) return;

    const browserTz = getBrowserTimezone();
    if (!browserTz || browserTz === storedTz) return;

    // User hasn't dismissed the prompt for this scenario
    if (localStorage.getItem(TZ_PROMPT_DISMISSED_KEY) === 'true') return;

    setDetected(browserTz);
    setVisible(true);
  }, [user, loading, isDemo]);

  const handleDontUpdate = () => {
    if (dontShowAgain) {
      localStorage.setItem(TZ_PROMPT_DISMISSED_KEY, 'true');
    }
    setVisible(false);
  };

  const handleUpdateTimezone = async () => {
    if (!detected) return;
    setUpdating(true);
    try {
      await updateProfile({ timezone: detected });
      if (dontShowAgain) {
        localStorage.setItem(TZ_PROMPT_DISMISSED_KEY, 'true');
      }
      setVisible(false);
    } finally {
      setUpdating(false);
    }
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed inset-0 z-[101] flex items-center justify-center p-4"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 overflow-hidden">
              <div className="absolute inset-0 opacity-[0.06] bg-gradient-to-br from-primary to-transparent" />
              <div className="relative">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Update timezone to {detected}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Your browser&apos;s timezone differs from your profile. Update it here or change it{' '}
                  <Link
                    href="/profile"
                    className="text-primary hover:underline font-medium"
                    onClick={handleDontUpdate}
                  >
                    in settings
                  </Link>
                  .
                </p>
              </div>
            </div>

            {/* Don't show again checkbox */}
            <div className="px-6 pb-4">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary/30"
                />
                <span className="text-sm text-muted-foreground">
                  Don&apos;t show this message again
                </span>
              </label>
            </div>

            {/* CTAs */}
            <div className="px-6 pb-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleDontUpdate}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-muted-foreground text-sm font-medium hover:bg-muted transition-colors"
              >
                Don&apos;t update
              </button>
              <button
                onClick={handleUpdateTimezone}
                disabled={updating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update timezone'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
}
