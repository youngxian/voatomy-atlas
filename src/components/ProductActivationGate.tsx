'use client';

import { useEffect, useState } from 'react';
import WelcomeSetupModal from './WelcomeSetupModal';
import { useAuth } from '@/lib/auth';
import {
  completeActivation,
  isActivationDone,
  migrateLegacySetupComplete,
  skipActivation,
  type ProductKey,
} from '@/lib/activation';

interface ProductActivationGateProps {
  product: ProductKey;
  children: React.ReactNode;
}

/**
 * Tier 2 product activation gate — runs after org onboarding is complete.
 * Replaces the localStorage `voatomy_setup_complete` check for Atlas.
 */
export default function ProductActivationGate({ product, children }: ProductActivationGateProps) {
  const { user, isDemo, loading: authLoading, refreshUser } = useAuth();
  const [showSetup, setShowSetup] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isDemo || authLoading) return;
    if (!user?.onboarding_completed) {
      setShowSetup(false);
      setChecked(true);
      return;
    }

    let cancelled = false;

    (async () => {
      await migrateLegacySetupComplete(product);
      if (cancelled) return;
      await refreshUser();
      if (cancelled) return;

      const status = user.product_activations?.[product];
      if (!isActivationDone(status)) {
        setShowSetup(true);
      }
      setChecked(true);
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, authLoading, user?.onboarding_completed, product]);

  useEffect(() => {
    if (!user?.product_activations) return;
    const status = user.product_activations[product];
    if (isActivationDone(status)) {
      setShowSetup(false);
    }
  }, [user?.product_activations, product]);

  useEffect(() => {
    const onReopen = () => setShowSetup(true);
    window.addEventListener('atlas-reopen-activation', onReopen);
    return () => window.removeEventListener('atlas-reopen-activation', onReopen);
  }, []);

  const handleComplete = async () => {
    try {
      await completeActivation(product);
    } catch {
      /* non-blocking */
    }
    setShowSetup(false);
    void refreshUser();
  };

  const handleSkip = async () => {
    try {
      await skipActivation(product);
    } catch {
      /* non-blocking */
    }
    setShowSetup(false);
    void refreshUser();
  };

  if (!checked || isDemo) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        className={`transition-all duration-500 ease-out ${
          showSetup && product === 'atlas'
            ? 'blur-md brightness-[0.97] saturate-50 pointer-events-none select-none scale-[0.995]'
            : ''
        }`}
      >
        {children}
      </div>
      {product === 'atlas' && showSetup && (
        <WelcomeSetupModal onComplete={handleComplete} onSkip={handleSkip} />
      )}
    </>
  );
}
