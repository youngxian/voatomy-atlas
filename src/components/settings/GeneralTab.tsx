'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  CreditCard,
  Check,
  Save,
  Globe,
  Clock,
  Zap,
  Database,
  BarChart3,
  Loader2,
  Monitor,
  Palette,
  CalendarRange,
  FolderKanban,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { Toggle, Select, Input, SectionHeader, SaveBar } from './SettingsFormControls';
import { ThemeAppearanceSection } from './ThemeAppearanceSection';
import {
  getDataRetention,
  updateDataRetention,
  type DataRetentionSettings,
} from '@/lib/data-retention';

const RETENTION_LABELS = ['60 days', '90 days', '120 days', '180 days', '365 days', 'Never (keep forever)'];
const RETENTION_LABEL_TO_DAYS: Record<string, number> = {
  '60 days': 60, '90 days': 90, '120 days': 120, '180 days': 180, '365 days': 365, 'Never (keep forever)': 0,
};
const RETENTION_DAYS_TO_LABEL: Record<number, string> = {
  60: '60 days', 90: '90 days', 120: '120 days', 180: '180 days', 365: '365 days', 0: 'Never (keep forever)',
};

export function GeneralTab() {
  const [projectName, setProjectName] = useState('ACME Engineering');
  const [orgName] = useState('Voatomy Labs');
  const [timezone, setTimezone] = useState('UTC-5 (Eastern)');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [language, setLanguage] = useState('English');
  const [density, setDensity] = useState('Comfortable');
  const [weekStart, setWeekStart] = useState('Monday');
  const [currency, setCurrency] = useState('USD ($)');
  const [showRevenue, setShowRevenue] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [compactSidebar, setCompactSidebar] = useState(false);

  const [retention, setRetention] = useState<DataRetentionSettings | null>(null);
  const [retentionLabel, setRetentionLabel] = useState('180 days');
  const [retentionSaving, setRetentionSaving] = useState(false);
  const [retentionSaved, setRetentionSaved] = useState(false);

  const orgId = typeof window !== 'undefined' ? localStorage.getItem('voatomy_org_id') ?? '' : '';

  const fetchRetention = useCallback(async () => {
    if (!orgId) return;
    try {
      const data = await getDataRetention(orgId);
      setRetention(data);
      setRetentionLabel(RETENTION_DAYS_TO_LABEL[data.retention_days] ?? '180 days');
    } catch { /* ignore */ }
  }, [orgId]);

  useEffect(() => { fetchRetention(); }, [fetchRetention]);

  const handleRetentionSave = async () => {
    if (!orgId) return;
    setRetentionSaving(true);
    try {
      const days = RETENTION_LABEL_TO_DAYS[retentionLabel] ?? 180;
      const updated = await updateDataRetention(orgId, days);
      setRetention(updated);
      setRetentionSaved(true);
      setTimeout(() => setRetentionSaved(false), 2000);
    } catch { /* ignore */ }
    finally { setRetentionSaving(false); }
  };

  return (
    <div className="space-y-5">
      <Card className="bento-card rounded-2xl">
        <SectionHeader icon={FolderKanban} title="Project Configuration" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Input label="Project Name" value={projectName} onChange={setProjectName} hint="Displayed in sidebar and reports" />
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Organization</label>
            <div className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-[#D4A843] flex items-center justify-center"><span className="text-[9px] font-bold text-white">V</span></div>
              {orgName}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <Select label="Timezone" value={timezone} onChange={setTimezone} icon={Globe} options={['UTC-8 (Pacific)', 'UTC-7 (Mountain)', 'UTC-6 (Central)', 'UTC-5 (Eastern)', 'UTC+0 (London)', 'UTC+1 (Berlin)', 'UTC+5:30 (Mumbai)', 'UTC+9 (Tokyo)']} />
          <Select label="Week Starts On" value={weekStart} onChange={setWeekStart} icon={CalendarRange} options={['Monday', 'Sunday', 'Saturday']} />
          <Select label="Currency" value={currency} onChange={setCurrency} icon={CreditCard} options={['USD ($)', 'EUR (€)', 'GBP (£)', 'JPY (¥)', 'CAD (C$)', 'AUD (A$)']} />
        </div>
      </Card>

      <ThemeAppearanceSection />

      <Card className="bento-card rounded-2xl">
        <SectionHeader icon={Palette} title="Display Preferences" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <Select label="Date Format" value={dateFormat} onChange={setDateFormat} icon={Clock} options={['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'MMM DD, YYYY']} />
          <Select label="Language" value={language} onChange={setLanguage} icon={Globe} options={['English', 'Spanish', 'French', 'German', 'Portuguese', 'Japanese']} />
          <Select label="UI Density" value={density} onChange={setDensity} icon={Monitor} options={['Compact', 'Comfortable', 'Spacious']} hint="Controls padding and spacing throughout" />
        </div>
        <div className="mt-4 space-y-1 border-t border-border/60 pt-4">
          <Toggle checked={animationsEnabled} onChange={() => setAnimationsEnabled(!animationsEnabled)} label="Enable animations" description="Page transitions, loading effects, and micro-interactions" />
          <Toggle checked={compactSidebar} onChange={() => setCompactSidebar(!compactSidebar)} label="Compact sidebar" description="Collapse sidebar to icon-only mode by default" />
          <Toggle checked={showRevenue} onChange={() => setShowRevenue(!showRevenue)} label="Show revenue data" description="Display LOOP revenue signals and pipeline amounts in ATLAS views" />
        </div>
      </Card>

      <Card className="bento-card rounded-2xl">
        <SectionHeader icon={BarChart3} title="Usage Statistics" badge="Current period" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {[
            { label: 'API Calls', value: '24,847', limit: '50,000', pct: 49.7, trend: '+12%', icon: Zap },
            { label: 'Storage', value: '2.4 GB', limit: '10 GB', pct: 24, trend: '+0.3 GB', icon: Database },
            { label: 'Team Seats', value: '6', limit: '10', pct: 60, trend: '+2', icon: Users },
            { label: 'Sprints', value: '4', limit: '∞', pct: 0, trend: '', icon: BarChart3 },
          ].map(s => (
            <div key={s.label} className="rounded-lg bg-card border border-border/60 p-3">
              <div className="flex items-center justify-between mb-2">
                <s.icon className="w-3.5 h-3.5 text-muted-foreground" />
                {s.trend && <span className="text-[10px] font-medium text-success">{s.trend}</span>}
              </div>
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">of {s.limit}</p>
              {s.pct > 0 && (
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${s.pct}%`, background: s.pct > 80 ? 'var(--destructive)' : s.pct > 60 ? 'var(--warning)' : 'var(--primary)', animation: 'growBar 1s ease-out' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="bento-card rounded-2xl">
        <SectionHeader icon={Database} title="Data Retention" />
        <p className="text-[11px] text-muted-foreground mt-1 mb-3">
          Stale data (not updated within this period) is automatically deleted. Set to &quot;Never&quot; to keep all data indefinitely. Active sprints are always preserved.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Retention Period"
            value={retentionLabel}
            onChange={setRetentionLabel}
            icon={Clock}
            options={RETENTION_LABELS}
            hint="How long to keep data that hasn't been updated"
          />
          <div className="flex items-end pb-1">
            {retentionLabel === 'Never (keep forever)' ? (
              <Badge variant="success">Retention off — data kept forever</Badge>
            ) : retention && retention.stale_count > 0 ? (
              <p className="text-[10px] text-muted-foreground">
                {retention.stale_count} stale item{retention.stale_count !== 1 ? 's' : ''} would be purged
                {retention.oldest_stale_date && (
                  <> · Oldest: {new Date(retention.oldest_stale_date).toLocaleDateString()}</>
                )}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center justify-end pt-3 mt-3 border-t border-border/60">
          <button
            onClick={handleRetentionSave}
            disabled={retentionSaving}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all ${retentionSaved ? 'bg-success' : 'bg-primary hover:bg-primary/90'}`}
          >
            {retentionSaving ? (
              <Loader2 className="w-4 h-4" style={{ animation: 'spin 0.8s linear infinite' }} />
            ) : retentionSaved ? (
              <><Check className="w-4 h-4" style={{ animation: 'scaleIn 0.3s ease-out' }} /> Saved</>
            ) : (
              <><Save className="w-4 h-4" /> Save Retention</>
            )}
          </button>
        </div>
      </Card>

      <SaveBar />
    </div>
  );
}
