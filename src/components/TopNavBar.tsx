'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  Check,
  Shield,
  ShieldAlert,
  Eye,
  Pencil,
  FolderKanban,
  CalendarRange,
  Settings,
  LogOut,
  HelpCircle,
  GitBranch,
  Zap,
  User,
  ChevronsUpDown,
  Keyboard,
  AlertTriangle,
  Users,
  Loader2,
  LayoutDashboard,
  TrendingDown,
  Gauge,
  History,
  RotateCcw,
  ListChecks,
  ClipboardList,
  Video,
  FileText,
  Layers,
  Brain,
  Sparkles,
  BarChart3,
  PieChart,
  Activity,
  Plug,
  Lock,
  Hexagon,
  UsersRound,
  ExternalLink,
  Trophy,
  Repeat,
  Wifi,
} from 'lucide-react';

import { config, productDashboardUrl } from '@/lib/config';
import {
  getInAppNotifications,
  getInAppUnreadCount,
  markAllInAppNotificationsRead,
  markInAppNotificationRead,
  getSprint,
  getSprints,
  updateProject,
  updateProjectConnection,
  syncProject,
  getProjectHierarchy,
  type InAppNotification,
  type Sprint,
  type BoardStructure,
  type HierarchyItem,
} from '@/lib/api';
import type { Project } from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { useAuth } from '@/lib/auth';
import { useMe, useTeamMembers } from '@/lib/queries';
import { getProviderLabel, getProviderColor, getProjectProvider } from '@/lib/project-utils';
import { normalizeProfileDisplay, getCanonicalEmail, getNameFromBoardByEmail } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { detectSprintCycle, cycleShortLabel, deduplicateSprints, flattenHierarchy, type SprintCycleInfo } from '@/lib/board-utils';
import { queryKeys } from '@/lib/queries';
import { usePlan } from '@/lib/plan';
import { isRouteLocked, getRouteGate, getRequiredTierLabel } from '@/lib/plan-gates';
import SprintPickerModal from '@/components/SprintPickerModal';
import BoardExplorerModal from '@/components/BoardExplorerModal';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

// ─── Helpers ────────────────────────────────────────────────────────────────

