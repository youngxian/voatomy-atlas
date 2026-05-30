'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, ArrowRight, Clock } from 'lucide-react';
import { usePlan, type PlanTier } from '@/lib/plan';

import { config } from '@/lib/config';

const LANDING_URL = config.landingUrl;
const API_BASE = config.apiBase;

type TierInfo = Record<Exclude<PlanTier, 'starter'>, { price: string; period: string; benefits: string[]; cta: string }>;

const DEFAULT_TIER_INFO: TierInfo = {
  pro: {
    price: '$14',
    period: '/user/mo',
    benefits: [
      'Unlimited teams & repos',
      'Unlimited AI sprint plans',
      'Jira, Slack, Figma & 15+ integrations',
      'Advanced accuracy analytics',
      'Customer demand signals',
      'Slack & Teams notifications',
    ],
    cta: 'Start 14-day Free Trial',
  },
  business: {
    price: '$28',
    period: '/user/mo',
    benefits: [
      'Everything in Pro',
      'Cross-team dependency mapping',
      'CRM integration (Salesforce, HubSpot)',
      'Revenue-weighted backlog',
      'Multi-team dashboards',
      'Custom workflows & automations',
      'API access',
    ],
    cta: 'Start 14-day Free Trial',
  },
  enterprise: {
    price: 'Custom',
    period: '',
    benefits: [
      'Everything in Business',
      'Full NEXUS platform access',
      'SSO / SAML / SCIM',
      'RBAC & audit logs',
      'Dedicated support & SLA',
      'Custom integrations & webhooks',
      'VPC / on-prem deployment',
    ],
    cta: 'Contact Sales',
  },
};

function usePricingFromAPI(): TierInfo {
  const [tierInfo, setTierInfo] = useState<TierInfo>(DEFAULT_TIER_INFO);

  useEffect(() => {
    fetch(`${API_BASE}/public/pricing`)
      .then((res) => (res.ok ? res.json() : null))
      .then((catalog) => {
        if (!catalog?.tiers) return;
        const updated = { ...DEFAULT_TIER_INFO };
        for (const tier of catalog.tiers) {
          const slug = tier.slug ?? tier.name?.toLowerCase();
          if (slug in updated) {
            const key = slug as keyof TierInfo;
            updated[key] = {
              ...updated[key],
              price: tier.monthly_price <= 0 ? 'Custom' : `$${tier.monthly_price}`,
              period: tier.monthly_price <= 0 ? '' : (tier.period || '/user/mo'),
            };
          }
        }
        setTierInfo(updated);
      })
      .catch((err) => console.error('Failed to redirect to billing', err));
  }, []);

  return tierInfo;
}

const TIER_COLOR: Record<Exclude<PlanTier, 'starter'>, string> = {
  pro: '#22C55E',
  business: '#D4A843',
  enterprise: '#2563EB',
};

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  targetTier?: Exclude<PlanTier, 'starter'>;
  featureLabel?: string;
}

export default function UpgradeModal({ open, onClose, targetTier = 'pro', featureLabel }: UpgradeModalProps) {
  const { isTrialing, trialDaysLeft, postTrialOnStarter } = usePlan();
  const TIER_INFO = usePricingFromAPI();
  const info = TIER_INFO[targetTier];
  const color = TIER_COLOR[targetTier];

  const ctaLabel =
    postTrialOnStarter || isTrialing ? 'Upgrade Now \u2014 Restore Pro access' : info.cta;

  const handleUpgrade = () => {
    if (targetTier === 'enterprise') {
      window.location.href = `${LANDING_URL}/contact?plan=enterprise`;
      return;
    }
    if (postTrialOnStarter) {
      window.location.href = `${LANDING_URL}/pricing/checkout?plan=${targetTier}&source=atlas_post_trial`;
      return;
    }
    if (isTrialing) {
      window.location.href = `${LANDING_URL}/pricing/checkout?plan=${targetTier}`;
      return;
    }
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `${LANDING_URL}/pricing?source=dashboard&return=${returnUrl}`;
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
            <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl shadow-black/10 overflow-hidden">
              {/* Gradient header */}
              <div className="relative px-6 pt-6 pb-4 overflow-hidden">
                <div
                  className="absolute inset-0 opacity-[0.06]"
                  style={{ background: `linear-gradient(135deg, ${color}, transparent)` }}
                />
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1 rounded-lg text-[#7A8B84] hover:text-[#1A2F2A] hover:bg-[#F3F1ED] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="relative">
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white mb-3"
                    style={{ backgroundColor: color }}
                  >
                    <Sparkles className="w-3 h-3" />
                    {targetTier} Plan
                  </div>
                  <h2 className="text-xl font-bold text-[#1A2F2A]">
                    {featureLabel
                      ? `Unlock ${featureLabel}`
                      : `Upgrade to ${targetTier.charAt(0).toUpperCase() + targetTier.slice(1)}`}
                  </h2>
                  <p className="mt-1 text-sm text-[#7A8B84]">
                    {featureLabel
                      ? `This feature requires the ${targetTier.charAt(0).toUpperCase() + targetTier.slice(1)} plan.`
                      : postTrialOnStarter
                        ? `Your trial is over and you're on Starter. Subscribe to bring back unlimited repos, integrations, and AI sprint plans.`
                        : isTrialing
                          ? trialDaysLeft > 0
                            ? `You're on a free trial with full ${targetTier.charAt(0).toUpperCase() + targetTier.slice(1)} access. Upgrade before it ends to keep every integration and unlimited usage.`
                            : 'Your trial has ended or is ending. Subscribe to keep Pro features, unlimited repos, and team notifications.'
                          : 'Get access to everything your team needs.'}
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="px-6 pb-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#1A2F2A]">{info.price}</span>
                  {info.period && <span className="text-sm text-[#7A8B84]">{info.period}</span>}
                </div>
              </div>

              {/* Benefits */}
              <div className="px-6 pb-5">
                <div className="space-y-2">
                  {info.benefits.map((benefit) => (
                    <div key={benefit} className="flex items-start gap-2.5">
                      <div
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${color}18` }}
                      >
                        <Check className="w-2.5 h-2.5" style={{ color }} />
                      </div>
                      <span className="text-sm text-[#3D5249]">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trial urgency / post-trial */}
              {(postTrialOnStarter || (isTrialing && trialDaysLeft <= 7)) && (
                <div className="mx-6 mb-2 flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-3 py-2 border border-amber-200/60 dark:border-amber-800/50">
                  <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-xs font-medium text-amber-900 dark:text-amber-100">
                    {postTrialOnStarter
                      ? 'Your Pro trial has ended — you’re on Starter until you subscribe.'
                      : `Your trial ends in ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''}`}
                  </span>
                </div>
              )}

              {/* CTA */}
              <div className="px-6 pb-6 space-y-2">
                <button
                  onClick={handleUpgrade}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: color }}
                >
                  {ctaLabel}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="w-full text-center text-sm text-[#7A8B84] hover:text-[#3D5249] transition-colors py-1"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
