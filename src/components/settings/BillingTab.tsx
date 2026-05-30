'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Trash2,
  CreditCard,
  FileText,
  XCircle,
  Check,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { SectionHeader } from './SettingsFormControls';
import { deleteAccount } from '@/lib/api';

function DangerZone() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(5);

  const canDelete = confirmText.toLowerCase() === 'delete my account';

  const purgeSessionAndRedirect = useCallback(() => {
    document.cookie = 'session=; max-age=0; path=/';
    const keysToRemove = [
      'voatomy_plan',
      'voatomy_setup_complete',
      'voatomy_org_id',
      'atlas_sidebar_collapsed',
      'atlas_trial_guided_complete_v1',
      'atlas_post_trial_banner_dismissed_v1',
      'voatomy_had_active_trial',
    ];
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    sessionStorage.clear();
    window.location.href = `${process.env.NEXT_PUBLIC_LANDING_URL ?? 'http://localhost:3001'}/auth/login`;
  }, []);

  useEffect(() => {
    if (!deleted) return;
    if (countdown <= 0) {
      purgeSessionAndRedirect();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [deleted, countdown, purgeSessionAndRedirect]);

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await deleteAccount();
      setDeleted(true);
    } catch {
      setError('Deletion failed. Please try again or contact support.');
      setDeleting(false);
    }
  };

  if (deleted) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#06060a]/95 backdrop-blur-md">
        <div className="max-w-md w-full mx-4 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <Check className="w-8 h-8 text-destructive" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#e8e8ed]">Account Deleted</h2>
            <p className="text-sm text-muted-foreground">
              Your account and all associated data have been permanently removed.
              We&apos;re sorry to see you go.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-full bg-[#1a1a2e] rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-destructive rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${((5 - countdown) / 5) * 100}%` }}
              />
            </div>
            <p className="text-xs text-[#5a6a62]">
              Redirecting to login in {countdown}s…
            </p>
          </div>

          <button
            onClick={purgeSessionAndRedirect}
            className="text-xs text-muted-foreground hover:text-[#e8e8ed] underline underline-offset-2 transition-colors"
          >
            Redirect now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-destructive/20 bg-destructive/[0.02] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        <h3 className="text-sm font-bold text-destructive">Danger Zone</h3>
      </div>
      <p className="text-[11px] text-muted-foreground">
        These actions are irreversible. Deleting your account removes all data, sprints,
        accuracy history, AI data, integration connections, and preferences permanently.
      </p>

      <div className="flex flex-wrap gap-3">
        <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
          <Trash2 className="w-3.5 h-3.5" /> Delete Account
        </Button>
        <Button variant="secondary" size="sm"><XCircle className="w-3.5 h-3.5" /> Cancel Plan</Button>
        <Button variant="ghost" size="sm"><FileText className="w-3.5 h-3.5" /> Request Data Export (GDPR)</Button>
      </div>

      {confirmOpen && (
        <div className="mt-3 rounded-xl bg-destructive/5 border border-destructive/20 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-destructive">
                This will permanently delete your account
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                All your data, preferences, integrations, and access will be removed.
                If you are the last member of your organization, the entire workspace
                and all its data will be deleted too. This cannot be undone.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">
              Type <span className="font-semibold text-destructive">delete my account</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="delete my account"
              className="w-full max-w-sm px-3 py-2 rounded-lg bg-[#0a0a0f] border border-[#2a2a3a] text-sm text-[#e8e8ed] placeholder-[#3a3a4a] focus:outline-none focus:border-destructive/50 transition-colors"
              disabled={deleting}
            />
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={!canDelete || deleting}
              loading={deleting}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? 'Deleting…' : 'Permanently Delete'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setConfirmOpen(false); setConfirmText(''); setError(''); }}
              disabled={deleting}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function BillingTab() {
  return (
    <div className="space-y-5">
      <Card className="bento-card rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader icon={CreditCard} title="Current Plan" badge="Pro" />
          <Button size="sm" variant="primary">Upgrade</Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Price', value: '$14/user/mo' },
            { label: 'Team', value: '6 members' },
            { label: 'Monthly', value: '$84/mo' },
            { label: 'Next billing', value: 'Mar 1, 2026' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className="text-sm font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-card border border-border/60 p-4 mt-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">What&apos;s included</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-secondary-foreground">
            {['Unlimited sprints & signal sources', 'Revenue & customer signal integrations', 'NEXUS cross-product feed', 'AI ticket follow-ups & stakeholder notifications', 'Dependency chain analysis', 'Sprint board with move-to-sprint prompts', 'Priority support', 'Up to 10 seats · 50K API calls · 10 GB storage'].map(item => (
              <li key={item} className="flex items-center gap-2"><Check className="w-3 h-3 text-success shrink-0" />{item}</li>
            ))}
          </ul>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="primary"><CreditCard className="w-4 h-4" /> Manage subscription</Button>
        <Button variant="secondary"><FileText className="w-4 h-4" /> View invoices</Button>
      </div>

      <Card className="bento-card rounded-2xl">
        <SectionHeader icon={Download} title="Data & Export" />
        <div className="space-y-3 mt-3">
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-card border border-border/60">
            <div><p className="text-xs font-medium text-foreground">Export all sprint data</p><p className="text-[10px] text-muted-foreground">Sprints, accuracy, velocity, and team data as CSV/JSON</p></div>
            <Button size="sm" variant="secondary"><Download className="w-3 h-3" /> Export</Button>
          </div>
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-card border border-border/60">
            <div><p className="text-xs font-medium text-foreground">Export AI insights history</p><p className="text-[10px] text-muted-foreground">All AI follow-ups, suggestions, and stakeholder notifications</p></div>
            <Button size="sm" variant="secondary"><Download className="w-3 h-3" /> Export</Button>
          </div>
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-card border border-border/60">
            <div><p className="text-xs font-medium text-foreground">Export sprint planning notes</p><p className="text-[10px] text-muted-foreground">All move-to-sprint decisions and AI recommendations</p></div>
            <Button size="sm" variant="secondary"><Download className="w-3 h-3" /> Export</Button>
          </div>
        </div>
      </Card>

      <DangerZone />
    </div>
  );
}
