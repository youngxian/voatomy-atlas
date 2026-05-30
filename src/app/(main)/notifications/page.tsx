'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  CheckCheck,
  Settings,
  GitPullRequest,
  Rocket,
  AtSign,
  Target,
  Users,
  BarChart3,
  Clock,
  AlertTriangle,
  Zap,
  MessageSquare,
  ChevronRight,
  Mail,
  Smartphone,
  Volume2,
  Building2,
  Download,
  Share2,
  CheckCircle2,
  TrendingUp,
  Flag,
  FileText,
  Calendar,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';
import { Card, Badge, Button, EmptyState } from '@/components/ui';
import { NotificationIcon } from '@/components/ui/animated-state-icons';
import { NotificationsIllustration } from '@/components/EmptyIllustrations';
import { Reveal } from '@/components/Reveal';
import {
  getNotifications, markNotificationRead, markAllNotificationsRead, type AppNotification,
  getInAppNotifications, markInAppNotificationRead, markAllInAppNotificationsRead, type InAppNotification,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  MOCK_NOTIFICATIONS, kpis, features, risks, milestones,
  type Notification, type NotificationType, type TimeGroup,
} from '@/lib/notifications-mock';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PageTab = 'notifications' | 'stakeholder';

const typeConfig: Record<NotificationType, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  sprint: { icon: BarChart3, color: 'text-success', bg: 'bg-success/10', border: 'border-success/15' },
  pr: { icon: GitPullRequest, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/15' },
  deploy: { icon: Rocket, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/15' },
  mention: { icon: AtSign, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/15' },
  accuracy: { icon: Target, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/15' },
  capacity: { icon: Users, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/15' },
  alert: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/15' },
  insight: { icon: Zap, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/15' },
  comment: { icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/15' },
  integration: { icon: Zap, color: 'text-success', bg: 'bg-success/10', border: 'border-success/15' },
};

const groupLabels: Record<TimeGroup, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'This Week',
};


/* ------------------------------------------------------------------ */
/*  Wireframe Illustration: Stakeholder Report                         */
/* ------------------------------------------------------------------ */

function StakeholderWireframe() {
  return (
    <svg viewBox="0 0 400 200" className="w-full h-auto" fill="none">
      <rect x="0" y="0" width="400" height="200" rx="12" fill="var(--muted)" stroke="var(--border)" strokeWidth="1" />
      {/* Header bar */}
      <rect x="16" y="12" width="180" height="10" rx="3" fill="var(--border)" />
      <rect x="16" y="28" width="120" height="6" rx="2" fill="var(--border)" opacity="0.5" />
      {/* KPI boxes */}
      {[0, 1, 2, 3].map(i => (
        <g key={i}>
          <rect x={16 + i * 94} y={48} width={82} height={50} rx="8" fill="var(--background)" stroke="var(--border)" strokeWidth="0.75" />
          <rect x={24 + i * 94} y={56} width={40} height={5} rx="2" fill="var(--border)" opacity="0.6" />
          <rect x={24 + i * 94} y={68} width={30} height={12} rx="3" fill="var(--primary)" opacity="0.2" />
          <rect x={24 + i * 94} y={86} width={50} height={4} rx="1.5" fill="var(--success)" opacity="0.3" />
        </g>
      ))}
      {/* Feature progress bars */}
      {[0, 1, 2].map(i => (
        <g key={`f${i}`}>
          <rect x={16} y={112 + i * 28} width={368} height={22} rx="6" fill="var(--background)" stroke="var(--border)" strokeWidth="0.75" />
          <rect x={24} y={117 + i * 28} width={80} height={5} rx="2" fill="var(--border)" opacity="0.5" />
          <rect x={120} y={118 + i * 28} width={[200, 160, 100][i]} height={4} rx="2" fill="var(--primary)" opacity={0.3 + i * 0.15} />
          <circle cx={360} cy={123 + i * 28} r="6" fill="var(--primary)" opacity="0.15" />
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function statusBadge(status: string) {
  switch (status) {
    case 'on-track': return { label: 'On Track', variant: 'success' as const };
    case 'at-risk': return { label: 'At Risk', variant: 'warning' as const };
    case 'completed': return { label: 'Complete', variant: 'info' as const };
    case 'behind': return { label: 'Behind', variant: 'danger' as const };
    default: return { label: status, variant: 'muted' as const };
  }
}

function severityBadge(severity: string) {
  switch (severity) {
    case 'high': return { label: 'HIGH', variant: 'danger' as const };
    case 'medium': return { label: 'MED', variant: 'warning' as const };
    case 'low': return { label: 'LOW', variant: 'info' as const };
    default: return { label: severity, variant: 'muted' as const };
  }
}

function progressColor(pct: number) {
  if (pct >= 80) return 'bg-success';
  if (pct >= 50) return 'bg-warning';
  return 'bg-destructive';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const TYPE_MAP: Record<string, NotificationType> = {
  sprint: 'sprint', pr: 'pr', deploy: 'deploy', mention: 'mention',
  accuracy: 'accuracy', capacity: 'capacity', alert: 'alert', insight: 'insight',
  comment: 'comment', integration: 'integration',
};

function relativeTime(diffH: number): string {
  if (diffH < 1) return `${Math.max(1, Math.round(diffH * 60))} min ago`;
  if (diffH < 24) return `${Math.round(diffH)}h ago`;
  return `${Math.round(diffH / 24)}d ago`;
}

function timeGroup(diffH: number): TimeGroup {
  if (diffH < 24) return 'today';
  if (diffH < 48) return 'yesterday';
  return 'thisWeek';
}

function mapApiNotification(n: AppNotification): Notification {
  const diffH = (Date.now() - new Date(n.created_at).getTime()) / 3600000;
  return {
    id: n.id,
    type: TYPE_MAP[n.type] || 'alert',
    title: n.title,
    description: n.body || '',
    timestamp: relativeTime(diffH),
    unread: !n.read,
    group: timeGroup(diffH),
    actionLabel: n.action_url ? 'View' : undefined,
  };
}

function mapInAppNotification(n: InAppNotification): Notification {
  const diffH = (Date.now() - new Date(n.created_at).getTime()) / 3600000;
  return {
    id: `inapp_${n.id}`,
    type: TYPE_MAP[n.type] || 'alert',
    title: n.title,
    description: n.body || '',
    timestamp: relativeTime(diffH),
    unread: !n.read_at,
    group: timeGroup(diffH),
    actionLabel: n.link ? 'View' : undefined,
  };
}

export default function NotificationsPage() {
  const { isDemo: authDemo } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PageTab>('notifications');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showPreferences, setShowPreferences] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [prefState, setPrefState] = useState({ email: true, push: true, sound: false });

  useEffect(() => {
    if (authDemo) {
      setIsDemo(true);
      setNotifications(MOCK_NOTIFICATIONS);
      setLoading(false);
      return;
    }
    setLoading(true);

    const fetchOnboarding = getNotifications(50)
      .then(list => list.map(mapApiNotification))
      .catch(() => [] as Notification[]);

    const fetchInApp = getInAppNotifications(50)
      .then(list => list.map(mapInAppNotification))
      .catch(() => [] as Notification[]);

    Promise.all([fetchOnboarding, fetchInApp])
      .then(([onb, inApp]) => {
        const merged = [...onb, ...inApp].sort((a, b) => {
          const order: Record<TimeGroup, number> = { today: 0, yesterday: 1, thisWeek: 2 };
          return (order[a.group] ?? 3) - (order[b.group] ?? 3);
        });
        setNotifications(merged);
      })
      .finally(() => setLoading(false));
  }, [authDemo]);

  const handleMarkRead = (id: string) => {
    setReadIds(prev => new Set(prev).add(id));
    if (!authDemo && !isDemo) {
      if (id.startsWith('inapp_')) {
        markInAppNotificationRead(id.replace('inapp_', '')).catch((err) => console.error('Failed to mark notification read', err));
      } else {
        markNotificationRead(id).catch((err) => console.error('Failed to mark notification read', err));
      }
    }
  };

  const handleMarkAllRead = () => {
    setReadIds(new Set(notifications.map(n => n.id)));
    if (!authDemo && !isDemo) {
      markAllNotificationsRead().catch((err) => console.error('Failed to mark all read', err));
      markAllInAppNotificationsRead().catch((err) => console.error('Failed to mark all in-app read', err));
    }
  };

  const unreadCount = notifications.filter((n) => n.unread && !readIds.has(n.id)).length;
  const groups: TimeGroup[] = ['today', 'yesterday', 'thisWeek'];

  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'sprint', label: 'Sprint' },
    { id: 'pr', label: 'PRs' },
    { id: 'deploy', label: 'Deploys' },
    { id: 'mention', label: 'Mentions' },
    { id: 'alert', label: 'Alerts' },
  ];

  const filteredNotifications = notifications.filter((n) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!n.title.toLowerCase().includes(q) && !n.description.toLowerCase().includes(q)) return false;
    }
    if (activeFilter === 'unread') return n.unread && !readIds.has(n.id);
    if (activeFilter !== 'all') return n.type === activeFilter;
    return true;
  });

  const preferences = [
    { id: 'email' as const, label: 'Email Notifications', icon: Mail, enabled: prefState.email },
    { id: 'push' as const, label: 'Push Notifications', icon: Smartphone, enabled: prefState.push },
    { id: 'sound' as const, label: 'Sound Alerts', icon: Volume2, enabled: prefState.sound },
  ];

  const tabs: { id: PageTab; label: string; icon: React.ElementType }[] = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'stakeholder', label: 'Stakeholder Report', icon: Building2 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Reveal>
      <div className="space-y-6">
        {isDemo && (
          <div className="px-3 py-1.5 bg-warning/10 border border-warning/20 rounded-lg text-xs text-warning flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" /> Demo mode — showing sample data. Real notifications will appear when connected.
          </div>
        )}

        {/* ---- Header ---- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
                <NotificationIcon size={24} color="var(--primary)" />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center text-[9px] font-bold text-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>Notifications</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'} · Stakeholder reports & alerts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowPreferences(!showPreferences)}>
              <Settings className="w-3.5 h-3.5" />
              Preferences
            </Button>
          </div>
        </div>

        {/* ---- Tab Switcher ---- */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted border border-border w-fit">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === tab.id
                    ? 'bg-background text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ---- Preferences Panel ---- */}
        {showPreferences && (
          <Card>
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                Notification Preferences
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {preferences.map((pref) => {
                  const PrefIcon = pref.icon;
                  return (
                    <div
                      key={pref.id}
                      className="flex items-center justify-between px-4 py-3 rounded-lg bg-muted border border-border"
                    >
                      <div className="flex items-center gap-2">
                        <PrefIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{pref.label}</span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={pref.enabled}
                        onClick={() => setPrefState(prev => ({ ...prev, [pref.id]: !prev[pref.id] }))}
                        className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${pref.enabled ? 'bg-primary' : 'bg-border'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${pref.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* ================================================================ */}
        {/*  NOTIFICATIONS TAB                                               */}
        {/* ================================================================ */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {filterOptions.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                      activeFilter === f.id
                        ? 'bg-primary/10 border-primary/20 text-primary'
                        : 'bg-background border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Groups */}
            {filteredNotifications.length === 0 && !isDemo && (
              <EmptyState
                icon={Bell}
                title={activeFilter === 'unread' ? 'All caught up!' : 'No notifications found'}
                description={activeFilter === 'unread' ? 'You have no unread notifications.' : searchQuery ? 'Try a different search term or filter.' : 'Notifications will appear here when there are sprint updates, ticket changes, or team mentions.'}
                illustration={<NotificationsIllustration className="w-[220px] h-[176px]" />}
              />
            )}
            <div className="space-y-8">
              {groups.map((group) => {
                const items = filteredNotifications.filter((n) => n.group === group);
                if (items.length === 0) return null;

                return (
                  <div key={group}>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2 pb-2 border-b border-border/30">
                      <Clock className="w-3.5 h-3.5" />
                      {groupLabels[group]}
                      <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{items.length}</span>
                    </h2>

                    <div className="space-y-2">
                      {items.map((notification) => {
                        const config = typeConfig[notification.type];
                        const Icon = config.icon;
                        const isUnread = notification.unread && !readIds.has(notification.id);

                        return (
                          <Card key={notification.id} className={`bento-card rounded-2xl ${isUnread ? '!border-l-[3px] !border-l-primary' : ''}`} onClick={() => { if (isUnread) handleMarkRead(notification.id); }}>
                            <div className="flex items-start gap-3 cursor-pointer">
                              {notification.avatar ? (
                                <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                  style={{ backgroundColor: notification.avatar.color + '18', color: notification.avatar.color }}
                                >
                                  {notification.avatar.initials}
                                </div>
                              ) : (
                                <div className={`w-11 h-11 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center shrink-0`}>
                                  <Icon className={`w-5 h-5 ${config.color}`} />
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className={`text-sm leading-snug ${isUnread ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                                      {notification.title}
                                    </p>
                                    {notification.avatar && (
                                      <div className={`w-5 h-5 rounded flex items-center justify-center ${config.bg}`}>
                                        <Icon className={`w-3 h-3 ${config.color}`} />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs text-muted-foreground">{notification.timestamp}</span>
                                    {isUnread && (
                                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    )}
                                  </div>
                                </div>

                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{notification.description}</p>

                                {notification.actionLabel && (
                                  <button className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors">
                                    {notification.actionLabel}
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/*  STAKEHOLDER REPORT TAB                                          */}
        {/* ================================================================ */}
        {activeTab === 'stakeholder' && (
          <div className="space-y-8">
            {/* Stakeholder Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Sprint Summary for Stakeholders</h2>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    Sprint 25 · Feb 24 – Mar 7 · Acme Inc.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm">
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </Button>
                <Button variant="primary" size="sm">
                  <Download className="w-3.5 h-3.5" />
                  Export PDF
                </Button>
              </div>
            </div>

            {/* Wireframe Illustration */}
            <Card className="bento-card rounded-2xl !p-5">
              <div className="flex items-center gap-2 mb-3">
                <LayoutGrid className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Report Wireframe Preview</span>
              </div>
              <StakeholderWireframe />
            </Card>

            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((kpi) => {
                const KpiIcon = kpi.icon;
                return (
                  <Card key={kpi.label} className="bento-card rounded-2xl">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{kpi.label}</span>
                        <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                          <KpiIcon className={`w-4 h-4 ${kpi.color}`} />
                        </div>
                      </div>
                      <div>
                        <span className="text-3xl font-extrabold text-foreground">{kpi.value}</span>
                      </div>
                      <p className={`text-xs font-medium ${
                        kpi.changeType === 'up' ? 'text-success' : kpi.changeType === 'down' ? 'text-destructive' : 'text-muted-foreground'
                      }`}>
                        {kpi.changeType === 'up' && <TrendingUp className="w-3 h-3 inline mr-1" />}
                        {kpi.change}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Feature Progress */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Feature Progress
                </h3>
                <Badge variant="muted">
                  {features.filter(f => f.status === 'completed').length}/{features.length} complete
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {features.map((feature) => {
                  const sb = statusBadge(feature.status);
                  return (
                    <Card key={feature.id} className="bento-card rounded-2xl">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-semibold text-foreground">{feature.name}</h4>
                          <Badge variant={sb.variant}>{sb.label}</Badge>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="text-foreground font-bold">{feature.progress}%</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${progressColor(feature.progress)}`}
                              style={{ width: `${feature.progress}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                              style={{ backgroundColor: feature.ownerColor }}
                            >
                              {feature.ownerInitials}
                            </div>
                            <span className="text-xs text-muted-foreground">{feature.owner}</span>
                          </div>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {feature.deadline}
                          </span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Risk Register & Executive Summary */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Risk Register */}
              <div className="xl:col-span-2 space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  Risk Register
                </h3>
                <div className="space-y-3">
                  {risks.map((risk) => {
                    const sc = severityBadge(risk.severity);
                    return (
                      <Card key={risk.id} className="bento-card rounded-2xl">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={sc.variant}>{sc.label}</Badge>
                              <h4 className="text-sm font-semibold text-foreground">{risk.title}</h4>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-muted-foreground block mb-0.5">Impact</span>
                              <span className="text-foreground">{risk.impact}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block mb-0.5">Mitigation</span>
                              <span className="text-foreground">{risk.mitigation}</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground">Owner: {risk.owner}</p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Executive Summary */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Executive Summary
                </h3>
                <Card className="bento-card rounded-2xl !bg-gradient-to-br !from-background !to-muted">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium text-primary">AI-Generated Summary</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      Sprint 25 is tracking well with <span className="text-foreground font-medium">87% utilization</span>.
                      SSO launched on schedule, Payment Gateway v2 on track for March 7.
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                      <span className="text-warning font-medium">Key risk:</span> Elena&apos;s upcoming leave will reduce Sprint 26 capacity.
                      Cross-training in progress.
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                      <span className="text-success font-medium">Highlights:</span> Bug fix rate improved to 92%.
                      Team delivered 3 more features than last sprint.
                    </p>
                    <div className="pt-3 border-t border-border">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        7 members · 54 pts committed · 14 tickets
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Quick Stats */}
                <Card className="bento-card rounded-2xl">
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Stats</h4>
                    {[
                      { label: 'Sprint Accuracy', value: '78%', color: 'text-warning' },
                      { label: 'On-Time Delivery', value: '86%', color: 'text-success' },
                      { label: 'Scope Creep', value: '+12 pts', color: 'text-destructive' },
                      { label: 'Team Morale', value: 'High', color: 'text-success' },
                      { label: 'Blockers', value: '2 active', color: 'text-warning' },
                    ].map((stat) => (
                      <div key={stat.label} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{stat.label}</span>
                        <span className={`font-bold ${stat.color}`}>{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            {/* Milestones */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Flag className="w-4 h-4 text-primary" />
                Upcoming Milestones
              </h3>
              <Card className="bento-card rounded-2xl">
                <div className="relative">
                  <div className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-border" />
                  <div className="space-y-5">
                    {milestones.map((ms) => {
                      const isComplete = ms.status === 'completed';
                      const isCurrent = ms.status === 'current';
                      return (
                        <div key={ms.id} className="relative flex items-start gap-4 pl-1">
                          <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            isComplete
                              ? 'bg-success/10 border-2 border-success'
                              : isCurrent
                              ? 'bg-primary/10 border-2 border-primary'
                              : 'bg-muted border-2 border-border'
                          }`}>
                            {isComplete ? (
                              <CheckCircle2 className="w-4 h-4 text-success" />
                            ) : isCurrent ? (
                              <Target className="w-4 h-4 text-primary" />
                            ) : (
                              <Clock className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 pb-1">
                            <div className="flex items-center gap-3">
                              <h4 className={`text-sm font-semibold ${isComplete ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                {ms.title}
                              </h4>
                              <Badge variant={isComplete ? 'success' : isCurrent ? 'accent' : 'muted'}>
                                {ms.date}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{ms.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Reveal>
  );
}