function handleLogout() {
  fetch(`${config.publicApi}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  }).finally(() => {
    document.cookie = 'session=; path=/; max-age=0';
    window.location.href = `${config.landingUrl}/auth/login`;
  });
}

type SyncStatus = 'live' | 'stale' | 'error';

function getSyncStatus(lastSyncedAt?: string): { status: SyncStatus; label: string } {
  if (!lastSyncedAt) return { status: 'stale', label: 'never' };
  const ago = Date.now() - new Date(lastSyncedAt).getTime();
  if (ago < 600_000) return { status: 'live', label: `${Math.round(ago / 60_000)}m ago` };
  if (ago < 3_600_000) return { status: 'stale', label: `${Math.round(ago / 60_000)}m ago` };
  return { status: 'stale', label: `${Math.round(ago / 3_600_000)}h ago` };
}

function formatSprintDates(start?: string, end?: string): string {
  if (!start || !end) return '';
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

/** Restricts notification links to same-origin paths; prevents XSS and open redirects. */
function isSafeNotificationLink(link: string): boolean {
  if (!link || typeof link !== 'string') return false;
  const lower = link.toLowerCase().trim();
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) return false;
  if (lower.startsWith('//')) return false; // protocol-relative URLs
  return link.startsWith('/') && !link.includes('..');
}

const NOTIF_TYPE_META: Record<string, { icon: React.ElementType; color: string }> = {
  pii_detected: { icon: ShieldAlert, color: 'text-destructive' },
  pii_comment: { icon: ShieldAlert, color: 'text-destructive' },
  pii_escalation: { icon: AlertTriangle, color: 'text-warning' },
  ownership_change: { icon: Users, color: 'text-primary' },
  ownership_pii_warning: { icon: ShieldAlert, color: 'text-warning' },
  ticket_bouncing: { icon: AlertTriangle, color: 'text-warning' },
  ticket_orphaned: { icon: AlertTriangle, color: 'text-warning' },
  sprint: { icon: CalendarRange, color: 'text-primary' },
  signal: { icon: Zap, color: 'text-warning' },
  mention: { icon: User, color: 'text-primary' },
  deploy: { icon: GitBranch, color: 'text-primary' },
};

type UserRole = 'admin' | 'editor' | 'viewer';

const ROLE_META: Record<UserRole, { label: string; color: string; icon: React.ElementType }> = {
  admin: { label: 'Admin', color: 'text-primary bg-primary/10 border-primary/20', icon: Shield },
  editor: { label: 'Editor', color: 'text-warning bg-warning/10 border-warning/20', icon: Pencil },
  viewer: { label: 'Viewer', color: 'text-muted-foreground bg-muted border-border', icon: Eye },
};

const SYNC_DOT: Record<SyncStatus, string> = {
  live: 'bg-success',
  stale: 'bg-warning',
  error: 'bg-destructive',
};

// ─── Navigation Data ────────────────────────────────────────────────────────

interface NavChild {
  label: string;
  desc?: string;
  href: string;
  icon: React.ElementType;
  iconColor: string;
}

interface NavTab {
  label: string;
  href?: string;
  icon: React.ElementType;
  iconColor: string;
  children?: NavChild[];
  columns?: number;
}

const NAV_TABS: NavTab[] = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    iconColor: 'icon-green',
  },
  {
    label: 'Sprint',
    icon: CalendarRange,
    iconColor: 'icon-blue',
    columns: 2,
    children: [
      { label: 'Plan Sprint', desc: 'AI-powered planning', href: '/sprint/plan', icon: Zap, iconColor: 'icon-blue' },
      { label: 'Tickets', desc: 'Manage tasks', href: '/tickets', icon: ListChecks, iconColor: 'icon-green' },
      { label: 'Burndown', desc: 'Track progress', href: '/sprint/burndown', icon: TrendingDown, iconColor: 'icon-rose' },
      { label: 'Scoreboard', desc: 'Top performers & strategy', href: '/sprint/scoreboard', icon: Trophy, iconColor: 'icon-amber' },
      { label: 'Accuracy', desc: 'Estimate quality', href: '/accuracy', icon: Gauge, iconColor: 'icon-amber' },
      { label: 'History', desc: 'Past sprints', href: '/history', icon: History, iconColor: 'icon-purple' },
      { label: 'Retrospective', desc: 'Team reflection', href: '/retro', icon: RotateCcw, iconColor: 'icon-teal' },
      { label: 'Activity', desc: 'Live feed', href: '/activity', icon: Activity, iconColor: 'icon-indigo' },
      { label: 'Dependencies', desc: 'Blockers & links', href: '/dependencies', icon: GitBranch, iconColor: 'icon-amber' },
      { label: 'Automations', desc: 'Workflow rules', href: '/automations', icon: Brain, iconColor: 'icon-rose' },
    ],
  },
  {
    label: 'Notes',
    icon: FileText,
    iconColor: 'icon-amber',
    children: [
      { label: 'Daily Standups', desc: 'Team check-ins', href: '/standups', icon: ClipboardList, iconColor: 'icon-green' },
      { label: 'Meetings', desc: 'Notes & agendas', href: '/meetings', icon: Video, iconColor: 'icon-blue' },
      { label: 'Planning Notes', desc: 'Sprint prep', href: '/sprint/planning-notes', icon: FileText, iconColor: 'icon-amber' },
    ],
  },
  {
    label: 'Insights',
    icon: Brain,
    iconColor: 'icon-purple',
    children: [
      { label: 'Analytics', desc: 'Team performance', href: '/analytics', icon: BarChart3, iconColor: 'icon-green' },
      { label: 'Backlog', desc: 'AI intelligence', href: '/backlog', icon: Sparkles, iconColor: 'icon-blue' },
      { label: 'Capacity', desc: 'Team workload', href: '/capacity', icon: BarChart3, iconColor: 'icon-amber' },
    ],
  },
  {
    label: 'Workspace',
    icon: FolderKanban,
    iconColor: 'icon-teal',
    children: [
      { label: 'Projects', desc: 'All projects', href: '/projects', icon: FolderKanban, iconColor: 'icon-teal' },
      { label: 'Team', desc: 'Members & roles', href: '/team', icon: UsersRound, iconColor: 'icon-purple' },
      { label: 'Integrations', desc: 'Connected tools', href: '/integrations', icon: Hexagon, iconColor: 'icon-blue' },
      { label: 'Notifications', desc: 'Alerts & updates', href: '/notifications', icon: Bell, iconColor: 'icon-amber' },
    ],
  },
  {
    label: 'Workflow',
    href: '/workflow',
    icon: GitBranch,
    iconColor: 'icon-rose',
  },
];

const MOBILE_NAV_SECTIONS = [
  {
    title: 'Core',
    iconColor: 'icon-green',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, iconColor: 'icon-green' },
      { label: 'Workflow', href: '/workflow', icon: GitBranch, iconColor: 'icon-rose' },
    ],
  },
  {
    title: 'Sprint',
    iconColor: 'icon-blue',
    items: [
      { label: 'Plan Sprint', href: '/sprint/plan', icon: CalendarRange, iconColor: 'icon-blue' },
      { label: 'Tickets', href: '/tickets', icon: ListChecks, iconColor: 'icon-green' },
      { label: 'Burndown', href: '/sprint/burndown', icon: TrendingDown, iconColor: 'icon-rose' },
      { label: 'Scoreboard', href: '/sprint/scoreboard', icon: Trophy, iconColor: 'icon-amber' },
      { label: 'Accuracy', href: '/accuracy', icon: Gauge, iconColor: 'icon-amber' },
      { label: 'History', href: '/history', icon: History, iconColor: 'icon-purple' },
      { label: 'Retrospective', href: '/retro', icon: RotateCcw, iconColor: 'icon-teal' },
      { label: 'Activity', href: '/activity', icon: Activity, iconColor: 'icon-indigo' },
      { label: 'Dependencies', href: '/dependencies', icon: GitBranch, iconColor: 'icon-amber' },
      { label: 'Automations', href: '/automations', icon: Zap, iconColor: 'icon-rose' },
    ],
  },
  {
    title: 'Notes',
    iconColor: 'icon-amber',
    items: [
      { label: 'Daily Standups', href: '/standups', icon: ClipboardList, iconColor: 'icon-green' },
      { label: 'Meetings', href: '/meetings', icon: Video, iconColor: 'icon-blue' },
      { label: 'Planning Notes', href: '/sprint/planning-notes', icon: FileText, iconColor: 'icon-amber' },
    ],
  },
  {
    title: 'Insights',
    iconColor: 'icon-purple',
    items: [
      { label: 'Analytics', href: '/analytics', icon: PieChart, iconColor: 'icon-green' },
      { label: 'Backlog Intelligence', href: '/backlog', icon: Layers, iconColor: 'icon-blue' },
      { label: 'Capacity', href: '/capacity', icon: BarChart3, iconColor: 'icon-amber' },
    ],
  },
  {
    title: 'Workspace',
    iconColor: 'icon-teal',
    items: [
      { label: 'Projects', href: '/projects', icon: FolderKanban, iconColor: 'icon-teal' },
      { label: 'Team', href: '/team', icon: UsersRound, iconColor: 'icon-purple' },
      { label: 'Integrations', href: '/integrations', icon: Plug, iconColor: 'icon-blue' },
      { label: 'Notifications', href: '/notifications', icon: Bell, iconColor: 'icon-amber' },
    ],
  },
  {
    title: 'System',
    iconColor: 'icon-indigo',
    items: [
      { label: 'Security', href: '/security', icon: ShieldAlert, iconColor: 'icon-rose' },
      { label: 'Settings', href: '/settings', icon: Settings, iconColor: 'icon-indigo' },
    ],
  },
];

// ─── Click-outside hook ─────────────────────────────────────────────────────

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [ref, handler]);
}

// ─── Component ──────────────────────────────────────────────────────────────

interface TopNavBarProps {
  onSearchOpen?: () => void;
}

export default function TopNavBar({ onSearchOpen }: TopNavBarProps) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { projects, activeProject, activeSprint, loading: projectsLoading, setActiveProject, setActiveSprint, switchProject, refreshProjects, refreshBoardStructure } = useProject();
  const { isDemo } = useAuth();
  const { tier } = usePlan();

  const { data: meData } = useMe();
  const normalized = meData ? normalizeProfileDisplay(meData) : { full_name: '', email: '' };
  const { data: teamMembers = [] } = useTeamMembers(activeProject?.id ?? null);
  const canonicalEmail = meData ? getCanonicalEmail(meData) : '';
  const boardName = getNameFromBoardByEmail(canonicalEmail, teamMembers);
  const userName = boardName ?? normalized.full_name;
  const userEmail = normalized.email;
  const orgName = meData?.org_name ?? '';
  const userRole = meData?.role ?? '';

  // Mobile sheet
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Desktop dropdowns
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [projectOpen, setProjectOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [liveNotifications, setLiveNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Sprint picker modal
  const [pendingSwitch, setPendingSwitch] = useState<Project | null>(null);
  const [switchData, setSwitchData] = useState<{ sprints: Sprint[]; boardStructure: BoardStructure | null } | null>(null);
  const [switchLoading, setSwitchLoading] = useState(false);
  const previousProjectRef = useRef<string | null>(null);

  // Board explorer
  const [explorerOpen, setExplorerOpen] = useState(false);

  // Sprint dropdown
  const [sprintDropdownOpen, setSprintDropdownOpen] = useState(false);
  const [sprintList, setSprintList] = useState<Sprint[]>([]);
  const [sprintListLoading, setSprintListLoading] = useState(false);
  const [sprintSwitching, setSprintSwitching] = useState(false);
  const [sprintCycleInfo, setSprintCycleInfo] = useState<SprintCycleInfo | null>(null);
  const sprintDropdownRef = useRef<HTMLDivElement>(null);

  // Generic board switcher
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);
  const [boardItems, setBoardItems] = useState<HierarchyItem[]>([]);
  const [boardDropdownLoading, setBoardDropdownLoading] = useState(false);
  const [boardSwitching, setBoardSwitching] = useState(false);
  const boardDropdownRef = useRef<HTMLDivElement>(null);

  const projectRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const navDropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(projectRef, () => setProjectOpen(false));
  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(userRef, () => setUserOpen(false));
  useClickOutside(sprintDropdownRef, () => setSprintDropdownOpen(false));
  useClickOutside(boardDropdownRef, () => setBoardDropdownOpen(false));
  useClickOutside(navDropdownRef, () => setOpenDropdown(null));

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  // Close dropdowns on Escape key
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setProjectOpen(false);
        setNotifOpen(false);
        setUserOpen(false);
        setSprintDropdownOpen(false);
        setBoardDropdownOpen(false);
        setOpenDropdown(null);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // ─── Project switching ────────────────────────────────────────────────────

  const handleProjectSwitch = async (p: Project) => {
    if (p.id === activeProject?.id) return;
    if (isDemo) return;
    setProjectOpen(false);
    setPendingSwitch(p);
    previousProjectRef.current = activeProject?.id ?? null;
    setSwitchLoading(true);
    try {
      const result = await switchProject(p.id);
      setSwitchData({ sprints: result.sprints, boardStructure: result.boardStructure });
    } catch {
      setPendingSwitch(null);
      setSwitchData(null);
      if (previousProjectRef.current) {
        setActiveProject(previousProjectRef.current);
      }
    } finally {
      setSwitchLoading(false);
    }
  };

  const handleSprintSelected = async (sprint: Sprint) => {
    if (!pendingSwitch) return;
    const project = pendingSwitch;
    setSprintSwitching(true);
    try {
      const isClickUp = getProjectProvider(project) === 'clickup';
      const projectBoardId = project.clickup_list_id ?? project.connections?.find((c) => c.provider === 'clickup')?.external_board_id;
      const listDiff = isClickUp && sprint.clickup_list_id && sprint.clickup_list_id !== projectBoardId;
      if (listDiff) {
        await updateProject(project.id, { clickup_list_id: sprint.clickup_list_id });
        const clickupConn = project.connections?.find((c) => c.provider === 'clickup' && c.sync_enabled);
        if (clickupConn) {
          await updateProjectConnection(project.id, clickupConn.id, { external_board_id: sprint.clickup_list_id });
        }
        await syncProject(project.id);
        await refreshProjects();
        queryClient.invalidateQueries({ queryKey: queryKeys.sprints(project.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      }
      const detail = await getSprint(project.id, sprint.id);
      setActiveSprint(detail);
      await refreshBoardStructure();
    } catch {
      setActiveSprint(null);
    } finally {
      setSprintSwitching(false);
    }
    setPendingSwitch(null);
    setSwitchData(null);
  };

  const handleSprintModalClose = () => {
    if (switchData && switchData.sprints.length === 0) {
      setActiveSprint(null);
    } else if (previousProjectRef.current) {
      setActiveProject(previousProjectRef.current);
    }
    setPendingSwitch(null);
    setSwitchData(null);
  };

  const handleSprintDropdownToggle = async () => {
    if (sprintDropdownOpen) {
      setSprintDropdownOpen(false);
      return;
    }
    if (!activeProject) return;
    setSprintDropdownOpen(true);
    setSprintListLoading(true);
    try {
      const list = await getSprints(activeProject.id);
      const deduped = deduplicateSprints(list);
      setSprintList(deduped);
      setSprintCycleInfo(detectSprintCycle(deduped, activeProject));
    } catch {
      setSprintList([]);
      setSprintCycleInfo(null);
    } finally {
      setSprintListLoading(false);
    }
  };

  const handleInlineSprintSelect = async (sprint: Sprint) => {
    if (!activeProject) return;
    setSprintDropdownOpen(false);
    setSprintSwitching(true);
    try {
      const isClickUp = getProjectProvider(activeProject) === 'clickup';
      const projectBoardId = activeProject.clickup_list_id ?? activeProject.connections?.find((c) => c.provider === 'clickup')?.external_board_id;
      const listDiff = isClickUp && sprint.clickup_list_id && sprint.clickup_list_id !== projectBoardId;
      if (listDiff) {
        await updateProject(activeProject.id, { clickup_list_id: sprint.clickup_list_id });
        const clickupConn = activeProject.connections?.find((c) => c.provider === 'clickup' && c.sync_enabled);
        if (clickupConn) {
          await updateProjectConnection(activeProject.id, clickupConn.id, { external_board_id: sprint.clickup_list_id });
        }
        await syncProject(activeProject.id);
        await refreshProjects();
        queryClient.invalidateQueries({ queryKey: queryKeys.sprints(activeProject.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      }
      const detail = await getSprint(activeProject.id, sprint.id);
      setActiveSprint(detail);
      await refreshBoardStructure();
    } catch {
      // keep current sprint
    } finally {
      setSprintSwitching(false);
    }
  };

  const hasProvider = !!getProjectProvider(activeProject);

  const handleBoardDropdownToggle = async () => {
    if (boardDropdownOpen) {
      setBoardDropdownOpen(false);
      return;
    }
    if (!activeProject || !hasProvider) return;
    setBoardDropdownOpen(true);
    setBoardDropdownLoading(true);
    try {
      const hierarchy = await getProjectHierarchy(activeProject.id);
      const items = flattenHierarchy(hierarchy).filter(
        (i) => i.type === 'list' || i.type === 'board' || i.type === 'project',
      );
      setBoardItems(items);
    } catch {
      setBoardItems([]);
    } finally {
      setBoardDropdownLoading(false);
    }
  };

  const handleBoardSwitch = async (item: HierarchyItem) => {
    if (!activeProject || item.is_active) return;
    setBoardSwitching(true);
    setBoardDropdownOpen(false);
    try {
      await syncProject(activeProject.id);
      window.location.reload();
    } catch {
      // ignore
    } finally {
      setBoardSwitching(false);
    }
  };

  // ─── Notifications ────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchNotifs = () => {
      getInAppUnreadCount().then(r => setUnreadCount(r.count)).catch((err) => console.error('Failed to fetch unread count', err));
      getInAppNotifications(10).then(setLiveNotifications).catch((err) => console.error('Failed to fetch notifications', err));
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllInAppNotificationsRead();
      setUnreadCount(0);
      setLiveNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    } catch { /* ignore */ }
  };

  const handleNotifClick = async (n: InAppNotification) => {
    if (!n.read_at) {
      try {
        await markInAppNotificationRead(n.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setLiveNotifications(prev => prev.map(nn => nn.id === n.id ? { ...nn, read_at: new Date().toISOString() } : nn));
      } catch { /* ignore */ }
    }
    if (n.link && isSafeNotificationLink(n.link)) {
      setNotifOpen(false);
      window.location.href = n.link;
    }
  };

  // ─── Derived display values ───────────────────────────────────────────────

  const isNameEmail = userName.includes('@');
  const displayName = isNameEmail
    ? userName.split('@')[0].split(/[._-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : userName || 'User';
  const displayEmail = userEmail || 'user@example.com';
  const displayOrg = orgName || 'Organization';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const syncInfo = getSyncStatus(activeProject?.last_synced_at);
  const providerLabel = getProviderLabel(activeProject);
  const providerColor = getProviderColor(activeProject);
  const sprintDates = formatSprintDates(activeSprint?.start_date, activeSprint?.end_date);

  const resolvedRole: UserRole = (userRole === 'admin' || userRole === 'editor' || userRole === 'viewer') ? userRole : 'viewer';
  const roleMeta = ROLE_META[resolvedRole];
  const RoleIcon = roleMeta.icon;

  const closeAll = () => {
    setProjectOpen(false);
    setNotifOpen(false);
    setUserOpen(false);
    setSprintDropdownOpen(false);
    setBoardDropdownOpen(false);
    setOpenDropdown(null);
  };

  function isTabActive(tab: NavTab): boolean {
    if (tab.href) {
      return tab.href === '/dashboard'
        ? pathname === '/dashboard'
        : pathname.startsWith(tab.href);
    }
    if (tab.children) {
      return tab.children.some(c =>
        c.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(c.href)
      );
    }
    return false;
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <header className="relative z-30 shrink-0 border-b border-border/60 bg-card/95 text-foreground shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <div className="flex items-center h-14 px-4 lg:px-6">
        {/* ── Left: Logo ── */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-lg px-1 -ml-1 transition-colors hover:bg-secondary/70"
          >
            <div className="w-8 h-8 rounded-xl bg-primary/12 flex items-center justify-center border border-primary/25 transition-colors hover:bg-primary/18">
              <Hexagon className="w-4.5 h-4.5 text-primary" strokeWidth={2.2} />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground hidden sm:inline">
              Atlas
            </span>
          </Link>
        </div>

        {/* ── Center: Pill-Group Tab Navigation with 3D Icons ── */}
        <div className="hidden lg:flex flex-1 justify-center">
          <nav ref={navDropdownRef} className="flex items-center">
            <div className="nav-pill-group">
            {NAV_TABS.map((tab) => {
              const active = isTabActive(tab);
              const hasDropdown = !!tab.children;
              const isOpen = openDropdown === tab.label;

              return (
                <div key={tab.label} className="relative group">
                  {hasDropdown ? (
                    <button
                      onClick={() => {
                        setOpenDropdown(isOpen ? null : tab.label);
                      }}
                      aria-haspopup="true"
                      aria-expanded={isOpen}
                      className={clsx(
                        'flex items-center gap-1',
                        active ? 'nav-tab-active' : 'nav-tab',
                      )}
                    >
                      {tab.label}
                      <ChevronDown className={clsx('w-3 h-3 transition-transform', isOpen && 'rotate-180')} />
                    </button>
                  ) : (
                    <Link
                      href={tab.href!}
                      className={active ? 'nav-tab-active' : 'nav-tab'}
                    >
                      {tab.label}
                    </Link>
                  )}

                  {/* Dropdown for tabs with children */}
                  <AnimatePresence>
                    {hasDropdown && isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.96 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className={clsx(
                          'absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-card rounded-2xl border border-border/70 shadow-xl z-50 origin-top overflow-hidden',
                          tab.columns === 2 ? 'w-[520px]' : 'w-[320px]',
                        )}
                        role="menu"
                      >
                        {/* Dropdown header */}
                        <div className="px-5 pt-4 pb-3 border-b border-border/40">
                          <p className="text-sm font-bold text-foreground">{tab.label}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {tab.label === 'Sprint' && 'Plan, track, and review your sprints'}
                            {tab.label === 'Notes' && 'Standups, meetings, and planning'}
                            {tab.label === 'Insights' && 'Analytics, backlog, and capacity'}
                            {tab.label === 'Workspace' && 'Projects, team, and integrations'}
                          </p>
                        </div>

                        {/* Dropdown items */}
                        <div className={clsx(
                          'p-3',
                          tab.columns === 2 ? 'grid grid-cols-2 gap-1' : 'flex flex-col gap-1',
                        )}>
                          {tab.children!.map((child) => {
                            const CIcon = child.icon;
                            const childActive = pathname.startsWith(child.href);
                            const locked = isRouteLocked(child.href, tier);
                            return (
                              <Link
                                key={child.href}
                                href={locked ? '#' : child.href}
                                role="menuitem"
                                onClick={(e) => {
                                  if (locked) e.preventDefault();
                                  setOpenDropdown(null);
                                }}
                                className={clsx(
                                  'group/item flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150',
                                  locked
                                    ? 'text-muted-foreground/50 cursor-not-allowed'
                                    : childActive
                                      ? 'bg-primary/8 ring-1 ring-primary/15'
                                      : 'hover:bg-secondary/80',
                                )}
                              >
                                <CIcon className={clsx(
                                  'w-4 h-4 shrink-0',
                                  locked ? 'text-muted-foreground/40' : childActive ? 'text-primary' : 'text-muted-foreground',
                                )} strokeWidth={1.8} />
                                <div className="flex-1 min-w-0">
                                  <span className={clsx(
                                    'block text-[13px] font-semibold leading-tight',
                                    locked ? 'text-muted-foreground/50' : childActive ? 'text-primary' : 'text-foreground',
                                  )}>
                                    {child.label}
                                  </span>
                                  {child.desc && (
                                    <span className="block text-[11px] text-muted-foreground leading-tight mt-0.5">{child.desc}</span>
                                  )}
                                </div>
                                {locked && (
                                  <span className="flex items-center gap-0.5 shrink-0">
                                    <Lock className="w-2.5 h-2.5 opacity-50" />
                                    <span className="text-[8px] font-bold uppercase px-1 py-[1px] rounded bg-muted text-muted-foreground/60">
                                      {getRequiredTierLabel(getRouteGate(child.href)?.minTier ?? 'pro')}
                                    </span>
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>

                        {/* Dropdown footer */}
                        <div className="px-5 py-3 border-t border-border/40 bg-secondary/30">
                          <Link
                            href={tab.label === 'Sprint' ? '/sprint/plan' : tab.label === 'Notes' ? '/standups' : tab.label === 'Insights' ? '/analytics' : '/projects'}
                            onClick={() => setOpenDropdown(null)}
                            className="text-[11px] font-semibold text-primary hover:text-primary/80"
                          >
                            {tab.label === 'Sprint' && 'Go to Sprint Planning →'}
                            {tab.label === 'Notes' && 'View all notes →'}
                            {tab.label === 'Insights' && 'Open Analytics →'}
                            {tab.label === 'Workspace' && 'Manage Workspace →'}
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
            </div>
          </nav>
        </div>

        {/* ── Right: Actions ── */}
        <div className="flex items-center gap-2 shrink-0">
          {onSearchOpen && (
            <button
              onClick={onSearchOpen}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/70 border border-border/70 text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-border transition-all text-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-background border border-border text-[10px] font-semibold text-muted-foreground">
                ⌘K
              </kbd>
            </button>
          )}

          {activeProject && providerLabel !== 'No board' && (
            <button
              onClick={() => { if (isDemo) return; setExplorerOpen(true); closeAll(); }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label={`Open ${providerLabel}`}
            >
              <ExternalLink className="w-4.5 h-4.5" />
            </button>
          )}

          {/* User avatar */}
          <div ref={userRef} className="relative hidden sm:flex items-center gap-2 pl-1">
            <button
              onClick={() => { setUserOpen(!userOpen); setProjectOpen(false); setNotifOpen(false); setOpenDropdown(null); }}
              className="flex items-center gap-1 p-0.5 rounded-full hover:bg-secondary transition-colors ring-1 ring-transparent hover:ring-border"
              aria-label="User menu"
              aria-haspopup="true"
              aria-expanded={userOpen}
            >
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {initials}
              </div>
            </button>

            <AnimatePresence>
              {userOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-full right-0 mt-1 w-[240px] bg-card rounded-xl border border-border shadow-xl z-50 origin-top-right"
                  role="menu"
                >
                  <div className="px-3 py-3 border-b border-border/60">
                    <Link href="/profile" onClick={() => setUserOpen(false)} className="flex items-center gap-2.5 group">
                      <div className="w-9 h-9 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">{initials}</div>
                      <div>
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{displayName}</p>
                        <p className="text-[11px] text-muted-foreground">{displayEmail}</p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[10px] font-semibold text-secondary-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">{displayOrg}</span>
                      <span className={clsx('text-[10px] font-semibold px-1.5 py-0.5 rounded border', roleMeta.color)}>
                        {roleMeta.label}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-border/60 py-1">
                    {[
                      { label: 'Profile', icon: User, href: '/profile' },
                      { label: 'Keyboard Shortcuts', icon: Keyboard, href: '#' },
                      { label: 'Help & Support', icon: HelpCircle, href: '#' },
                      { label: 'Settings', icon: Settings, href: '/settings' },
                    ].map(item => (
                      <Link key={item.label} href={item.href} role="menuitem" onClick={() => setUserOpen(false)} className="flex items-center gap-2 px-3 py-1.5 text-xs text-secondary-foreground hover:bg-secondary transition-colors">
                        <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-border/60 py-1">
                    <button onClick={handleLogout} role="menuitem" className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-destructive hover:bg-destructive/5 transition-colors">
                      <LogOut className="w-3.5 h-3.5" />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileNavOpen(true)}
            className="lg:hidden p-2.5 -m-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Context Bar: Project/Sprint ── */}
      <div className="hidden md:flex items-center h-10 px-4 lg:px-6 bg-dashboard-surface-muted/80 text-foreground border-t border-border/50">
        <div className="flex items-center gap-3 min-w-0">
          {projectsLoading ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-muted animate-pulse" />
              <span className="h-3.5 w-20 rounded bg-muted animate-pulse" />
            </div>
          ) : activeProject ? (
            <>
              <div ref={projectRef} className="relative flex items-center gap-0.5">
                <button
                  onClick={() => { if (isDemo) return; closeAll(); setProjectOpen(!projectOpen); }}
                  className={clsx('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors text-xs', isDemo ? 'cursor-default' : 'hover:bg-secondary/80')}
                >
                  <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', SYNC_DOT[syncInfo.status])} />
                  <span className="font-medium text-foreground truncate max-w-[140px]">{activeProject.name}</span>
                  {providerLabel !== 'No board' && (
                    <span className={clsx('text-[8px] font-bold text-white px-1 py-[0.5px] rounded shrink-0', providerColor)}>
                      {providerLabel}
                    </span>
                  )}
                  <ChevronDown className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                </button>

                <AnimatePresence>
                  {projectOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute top-full left-0 mt-1 w-[360px] max-w-[calc(100vw-2rem)] bg-card rounded-xl border border-border shadow-xl z-50 origin-top-left"
                    >
                      <div className="px-3 py-2.5 border-b border-border/60">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">Projects</p>
                      </div>
                      <div className="py-1 max-h-[280px] overflow-y-auto">
                        {projects.map((p) => {
                          const pSync = getSyncStatus(p.last_synced_at);
                          const pLabel = getProviderLabel(p);
                          const pColor = getProviderColor(p);
                          return (
                            <button
                              key={p.id}
                              onClick={() => handleProjectSwitch(p)}
                              className={clsx(
                                'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-secondary',
                                p.id === activeProject?.id && 'bg-secondary/60',
                              )}
                            >
                              <span className={clsx('w-2 h-2 rounded-full shrink-0', SYNC_DOT[pSync.status])} />
                              <span className="text-sm text-foreground truncate">{p.name}</span>
                              {pLabel !== 'No board' && (
                                <span className={clsx('ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded text-white shrink-0', pColor)}>{pLabel}</span>
                              )}
                              {p.id === activeProject?.id && (
                                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div className="border-t border-border/60 px-3 py-2">
                        <Link href="/projects" onClick={() => setProjectOpen(false)} className="flex items-center gap-2 text-xs text-primary hover:text-primary font-medium transition-colors">
                          <FolderKanban className="w-3.5 h-3.5" />
                          Manage all projects
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <span className="w-px h-4 bg-border/60" />

              <div ref={sprintDropdownRef} className="relative">
                <button
                  onClick={() => { if (isDemo || sprintSwitching) return; handleSprintDropdownToggle(); }}
                  disabled={sprintSwitching}
                  className={clsx('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors text-xs', isDemo ? 'cursor-default' : sprintSwitching ? 'opacity-80' : 'hover:bg-secondary/80')}
                >
                  {sprintSwitching ? (
                    <Loader2 className="w-3 h-3 text-primary shrink-0 animate-spin" />
                  ) : (
                    <CalendarRange className="w-3 h-3 text-primary shrink-0" />
                  )}
                  {sprintSwitching ? (
                    <span className="text-muted-foreground italic">Switching...</span>
                  ) : activeSprint?.name ? (
                    <span className="font-medium text-foreground truncate max-w-[160px]">{activeSprint.name}</span>
                  ) : (
                    <span className="text-muted-foreground italic">No sprint</span>
                  )}
                  {!sprintSwitching && sprintDates && (
                    <span className="hidden lg:inline text-[10px] text-muted-foreground shrink-0">{sprintDates}</span>
                  )}
                  {!sprintSwitching && <ChevronsUpDown className="w-2.5 h-2.5 text-muted-foreground shrink-0" />}
                </button>

                {sprintDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-[320px] max-w-[calc(100vw-2rem)] bg-card rounded-xl border border-border shadow-xl z-50">
                    <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/60">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">Sprints</p>
                      {sprintCycleInfo && sprintCycleInfo.cycleType !== 'unknown' && (
                        <span className={clsx(
                          'text-[9px] font-semibold px-1.5 py-[1px] rounded border',
                          sprintCycleInfo.isConsistent
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-warning/10 text-warning border-warning/20',
                        )}>
                          {cycleShortLabel(sprintCycleInfo)}
                        </span>
                      )}
                    </div>
                    <div className="py-1 max-h-[280px] overflow-y-auto">
                      {sprintListLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        </div>
                      ) : sprintList.length === 0 ? (
                        <div className="py-6 text-center text-xs text-muted-foreground">No sprints found</div>
                      ) : (
                        (['active', 'planning', 'completed'] as const).map((status) => {
                          const filtered = sprintList.filter((s) => s.status === status);
                          if (filtered.length === 0) return null;
                          return (
                            <div key={status}>
                              <p className="px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-secondary-foreground">
                                {status}
                              </p>
                              {filtered.map((s) => (
                                <button
                                  key={s.id}
                                  onClick={() => handleInlineSprintSelect(s)}
                                  className={clsx(
                                    'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-secondary',
                                    activeSprint?.id === s.id && 'bg-secondary/60',
                                  )}
                                >
                                  <CalendarRange className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                  <span className="text-sm text-foreground truncate">{s.name}</span>
                                  {s.start_date && s.end_date && (
                                    <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                                      {formatSprintDates(s.start_date, s.end_date)}
                                    </span>
                                  )}
                                  {activeSprint?.id === s.id && (
                                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                                  )}
                                </button>
                              ))}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <span className="w-px h-4 bg-border/60" />

              <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className={clsx('w-1.5 h-1.5 rounded-full', SYNC_DOT[syncInfo.status], syncInfo.status === 'live' && 'animate-pulse')} />
                Synced {syncInfo.label}
              </div>
            </>
          ) : (
            <Link href="/projects" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Set up a project</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── Mobile Slide-out Sheet ── */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[300px] sm:w-[340px] p-0 overflow-hidden flex flex-col">
          <SheetHeader className="px-4 pt-5 pb-3 border-b border-border/60 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Hexagon className="w-4.5 h-4.5 text-primary" strokeWidth={2.2} />
              </div>
              <SheetTitle className="text-base font-bold tracking-tight">
                Atlas
              </SheetTitle>
            </div>
          </SheetHeader>

          {/* Product switcher — LOOP (revenue) & SIGNAL; matches desktop SideNav */}
          <div className="px-4 py-3 border-b border-border/40 bg-secondary/20">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">
              Switch product
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: 'loop' as const, label: 'LOOP', Icon: Repeat },
                  { key: 'signal' as const, label: 'SIGNAL', Icon: Wifi },
                ] as const
              ).map(({ key, label, Icon }) => {
                const to = productDashboardUrl(config.productUrls[key]);
                if (to === '#') return null;
                return (
                  <a
                    key={key}
                    href={to}
                    rel="noopener noreferrer"
                    onClick={() => setMobileNavOpen(false)}
                    className="inline-flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                    {label}
                    <ExternalLink className="w-3 h-3 shrink-0 opacity-50" aria-hidden />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Project context in mobile sheet */}
          {activeProject && (
            <div className="px-4 py-3 border-b border-border/40 bg-secondary/30">
              <div className="flex items-center gap-2 mb-1">
                <span className={clsx('w-2 h-2 rounded-full shrink-0', SYNC_DOT[syncInfo.status])} />
                <span className="text-sm font-medium text-foreground truncate">{activeProject.name}</span>
                {providerLabel !== 'No board' && (
                  <span className={clsx('text-[9px] font-bold text-white px-1 py-[1px] rounded shrink-0', providerColor)}>
                    {providerLabel}
                  </span>
                )}
              </div>
              {activeSprint?.name && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarRange className="w-3 h-3 text-primary" />
                  <span className="truncate">{activeSprint.name}</span>
                </div>
              )}
            </div>
          )}

          {/* Navigation sections */}
          <nav className="flex-1 overflow-y-auto px-2 py-3">
            {MOBILE_NAV_SECTIONS.map((section, sIdx) => (
              <div key={section.title} className={clsx(sIdx > 0 && 'mt-4 pt-3 border-t border-border/20')}>
                <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    const locked = isRouteLocked(item.href, tier);

                    return (
                      <Link
                        key={item.href}
                        href={locked ? '#' : item.href}
                        onClick={(e) => {
                          if (locked) {
                            e.preventDefault();
                            return;
                          }
                          setMobileNavOpen(false);
                        }}
                        className={clsx(
                          'relative flex items-center gap-2.5 px-2.5 py-2.5 text-[13px] rounded-xl transition-all duration-150',
                          locked
                            ? 'text-muted-foreground/50 cursor-not-allowed'
                            : isActive
                              ? 'bg-primary/5 text-primary font-semibold ring-1 ring-primary/10'
                              : 'text-secondary-foreground hover:text-foreground hover:bg-secondary',
                        )}
                      >
                        {isActive && (
                          <span className="absolute left-0 w-[3px] h-5 rounded-r-full bg-primary" />
                        )}
                        <span className={clsx('nav-icon-3d-sm', item.iconColor)}>
                          <Icon className="w-3 h-3 text-white relative z-[1]" strokeWidth={2.2} />
                        </span>
                        <span className="flex-1 truncate">{item.label}</span>
                        {locked && (
                          <span className="flex items-center gap-0.5 shrink-0">
                            <Lock className="w-2.5 h-2.5 opacity-50" />
                            <span className="text-[8px] font-bold uppercase px-1 py-[1px] rounded bg-muted text-muted-foreground/60">
                              {getRequiredTierLabel(getRouteGate(item.href)?.minTier ?? 'pro')}
                            </span>
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User info at bottom of sheet */}
          <div className="border-t border-border/40 px-4 py-3 shrink-0 bg-background">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{displayEmail}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href="/settings"
                onClick={() => setMobileNavOpen(false)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium text-secondary-foreground bg-secondary hover:bg-secondary/80 transition-colors min-h-[44px]"
              >
                <Settings className="w-3.5 h-3.5" />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium text-destructive bg-destructive/5 hover:bg-destructive/10 transition-colors min-h-[44px]"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sprint picker modal */}
      {pendingSwitch && (switchLoading || switchData) && (
        <SprintPickerModal
          project={pendingSwitch}
          sprints={switchData?.sprints ?? []}
          boardStructure={switchData?.boardStructure ?? null}
          loading={switchLoading}
          switching={sprintSwitching}
          onSelect={handleSprintSelected}
          onClose={handleSprintModalClose}
        />
      )}

      {/* Board explorer modal */}
      {explorerOpen && activeProject && (
        <BoardExplorerModal
          project={activeProject}
          onPlanSprint={() => {
            setExplorerOpen(false);
            window.location.href = '/sprint/plan';
          }}
          onSkip={() => {
            setExplorerOpen(false);
            window.location.href = '/sprint/plan';
          }}
          onClose={() => setExplorerOpen(false)}
        />
      )}
    </header>
  );
}
