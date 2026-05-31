'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import TopNavBar from './TopNavBar';
import SideNav from './SideNav';
import CommandPalette from './CommandPalette';
import KeyboardShortcutsOverlay from './KeyboardShortcutsOverlay';
import QuickCaptureModal from './QuickCaptureModal';
import TrialBanner from './TrialBanner';
import TrialEndedBanner from './TrialEndedBanner';
import FreeTierBanner from './FreeTierBanner';
import UpgradeModal from './UpgradeModal';
import TrialExpiredModal from './TrialExpiredModal';
import DataRetentionBanner from './DataRetentionBanner';
import DataRetentionModal from './DataRetentionModal';
import { pageVariants, easeOut } from '@/lib/motion';
import { Loader2 } from 'lucide-react';
import PageGate from './PageGate';
import ProductActivationGate from './ProductActivationGate';
import { usePlan } from '@/lib/plan';
import { useAuth } from '@/lib/auth';
import { config } from '@/lib/config';
import { redirectToLogin } from '@/lib/auth-redirect';
import { redirectToOnboarding, isOnboardingComplete } from '@/lib/onboarding-gate';
import {
  getDataRetention,
  updateDataRetention,
  dismissRetentionPrompt,
  type DataRetentionSettings,
} from '@/lib/data-retention';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, error: authError, isDemo, demoSecondsLeft, logout } = useAuth();
  useRealtimeSync();
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement)?.isContentEditable) return;
        e.preventDefault();
        setShortcutsOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (isDemo || authLoading || !user) return;
    if (!isOnboardingComplete(user)) {
      redirectToOnboarding();
    }
  }, [isDemo, authLoading, user]);

  useEffect(() => {
    if (isDemo) return;
    if (!authLoading && !user && authError?.kind === 'unauthorized') {
      document.cookie = 'session=; path=/; max-age=0';
      redirectToLogin();
    }
  }, [authLoading, user, authError, isDemo]);

  useEffect(() => {
    const onReopenSetup = () => {
      window.dispatchEvent(new CustomEvent('atlas-reopen-activation'));
    };
    window.addEventListener('atlas-open-welcome-setup', onReopenSetup);
    return () => window.removeEventListener('atlas-open-welcome-setup', onReopenSetup);
  }, []);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showRetentionModal, setShowRetentionModal] = useState(false);
  const [retentionSettings, setRetentionSettings] = useState<DataRetentionSettings | null>(null);
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const { postTrialOnStarter, tier, refresh: refreshPlan } = usePlan();

  const [trialExitModalDismissed, setTrialExitModalDismissed] = useState(false);
  const [orgId, setOrgId] = useState('');

  useEffect(() => {
    setOrgId(localStorage.getItem('voatomy_org_id') ?? '');
  }, []);

  useEffect(() => {
    try {
      setTrialExitModalDismissed(sessionStorage.getItem('voatomy_trial_expired_dismissed') === 'true');
    } catch {
      setTrialExitModalDismissed(false);
    }
  }, [postTrialOnStarter]);

  const showTrialExpiredModal = postTrialOnStarter && !trialExitModalDismissed;

  const fetchRetention = useCallback(async () => {
    if (!orgId) return;
    try {
      const settings = await getDataRetention(orgId);
      setRetentionSettings(settings);
    } catch {
      // silently ignore — banner won't show
    }
  }, [orgId]);

  useEffect(() => {
    fetchRetention();
  }, [fetchRetention]);

  const handleRetentionSave = async (days: number) => {
    if (!orgId) return;
    const updated = await updateDataRetention(orgId, days);
    setRetentionSettings(updated);
  };

  const handleRetentionDismiss = async () => {
    if (!orgId) return;
    try {
      await dismissRetentionPrompt(orgId);
      setRetentionSettings((prev) => (prev ? { ...prev, needs_prompt: false } : prev));
    } catch {
      // silently ignore
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && authError?.kind === 'transient') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">Something went wrong loading your session.</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-foreground/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-center px-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {authError?.kind === 'unauthorized'
              ? 'Redirecting to sign in…'
              : 'Loading your workspace…'}
          </p>
        </div>
      </div>
    );
  }

  if (!isOnboardingComplete(user)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-center px-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Redirecting to setup…</p>
        </div>
      </div>
    );
  }

  return (
    <ProductActivationGate product="atlas">
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <a href="#main-content" className="skip-to-content">Skip to content</a>
      {/* App content — blurred when setup modal is open */}
      <div className="flex flex-col h-full w-full">
        <TrialBanner onUpgrade={() => setShowUpgrade(true)} />
        <TrialEndedBanner
          remindAfterModal={trialExitModalDismissed}
          onSubscribe={() => setShowUpgrade(true)}
        />
        <FreeTierBanner />
        <DataRetentionBanner
          needsPrompt={retentionSettings?.needs_prompt ?? false}
          onConfigure={() => setShowRetentionModal(true)}
          onDismiss={handleRetentionDismiss}
        />
        {isDemo && demoSecondsLeft !== null && (
          <div
            className={`flex items-center justify-center gap-3 px-4 py-2 text-xs font-medium transition-colors duration-500 ${
              demoSecondsLeft <= 30
                ? 'bg-destructive/10 text-destructive border-b border-destructive/20'
                : 'bg-primary/5 text-primary border-b border-primary/10'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${demoSecondsLeft <= 30 ? 'bg-destructive animate-pulse' : 'bg-primary'}`} />
              Demo mode
            </span>
            <span className="text-muted-foreground">·</span>
            <span>
              {demoSecondsLeft > 60
                ? `${Math.ceil(demoSecondsLeft / 60)}m left`
                : `${demoSecondsLeft}s left`}
            </span>
            <span className="text-muted-foreground">·</span>
            <a
              href={`${config.landingUrl}/auth/signup`}
              className={`font-semibold underline underline-offset-2 transition-colors ${
                demoSecondsLeft <= 30 ? 'text-destructive hover:text-destructive/80' : 'text-primary hover:text-primary/80'
              }`}
            >
              Sign up to keep your data
            </a>
            <button
              onClick={logout}
              className="ml-2 px-2 py-0.5 rounded text-[10px] font-medium bg-secondary border border-border hover:bg-secondary/80 text-muted-foreground transition-colors"
            >
              Exit Demo
            </button>
          </div>
        )}
        <TopNavBar onSearchOpen={() => setSearchOpen(true)} />
        <div className="flex flex-1 min-h-0 bg-dashboard-surface-muted">
          <SideNav />
          <AnimatePresence mode="wait" initial={false}>
            <motion.main
              id="main-content"
              key={pathname}
              className="flex-1 overflow-y-auto bg-dashboard-surface-muted"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={reduceMotion ? { duration: 0.12 } : { duration: 0.25, ease: easeOut }}
            >
              {pathname.startsWith('/chat') ||
               pathname.match(/^\/workflow\//) ||
               pathname === '/automations' ? (
                <PageGate>{children}</PageGate>
              ) : (
                <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-5 sm:py-7 lg:py-9">
                  <PageGate>{children}</PageGate>
                </div>
              )}
            </motion.main>
          </AnimatePresence>
        </div>
      </div>

      {/* Modals — rendered outside the blur wrapper */}
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        targetTier={tier === 'starter' ? 'pro' : (tier as Exclude<typeof tier, 'starter'>)}
      />

      <DataRetentionModal
        open={showRetentionModal}
        onClose={() => setShowRetentionModal(false)}
        currentDays={retentionSettings?.retention_days ?? 180}
        staleCount={retentionSettings?.stale_count ?? 0}
        onSave={handleRetentionSave}
      />

      {showTrialExpiredModal && (
        <TrialExpiredModal
          onUpgrade={() => {
            try {
              sessionStorage.setItem('voatomy_trial_expired_dismissed', 'true');
            } catch {
              /* ignore */
            }
            setTrialExitModalDismissed(true);
            setShowUpgrade(true);
          }}
          onDismiss={() => {
            try {
              sessionStorage.setItem('voatomy_trial_expired_dismissed', 'true');
            } catch {
              /* ignore */
            }
            setTrialExitModalDismissed(true);
            void refreshPlan();
          }}
        />
      )}

      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} onShortcutsOpen={() => setShortcutsOpen(true)} />
      <KeyboardShortcutsOverlay open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <QuickCaptureModal open={quickCaptureOpen} onOpenChange={setQuickCaptureOpen} />
    </div>
    </ProductActivationGate>
  );
}
