'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Shield,
  Settings,
  Bell,
  AlertTriangle,
  Clock,
  ChevronLeft,
  Loader2,
  Check,
  X,
  Plus,
  Trash2,
  Info,
  Mail,
  Eye,
  type LucideIcon,
} from 'lucide-react';
import type { ProjectSettings, PIICategory, PIISeverity } from '@/lib/api';
import {
  getProjectSettings,
  updateProjectSettings,
  enableVulnScan,
  disableVulnScan,
} from '@/lib/api';

const PII_CATEGORIES: { value: PIICategory; label: string; icon: string }[] = [
  { value: 'email', label: 'Email addresses', icon: '📧' },
  { value: 'phone', label: 'Phone numbers', icon: '📱' },
  { value: 'ssn_tax_id', label: 'SSN / Tax IDs', icon: '🆔' },
  { value: 'credit_card', label: 'Credit card numbers', icon: '💳' },
  { value: 'address', label: 'Street addresses', icon: '🏠' },
  { value: 'passport', label: 'Passport numbers', icon: '📕' },
  { value: 'api_key', label: 'API keys & tokens', icon: '🔑' },
  { value: 'password', label: 'Passwords & secrets', icon: '🔒' },
  { value: 'ip_address', label: 'IP addresses', icon: '🌐' },
  { value: 'health_data', label: 'Health / medical data', icon: '🏥' },
];

const SEVERITY_OPTIONS: { value: PIISeverity; label: string; description: string }[] = [
  { value: 'low', label: 'Alert on everything', description: 'All findings including low severity' },
  { value: 'medium', label: 'Medium and above', description: 'Medium, high, and critical only' },
  { value: 'high', label: 'High and above', description: 'Only high and critical findings' },
  { value: 'critical', label: 'Critical only', description: 'Only the most severe findings' },
];

