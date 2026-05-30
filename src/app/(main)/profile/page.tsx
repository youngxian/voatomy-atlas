'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Building2,
  Shield,
  Check,
  Loader2,
  ChevronRight,
  Globe,
  CalendarDays,
  Pencil,
  X,
  LogIn,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { useAuth } from '@/lib/auth';
import { useProject } from '@/lib/project-context';
import { useTeamMembers } from '@/lib/queries';
import { config } from '@/lib/config';
import { normalizeProfileDisplay, getCanonicalEmail, getNameFromBoardByEmail } from '@/lib/utils';

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  admin: { label: 'Admin', color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
  owner: { label: 'Owner', color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
  editor: { label: 'Editor', color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
  viewer: { label: 'Viewer', color: 'text-muted-foreground', bg: 'bg-muted border-border' },
  member: { label: 'Member', color: 'text-foreground', bg: 'bg-muted border-border' },
};

const TIMEZONE_OPTIONS = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Toronto',
  'America/Vancouver',
  'America/Sao_Paulo',
  'America/Argentina/Buenos_Aires',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Stockholm',
  'Europe/Helsinki',
  'Europe/Moscow',
  'Europe/Istanbul',
  'Africa/Lagos',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Nairobi',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
];

function getInitials(name: string) {
  const clean = name.includes('@') ? name.split('@')[0] : name;
  return clean
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';
}

function formatTimezoneLabel(tz: string): string {
  try {
    const now = new Date();
    const short = now.toLocaleString('en-US', { timeZone: tz, timeZoneName: 'short' }).split(' ').pop() ?? '';
    const city = tz.split('/').pop()?.replace(/_/g, ' ') ?? tz;
    return `${city} (${short})`;
  } catch {
    return tz;
  }
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
        <p className="text-sm text-foreground font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

function EditableRow({
  icon: Icon,
  label,
  value,
  onSave,
  type = 'text',
  options,
  placeholder,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  onSave: (val: string) => Promise<void>;
  type?: 'text' | 'select';
  options?: { value: string; label: string }[];
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(value); }, [value]);

  const handleSave = async () => {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch { /* stay in edit mode */ }
    finally { setSaving(false); }
  };

  return (
    <div className="flex items-center gap-3 py-3 group">
      <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
        {editing ? (
          <div className="flex items-center gap-2 mt-1">
            {type === 'select' && options ? (
              <select
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-primary/40 bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 max-w-xs"
              >
                <option value="">Not set</option>
                {options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                autoFocus
                placeholder={placeholder}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-primary/40 bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 max-w-xs"
              />
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="p-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => { setEditing(false); setDraft(value); }}
              className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground border border-border transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <p className="text-sm text-foreground font-medium truncate">{value || <span className="text-muted-foreground italic">Not set</span>}</p>
        )}
      </div>
      {!editing && (
        <button
          onClick={() => setEditing(true)}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-all"
          title={`Edit ${label.toLowerCase()}`}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading, error, updateProfile } = useAuth();
  const [saved, setSaved] = useState<string | null>(null);

  const showSaved = (field: string) => {
    setSaved(field);
    setTimeout(() => setSaved(null), 2000);
  };

  const handleUpdateName = async (val: string) => {
    if (!val.trim()) return;
    await updateProfile({ full_name: val.trim() });
    showSaved('name');
  };

  const handleUpdateTimezone = async (val: string) => {
    await updateProfile({ timezone: val });
    showSaved('timezone');
  };

  const handleUpdateOrgName = async (val: string) => {
    if (!val.trim()) return;
    await updateProfile({ org_name: val.trim() });
    showSaved('org');
  };

  const [loginUrl, setLoginUrl] = useState(
    `${config.landingUrl}/auth/login?redirect=${encodeURIComponent('/profile')}`
  );

  useEffect(() => {
    setLoginUrl(
      `${config.landingUrl}/auth/login?redirect=${encodeURIComponent(window.location.href)}`
    );
  }, []);

  if (!user) {
    return (
      <Reveal>
        <div className="max-w-md mx-auto py-24 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted border border-border">
            <User className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2
            className="text-xl font-bold text-foreground mb-2"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Sign in to view your profile
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {(error as { message?: string })?.message || 'Connect to your account to manage your profile and preferences.'}
          </p>
          <a
            href={loginUrl}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Sign in
          </a>
        </div>
      </Reveal>
    );
  }

  const roleCfg = ROLE_LABELS[user.role] ?? ROLE_LABELS.member;
  const tzLabel = user.timezone ? formatTimezoneLabel(user.timezone) : 'Not set';
  const tzOptions = TIMEZONE_OPTIONS.map((tz) => ({ value: tz, label: formatTimezoneLabel(tz) }));
  const normalized = normalizeProfileDisplay(user);
  const { activeProjectId } = useProject();
  const { data: teamMembers = [] } = useTeamMembers(activeProjectId);
  const canonicalEmail = getCanonicalEmail(user);
  const boardName = getNameFromBoardByEmail(canonicalEmail, teamMembers);
  const displayName = boardName ?? normalized.full_name;
  const displayEmail = normalized.email;

  return (
    <Reveal>
      <div className="max-w-2xl mx-auto space-y-6 pb-10">
        {/* Header */}
        <div>
          <h1
            className="text-2xl font-bold text-foreground tracking-tight"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Profile
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your personal information and preferences
          </p>
        </div>

        {/* Avatar + name card */}
        <div className="bento-card rounded-2xl border border-border bg-card overflow-hidden">
          {/* Banner */}
          <div className="h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-muted relative">
            <div className="absolute -bottom-10 left-6">
              <div className="w-20 h-20 rounded-2xl bg-primary text-white text-2xl font-bold flex items-center justify-center ring-4 ring-card shadow-lg">
                {user.avatar ? (
                  <img src={user.avatar} alt={displayName} className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  getInitials(displayName)
                )}
              </div>
            </div>
          </div>

          <div className="pt-14 px-6 pb-6">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <h2
                  className="text-xl font-bold text-foreground"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {displayName}
                </h2>
                {saved && (
                  <span className="flex items-center gap-1 text-xs text-success font-medium animate-pulse">
                    <Check className="w-3 h-3" /> Saved
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{displayEmail}</p>

            {/* Role + org badges */}
            <div className="flex items-center gap-2 mt-3">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${roleCfg.color} ${roleCfg.bg}`}>
                <Shield className="w-3 h-3" />
                {roleCfg.label}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-foreground bg-muted border border-border">
                <Building2 className="w-3 h-3 text-muted-foreground" />
                {user.org_name}
              </span>
            </div>
          </div>
        </div>

        {/* Editable Details card */}
        <div className="bento-card rounded-2xl border border-border bg-card p-6">
          <h3
            className="text-sm font-semibold text-foreground mb-4"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Account Details
          </h3>
          <div className="divide-y divide-border">
            <EditableRow
              icon={User}
              label="Full Name"
              value={displayName}
              onSave={handleUpdateName}
              placeholder="Your full name"
            />
            <InfoRow icon={Mail} label="Email" value={displayEmail} />
            <EditableRow
              icon={Building2}
              label="Organization"
              value={user.org_name}
              onSave={handleUpdateOrgName}
              placeholder="Workspace name"
            />
            <InfoRow icon={Shield} label="Role" value={roleCfg.label} />
            <EditableRow
              icon={Globe}
              label="Timezone"
              value={user.timezone ?? ''}
              onSave={handleUpdateTimezone}
              type="select"
              options={tzOptions}
            />
            <InfoRow icon={CalendarDays} label="User ID" value={user.id.slice(0, 8) + '...'} />
          </div>
        </div>

        {/* Quick links */}
        <div className="bento-card rounded-2xl border border-border bg-card overflow-hidden">
          <h3
            className="text-sm font-semibold text-foreground px-6 pt-5 pb-3"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Quick Links
          </h3>
          {[
            { label: 'Account Settings', href: '/settings', desc: 'Manage security, notifications, and billing' },
            { label: 'Team Members', href: '/team', desc: 'View and manage your team' },
            { label: 'Integrations', href: '/integrations', desc: 'Connected services and data sources' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center justify-between px-6 py-3.5 hover:bg-muted/60 transition-colors border-t border-border"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{link.label}</p>
                <p className="text-[11px] text-muted-foreground">{link.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </a>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