function Toggle({ checked, onChange, label, description }: {
  checked: boolean;
  onChange: () => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group py-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={clsx(
          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 mt-0.5',
          checked ? 'bg-primary' : 'bg-border'
        )}
      >
        <span
          className={clsx(
            'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-4' : 'translate-x-1'
          )}
        />
      </button>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground group-hover:text-secondary-foreground">{label}</span>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

function Section({ title, icon: Icon, children, description }: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
            {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
          </div>
        </div>
      </div>
      <div className="px-5 py-4 space-y-3">{children}</div>
    </div>
  );
}

export default function SecuritySettingsPage() {
  const [settings, setSettings] = useState<ProjectSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [domainInput, setDomainInput] = useState('');
  const [confirmDisable, setConfirmDisable] = useState(false);

  const projectID = 'current';

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getProjectSettings(projectID);
      setSettings(s);
    } catch {
      setSettings({
        vuln_scan_enabled: false,
        scan_titles: true,
        scan_descriptions: true,
        scan_comments: true,
        severity_threshold: 'low',
        auto_dismiss_low_conf: false,
        notify_owner_enabled: true,
        notify_admin_enabled: true,
        escalation_hours: 48,
        disabled_categories: [],
        allowed_domains: [],
      });
    }
    setLoading(false);
  }, [projectID]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const update = (patch: Partial<ProjectSettings>) => {
    setSettings(prev => prev ? { ...prev, ...patch } : null);
    setSaved(false);
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await updateProjectSettings(projectID, settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleEnable = async () => {
    try {
      await enableVulnScan(projectID);
      update({ vuln_scan_enabled: true });
    } catch { /* ignore */ }
  };

  const handleDisable = async () => {
    try {
      await disableVulnScan(projectID);
      update({ vuln_scan_enabled: false });
      setConfirmDisable(false);
    } catch { /* ignore */ }
  };

  const toggleCategory = (cat: PIICategory) => {
    if (!settings) return;
    const disabled = settings.disabled_categories || [];
    if (disabled.includes(cat)) {
      update({ disabled_categories: disabled.filter(c => c !== cat) });
    } else {
      update({ disabled_categories: [...disabled, cat] });
    }
  };

  const addDomain = () => {
    if (!settings || !domainInput.trim()) return;
    const domain = domainInput.trim().startsWith('@') ? domainInput.trim() : `@${domainInput.trim()}`;
    if (!settings.allowed_domains.includes(domain)) {
      update({ allowed_domains: [...settings.allowed_domains, domain] });
    }
    setDomainInput('');
  };

  const removeDomain = (domain: string) => {
    if (!settings) return;
    update({ allowed_domains: settings.allowed_domains.filter(d => d !== domain) });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!settings) return null;

  if (!settings.vuln_scan_enabled) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <Link href="/settings" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to Settings
        </Link>
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-6 border border-primary/20">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Ticket Vulnerability Scanner</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-2">
            Like Snyk for your tickets. Automatically scan every ticket, description, and comment
            for PII, API keys, and sensitive data.
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-8">
            AI classifies findings, suggests fixes, and executes remediation —
            toggle on per project with full control over what gets scanned.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleEnable}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
            >
              <ShieldAlert className="w-4 h-4" />
              Turn On Scanner
            </button>
            <Link
              href="/security"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/60 text-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors"
            >
              <Eye className="w-4 h-4" />
              View Security Dashboard
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {[
              { icon: '🔍', title: 'Detect', desc: 'Regex + AI scanning for 10+ PII categories' },
              { icon: '🤖', title: 'Classify', desc: 'AI confirms findings with full reasoning' },
              { icon: '🛠️', title: 'Remediate', desc: 'One-click actions: redact, mask, replace' },
            ].map(f => (
              <div key={f.title} className="rounded-xl border border-border/60 p-4">
                <span className="text-xl mb-2 block">{f.icon}</span>
                <h3 className="text-sm font-semibold text-foreground mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Vulnerability Scanner Settings</h1>
            <p className="text-xs text-muted-foreground">Configure PII detection and scanning behavior</p>
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className={clsx(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
            saved
              ? 'bg-success/10 text-success border border-success/20'
              : 'bg-primary text-white hover:bg-primary/90'
          )}
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
        </button>
      </div>

      {/* Master Toggle */}
      <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Ticket Vulnerability Scanner</h2>
              <p className="text-xs text-muted-foreground">Scanning is currently active for this project</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Scan Scope */}
      <Section title="Scan Scope" icon={Eye} description="Choose which fields to scan and which PII categories to detect">
        <div className="space-y-1">
          <Toggle
            checked={settings.scan_titles}
            onChange={() => update({ scan_titles: !settings.scan_titles })}
            label="Scan ticket titles"
          />
          <Toggle
            checked={settings.scan_descriptions}
            onChange={() => update({ scan_descriptions: !settings.scan_descriptions })}
            label="Scan ticket descriptions"
          />
          <Toggle
            checked={settings.scan_comments}
            onChange={() => update({ scan_comments: !settings.scan_comments })}
            label="Scan comments"
            description="Scan comment bodies when synced or added via webhook"
          />
        </div>

        <div className="pt-3 border-t border-border/40">
          <p className="text-xs font-semibold text-foreground mb-3">Detection Categories</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PII_CATEGORIES.map(cat => {
              const enabled = !(settings.disabled_categories || []).includes(cat.value);
              return (
                <button
                  key={cat.value}
                  onClick={() => toggleCategory(cat.value)}
                  className={clsx(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all text-xs',
                    enabled
                      ? 'border-primary/30 bg-primary/5 text-foreground'
                      : 'border-border/40 bg-secondary/50 text-muted-foreground'
                  )}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span className="font-medium flex-1">{cat.label}</span>
                  {enabled ? (
                    <Check className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-border" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      {/* Sensitivity */}
      <Section title="Sensitivity" icon={AlertTriangle} description="Control alert thresholds and auto-dismissal behavior">
        <div>
          <p className="text-xs font-semibold text-foreground mb-2">Severity threshold</p>
          <div className="space-y-1.5">
            {SEVERITY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => update({ severity_threshold: opt.value })}
                className={clsx(
                  'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border text-left transition-all text-xs',
                  settings.severity_threshold === opt.value
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border/40 hover:border-border'
                )}
              >
                <span className={clsx(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                  settings.severity_threshold === opt.value
                    ? 'border-primary bg-primary'
                    : 'border-border'
                )}>
                  {settings.severity_threshold === opt.value && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </span>
                <div>
                  <span className="font-medium text-foreground">{opt.label}</span>
                  <p className="text-[11px] text-muted-foreground">{opt.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <Toggle
          checked={settings.auto_dismiss_low_conf}
          onChange={() => update({ auto_dismiss_low_conf: !settings.auto_dismiss_low_conf })}
          label="Auto-dismiss low confidence findings"
          description="Automatically dismiss findings with AI confidence below 50%"
        />

        <div className="pt-3 border-t border-border/40">
          <p className="text-xs font-semibold text-foreground mb-2">Allowed email domains</p>
          <p className="text-[11px] text-muted-foreground mb-3">Email addresses from these domains won't trigger alerts (e.g., company domain)</p>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={domainInput}
              onChange={e => setDomainInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addDomain()}
              placeholder="@acme.com"
              className="flex-1 px-3 py-1.5 rounded-lg border border-border/60 bg-white text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={addDomain}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary border border-border/60 text-xs text-secondary-foreground hover:bg-muted transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>
          {settings.allowed_domains.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {settings.allowed_domains.map(d => (
                <span key={d} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary border border-border/40 text-xs text-secondary-foreground">
                  {d}
                  <button onClick={() => removeDomain(d)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon={Bell} description="Control who gets notified when PII is detected">
        <Toggle
          checked={settings.notify_owner_enabled}
          onChange={() => update({ notify_owner_enabled: !settings.notify_owner_enabled })}
          label="Notify ticket owner"
          description="Send email and in-app notification to the ticket owner when PII is found"
        />
        <Toggle
          checked={settings.notify_admin_enabled}
          onChange={() => update({ notify_admin_enabled: !settings.notify_admin_enabled })}
          label="Notify org admins"
          description="Send admin digest with summary of new findings"
        />
        <div className="pt-3 border-t border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Escalation timer</p>
              <p className="text-xs text-muted-foreground">Auto-escalate unresolved findings after this many hours</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={720}
                value={settings.escalation_hours}
                onChange={e => update({ escalation_hours: Math.max(1, parseInt(e.target.value) || 48) })}
                className="w-20 px-3 py-1.5 rounded-lg border border-border/60 bg-white text-xs text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="text-xs text-muted-foreground">hours</span>
            </div>
          </div>
        </div>
      </Section>

      {/* Danger Zone */}
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-destructive/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-destructive">Danger Zone</h3>
              <p className="text-[11px] text-destructive/80">Disabling the scanner preserves existing findings but stops all new scans</p>
            </div>
          </div>
        </div>
        <div className="px-5 py-4">
          {confirmDisable ? (
            <div className="flex items-center gap-3">
              <p className="text-xs text-destructive flex-1">Are you sure? No new scans will run for this project.</p>
              <button
                onClick={handleDisable}
                className="px-3 py-1.5 rounded-lg bg-destructive text-white text-xs font-semibold hover:bg-destructive/90 transition-colors"
              >
                Confirm Disable
              </button>
              <button
                onClick={() => setConfirmDisable(false)}
                className="px-3 py-1.5 rounded-lg border border-border/60 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDisable(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-destructive/40 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Disable Scanner
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
