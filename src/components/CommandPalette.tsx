'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  Clock,
  ArrowRight,
  Hexagon,
  Ticket,
  Calendar,
  User,
  Users,
  LayoutDashboard,
  TrendingDown,
  Trophy,
  Gauge,
  History,
  RotateCcw,
  ClipboardList,
  FileText,
  Layers,
  BarChart3,
  PieChart,
  Settings,
  MessageSquare,
  Zap,
  DollarSign,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  Command,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  X,
  Shield,
  Globe,
  Plug,
  FolderKanban,
  Video,
  Activity,
  GitBranch,
  GitPullRequest,
  UserCircle,
  Bell,
  Network,
  Sparkles,
} from 'lucide-react';
import { searchAll, searchSuggest, type SearchResponse, type SearchResultGroup as APIGroup, type SearchResult as APIResult, type SearchSuggestions, type SuggestResponse } from '@/lib/api';
import { config } from '@/lib/config';
import { useProject } from '@/lib/project-context';
import { useTeamMembers, useTickets, useSprints } from '@/lib/queries';

// ─── Types ───────────────────────────────────────────────────────────────────

type SearchCategory = 'ticket' | 'sprint' | 'team' | 'page' | 'cross-product' | 'external';

type ProductName = 'ATLAS' | 'LOOP' | 'PHANTOM' | 'SIGNAL' | 'NEXUS';

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: SearchCategory;
  product: ProductName;
  href: string;
  icon: React.ElementType;
  external?: boolean;
  tags: string[];
}

interface RecentSearch {
  query: string;
  subtitle: string;
}

interface QuickAction {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface ProductNav {
  name: ProductName;
  href: string;
  active: boolean;
  comingSoon: boolean;
}

// ─── Product Colors ──────────────────────────────────────────────────────────

const productColors: Record<ProductName, string> = {
  ATLAS: 'var(--primary)',
  LOOP: '#22C55E',
  PHANTOM: '#a855f7',
  SIGNAL: '#ef4444',
  NEXUS: '#22c55e',
};

function productBgColor(product: ProductName, alphaHex: string): string {
  if (product === 'ATLAS') {
    const opacity = (parseInt(alphaHex, 16) / 255 * 100).toFixed(1);
    return `color-mix(in srgb, var(--primary) ${opacity}%, transparent)`;
  }
  return `${productColors[product]}${alphaHex}`;
}

// ─── Recent Searches (persisted in localStorage) ─────────────────────────────

const RECENT_SEARCHES_KEY = 'atlas_recent_searches';
const MAX_RECENT = 5;

function loadRecentSearches(): RecentSearch[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  try {
    const existing = loadRecentSearches();
    const filtered = existing.filter(s => s.query !== query);
    const updated = [{ query, subtitle: 'Search' }, ...filtered].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

function clearRecentSearches(): void {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // ignore
  }
}

const WELCOME_SETUP_HREF = '__atlas_open_welcome__';

const quickActions: QuickAction[] = [
  { label: 'Welcome & trial setup', href: WELCOME_SETUP_HREF, icon: Sparkles },
  { label: 'Start Sprint Planning', href: '/sprint/plan', icon: Calendar },
  { label: 'View Burndown', href: '/sprint/burndown', icon: TrendingDown },
  { label: 'Team Scoreboard', href: '/sprint/scoreboard', icon: Trophy },
  { label: 'Open Backlog', href: '/backlog', icon: Layers },
  { label: 'Check Accuracy', href: '/accuracy', icon: Gauge },
  { label: 'Team Analytics', href: '/analytics', icon: PieChart },
  { label: 'Go to Settings', href: '/settings', icon: Settings },
];

function buildProductNav(): ProductNav[] {
  const loopUrl = config.productUrls.loop;
  const phantomUrl = config.productUrls.phantom;
  const signalUrl = config.productUrls.signal;
  const nexusUrl = config.productUrls.nexus;
  return [
    { name: 'ATLAS', href: '/dashboard', active: true, comingSoon: false },
    { name: 'LOOP', href: loopUrl && loopUrl !== '#' ? `${loopUrl}/dashboard` : '#', active: false, comingSoon: !loopUrl || loopUrl === '#' },
    { name: 'PHANTOM', href: phantomUrl && phantomUrl !== '#' ? `${phantomUrl}/dashboard` : '#', active: false, comingSoon: !phantomUrl || phantomUrl === '#' },
    { name: 'SIGNAL', href: signalUrl && signalUrl !== '#' ? `${signalUrl}/dashboard` : '#', active: false, comingSoon: !signalUrl || signalUrl === '#' },
    { name: 'NEXUS', href: nexusUrl && nexusUrl !== '#' ? '/nexus' : '#', active: false, comingSoon: !nexusUrl || nexusUrl === '#' },
  ];
}

// Static page navigation items (no fake data)
const staticPageIndex: SearchItem[] = [
  // ATLAS Pages
  { id: 'page-dashboard', title: 'Dashboard', subtitle: 'Sprint overview & metrics', category: 'page', product: 'ATLAS', href: '/dashboard', icon: LayoutDashboard, tags: ['dashboard', 'overview', 'metrics', 'home'] },
  { id: 'page-burndown', title: 'Burndown', subtitle: 'Sprint burndown chart', category: 'page', product: 'ATLAS', href: '/sprint/burndown', icon: TrendingDown, tags: ['burndown', 'chart', 'sprint'] },
  { id: 'page-accuracy', title: 'Accuracy', subtitle: 'Estimation accuracy tracking', category: 'page', product: 'ATLAS', href: '/accuracy', icon: Gauge, tags: ['accuracy', 'estimation', 'tracking'] },
  { id: 'page-history', title: 'History', subtitle: 'Sprint history & trends', category: 'page', product: 'ATLAS', href: '/history', icon: History, tags: ['history', 'trends', 'sprints'] },
  { id: 'page-retro', title: 'Retrospective', subtitle: 'Sprint retrospectives', category: 'page', product: 'ATLAS', href: '/retro', icon: RotateCcw, tags: ['retrospective', 'retro', 'review'] },
  { id: 'page-standups', title: 'Standups', subtitle: 'Daily standup summaries', category: 'page', product: 'ATLAS', href: '/standups', icon: ClipboardList, tags: ['standups', 'daily', 'summaries'] },
  { id: 'page-planning', title: 'Planning Notes', subtitle: 'Sprint planning documents', category: 'page', product: 'ATLAS', href: '/sprint/planning-notes', icon: FileText, tags: ['planning', 'notes', 'sprint'] },
  { id: 'page-sprint-plan', title: 'Sprint Plan', subtitle: 'Create and manage sprint plans', category: 'page', product: 'ATLAS', href: '/sprint/plan', icon: Calendar, tags: ['sprint', 'plan', 'planning', 'create'] },
  { id: 'page-scoreboard', title: 'Team Scoreboard', subtitle: 'Top performers and sprint strategy', category: 'page', product: 'ATLAS', href: '/sprint/scoreboard', icon: Trophy, tags: ['scoreboard', 'team', 'performer', 'gamified', 'strategy'] },
  { id: 'page-sprint-review', title: 'Sprint Plan Review', subtitle: 'Review generated sprint plans', category: 'page', product: 'ATLAS', href: '/sprint/plan/review', icon: ClipboardList, tags: ['sprint', 'plan', 'review', 'approve'] },
  { id: 'page-backlog', title: 'Backlog', subtitle: 'Product backlog management', category: 'page', product: 'ATLAS', href: '/backlog', icon: Layers, tags: ['backlog', 'tickets', 'management'] },
  { id: 'page-tickets', title: 'Tickets', subtitle: 'View and manage all tickets', category: 'page', product: 'ATLAS', href: '/tickets', icon: Ticket, tags: ['tickets', 'issues', 'bugs', 'tasks'] },
  { id: 'page-capacity', title: 'Capacity', subtitle: 'Team capacity planning', category: 'page', product: 'ATLAS', href: '/capacity', icon: BarChart3, tags: ['capacity', 'planning', 'team', 'bandwidth'] },
  { id: 'page-analytics', title: 'Analytics', subtitle: 'Team performance analytics', category: 'page', product: 'ATLAS', href: '/analytics', icon: PieChart, tags: ['analytics', 'performance', 'team', 'reports'] },
  { id: 'page-team', title: 'Team', subtitle: 'Team members & roles', category: 'page', product: 'ATLAS', href: '/team', icon: Users, tags: ['team', 'members', 'roles', 'people'] },
  { id: 'page-integrations', title: 'Integrations', subtitle: 'Connect tools & services', category: 'page', product: 'ATLAS', href: '/integrations', icon: Plug, tags: ['integrations', 'connect', 'jira', 'github', 'slack', 'miro', 'tools'] },
  { id: 'page-projects', title: 'Projects', subtitle: 'Project management & overview', category: 'page', product: 'ATLAS', href: '/projects', icon: FolderKanban, tags: ['projects', 'management', 'overview'] },
  { id: 'page-meetings', title: 'Meetings', subtitle: 'Meeting notes & summaries', category: 'page', product: 'ATLAS', href: '/meetings', icon: Video, tags: ['meetings', 'notes', 'summaries', 'standup'] },
  { id: 'page-activity', title: 'Activity', subtitle: 'Recent activity feed', category: 'page', product: 'ATLAS', href: '/activity', icon: Activity, tags: ['activity', 'feed', 'recent', 'log'] },
  { id: 'page-dependencies', title: 'Dependencies', subtitle: 'Ticket dependency graph', category: 'page', product: 'ATLAS', href: '/dependencies', icon: GitBranch, tags: ['dependencies', 'graph', 'blocking', 'blocked'] },
  { id: 'page-workflow', title: 'Workflows', subtitle: 'Automation workflows', category: 'page', product: 'ATLAS', href: '/workflow', icon: GitPullRequest, tags: ['workflow', 'automation', 'flows', 'pipelines'] },
  { id: 'page-automations', title: 'Automations', subtitle: 'Automated rules & triggers', category: 'page', product: 'ATLAS', href: '/automations', icon: Zap, tags: ['automations', 'rules', 'triggers', 'automated'] },
  { id: 'page-notifications', title: 'Notifications', subtitle: 'Alerts & notification center', category: 'page', product: 'ATLAS', href: '/notifications', icon: Bell, tags: ['notifications', 'alerts', 'inbox'] },
  { id: 'page-repos', title: 'Repositories', subtitle: 'Connected code repositories', category: 'page', product: 'ATLAS', href: '/repos', icon: GitBranch, tags: ['repos', 'repositories', 'code', 'git'] },
  { id: 'page-revenue', title: 'Revenue', subtitle: 'Revenue signals & impact', category: 'page', product: 'ATLAS', href: '/revenue', icon: DollarSign, tags: ['revenue', 'signals', 'impact', 'money'] },
  { id: 'page-stakeholder', title: 'Stakeholders', subtitle: 'Stakeholder reports & updates', category: 'page', product: 'ATLAS', href: '/stakeholder', icon: Globe, tags: ['stakeholder', 'reports', 'updates', 'executive'] },
  { id: 'page-security', title: 'Security', subtitle: 'Security dashboard & scanning', category: 'page', product: 'ATLAS', href: '/security', icon: Shield, tags: ['security', 'scanning', 'vulnerabilities', 'pii'] },
  { id: 'page-debt', title: 'Tech Debt', subtitle: 'Technical debt insights', category: 'page', product: 'ATLAS', href: '/insights/debt', icon: AlertTriangle, tags: ['debt', 'technical', 'insights', 'code quality'] },
  { id: 'page-complexity', title: 'Complexity', subtitle: 'Code complexity analysis', category: 'page', product: 'ATLAS', href: '/insights/complexity', icon: Network, tags: ['complexity', 'analysis', 'code', 'modules'] },
  { id: 'page-profile', title: 'Profile', subtitle: 'Your profile & preferences', category: 'page', product: 'ATLAS', href: '/profile', icon: UserCircle, tags: ['profile', 'account', 'preferences', 'user'] },
  { id: 'page-settings', title: 'Settings', subtitle: 'App configuration', category: 'page', product: 'ATLAS', href: '/settings', icon: Settings, tags: ['settings', 'configuration', 'preferences'] },
  { id: 'page-welcome-setup', title: 'Welcome & trial setup', subtitle: 'Reopen onboarding wizard', category: 'page', product: 'ATLAS', href: WELCOME_SETUP_HREF, icon: Sparkles, tags: ['welcome', 'onboarding', 'trial', 'setup', 'wizard', 'integrations'] },
  { id: 'page-settings-security', title: 'Security Settings', subtitle: 'Authentication & access controls', category: 'page', product: 'ATLAS', href: '/settings/security', icon: Shield, tags: ['settings', 'security', 'authentication', 'access', 'sso'] },
  { id: 'page-chat', title: 'AI Chat', subtitle: 'ATLAS AI assistant', category: 'page', product: 'ATLAS', href: '/chat', icon: MessageSquare, tags: ['ai', 'chat', 'assistant'] },
  // NEXUS Pages
  { id: 'page-nexus', title: 'Nexus', subtitle: 'Cross-product intelligence hub', category: 'page', product: 'NEXUS', href: '/nexus', icon: Hexagon, tags: ['nexus', 'hub', 'intelligence', 'cross-product'] },
];

// ─── Grouped result types ────────────────────────────────────────────────────

interface ResultGroup {
  label: string;
  items: SearchItem[];
}

// ─── API result adapter ──────────────────────────────────────────────────────

const entityTypeIcons: Record<string, React.ElementType> = {
  ticket: Ticket,
  sprint: Calendar,
  team: User,
  page: LayoutDashboard,
  command: Zap,
  feature: DollarSign,
  debt_item: AlertTriangle,
  incident: AlertCircle,
  account: Globe,
  signal: Zap,
  security: Shield,
};

function apiResultToSearchItem(r: APIResult): SearchItem {
  const prodMap: Record<string, ProductName> = {
    atlas: 'ATLAS', loop: 'LOOP', phantom: 'PHANTOM', signal: 'SIGNAL', nexus: 'NEXUS',
  };
  const catMap: Record<string, SearchCategory> = {
    ticket: 'ticket', sprint: 'sprint', team: 'team', page: 'page',
    command: 'page', feature: 'cross-product', debt_item: 'cross-product',
    incident: 'cross-product', account: 'cross-product', signal: 'cross-product',
  };
  return {
    id: r.id || r.entity_id,
    title: r.title,
    subtitle: r.subtitle,
    category: catMap[r.entity_type] || 'page',
    product: prodMap[r.product] || 'ATLAS',
    href: r.links.voatomy || '#',
    icon: entityTypeIcons[r.entity_type] || Layers,
    external: !!r.links.external,
    tags: [r.title.toLowerCase(), r.subtitle?.toLowerCase() || ''],
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShortcutsOpen?: () => void;
}

export default function CommandPalette({ open, onOpenChange, onShortcutsOpen }: CommandPaletteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { activeProject } = useProject();
  const projectId = activeProject?.id ?? null;
  const { data: teamMembers = [] } = useTeamMembers(projectId);
  const { data: tickets = [] } = useTickets(projectId);
  const { data: sprints = [] } = useSprints(projectId);

  const productNav = useMemo(() => buildProductNav(), []);

  const projectSearchIndex = useMemo((): SearchItem[] => {
    const items: SearchItem[] = [];
    for (const t of tickets.slice(0, 50)) {
      const pts = t.human_points ?? t.ai_points ?? 0;
      const tagParts = [t.title.toLowerCase(), t.id?.toLowerCase() ?? '', t.external_id?.toLowerCase() ?? ''];
      if (pts) tagParts.push(`${pts}pts`);
      items.push({
        id: `ticket-${t.id}`,
        title: t.external_id || t.id,
        subtitle: `${t.title.slice(0, 50)}${t.title.length > 50 ? '…' : ''} · ${pts}pts`,
        category: 'ticket',
        product: 'ATLAS',
        href: t.external_url || '/backlog',
        icon: Ticket,
        external: !!t.external_url,
        tags: tagParts.filter(Boolean),
      });
    }
    for (const s of sprints.slice(0, 20)) {
      const pts = s.planned_points ?? s.actual_points ?? 0;
      items.push({
        id: `sprint-${s.id}`,
        title: s.name,
        subtitle: `${pts}pts · ${s.status}`,
        category: 'sprint',
        product: 'ATLAS',
        href: s.status === 'active' ? '/dashboard' : '/history',
        icon: Calendar,
        tags: ['sprint', s.name.toLowerCase(), `${pts}pts`, s.status],
      });
    }
    for (const m of teamMembers.slice(0, 20)) {
      const name = m.name || m.email || m.id;
      items.push({
        id: `team-${m.id}`,
        title: name,
        subtitle: m.role || 'Team member',
        category: 'team',
        product: 'ATLAS',
        href: '/team',
        icon: User,
        tags: [name.toLowerCase(), m.role?.toLowerCase() ?? '', ...(m.email?.toLowerCase().split('@')[0] ? [m.email.split('@')[0]] : [])],
      });
    }
    return items;
  }, [tickets, sprints, teamMembers]);

  const searchIndex = useMemo(
    () => [...staticPageIndex, ...projectSearchIndex],
    [projectSearchIndex]
  );

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [backendGroups, setBackendGroups] = useState<ResultGroup[]>([]);
  const [searchLatency, setSearchLatency] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestions | null>(null);
  const [searchError, setSearchError] = useState(false);
  const [typeaheadSuggestions, setTypeaheadSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setIsClosing(false);
      setBackendGroups([]);
      setSearchLatency(null);
      setSuggestions(null);
      setSearchError(false);
      setTypeaheadSuggestions([]);
      setRecentSearches(loadRecentSearches());
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Debounced backend search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setBackendGroups([]);
      setSearchLatency(null);
      setSuggestions(null);
      setSearchError(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(false);
      try {
        const resp = await searchAll({
          query: query.trim(),
          context: {
            current_product: 'atlas',
            current_page: pathname,
            source: 'command_palette',
          },
          options: { limit: 20, highlight: true },
        });
        const mapped: ResultGroup[] = resp.groups.map((g) => ({
          label: g.name,
          items: g.results.map(apiResultToSearchItem),
        }));
        setBackendGroups(mapped);
        setSearchLatency(resp.meta.latency_ms);
        setSuggestions(resp.suggestions ?? null);
        if (mapped.some(g => g.items.length > 0)) {
          setRecentSearches(saveRecentSearch(query.trim()));
        }
      } catch {
        setSearchError(true);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, pathname]);

  // Typeahead suggestions via searchSuggest (shorter debounce)
  useEffect(() => {
    if (!query.trim() || query.trim().length < 1) {
      setTypeaheadSuggestions([]);
      return;
    }

    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);

    suggestDebounceRef.current = setTimeout(async () => {
      try {
        const resp = await searchSuggest(query.trim(), 5);
        setTypeaheadSuggestions(resp.suggestions.map(s => s.text));
      } catch {
        setTypeaheadSuggestions([]);
      }
    }, 100);

    return () => {
      if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    };
  }, [query]);

  // Close helper with animation
  const close = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onOpenChange(false);
    }, 120);
  }, [onOpenChange]);

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) {
          close();
        } else {
          onOpenChange(true);
        }
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, close, onOpenChange]);

  // ── Search Logic ────────────────────────────────────────────────────────

  const filteredResults = useMemo((): ResultGroup[] => {
    if (!query.trim()) return [];

    let q = query.trim().toLowerCase();
    let filtered = searchIndex;

    // Filter prefixes
    if (q.startsWith('>')) {
      // Commands/actions only - return quick actions as results
      const actionQuery = q.slice(1).trim();
      const actionResults: SearchItem[] = quickActions
        .filter(a => a.label.toLowerCase().includes(actionQuery))
        .map((a, i) => ({
          id: `action-${i}`,
          title: a.label,
          subtitle: 'Quick Action',
          category: 'page' as SearchCategory,
          product: 'ATLAS' as ProductName,
          href: a.href,
          icon: a.icon,
          tags: a.label.toLowerCase().split(' '),
        }));
      return actionResults.length > 0 ? [{ label: 'Commands', items: actionResults }] : [];
    }

    if (q.startsWith('@atlas')) {
      q = q.replace('@atlas', '').trim();
      filtered = filtered.filter(item => item.product === 'ATLAS');
    }

    if (q.startsWith('t:')) {
      q = q.slice(2).trim();
      filtered = filtered.filter(item => item.category === 'ticket');
    }

    if (q.startsWith('p:')) {
      q = q.slice(2).trim();
      filtered = filtered.filter(item => item.category === 'page');
    }

    // Full text search
    if (q) {
      filtered = filtered.filter(item => {
        const searchable = [
          item.title.toLowerCase(),
          item.subtitle.toLowerCase(),
          ...item.tags,
        ].join(' ');
        return q.split(' ').every(word => searchable.includes(word));
      });
    }

    // Group results
    const groups: ResultGroup[] = [];

    // Top Results (first 3 most relevant)
    if (filtered.length > 3) {
      groups.push({ label: 'Top Results', items: filtered.slice(0, 3) });
    }

    // Pages
    const pageItems = filtered.filter(i => i.category === 'page');
    if (pageItems.length > 0) {
      groups.push({ label: 'Pages', items: pageItems.slice(0, 8) });
    }

    // Tickets, sprints, team (non-page ATLAS items)
    const atlasItems = filtered.filter(i => i.product === 'ATLAS' && i.category !== 'external' && i.category !== 'page');
    if (atlasItems.length > 0) {
      groups.push({ label: 'ATLAS', items: atlasItems.slice(0, 8) });
    }

    // Cross-Product
    const crossItems = filtered.filter(i => i.category === 'cross-product');
    if (crossItems.length > 0) {
      groups.push({ label: 'Cross-Product', items: crossItems });
    }

    // External Tools
    const externalItems = filtered.filter(i => i.category === 'external');
    if (externalItems.length > 0) {
      groups.push({ label: 'External Tools', items: externalItems });
    }

    // If only a few results, just return them flat
    if (filtered.length <= 3) {
      return [{ label: 'Results', items: filtered }];
    }

    return groups;
  }, [query]);

  // Merge backend results with client-side results, preferring backend when available
  const mergedResults = useMemo((): ResultGroup[] => {
    if (backendGroups.length > 0) {
      const clientIds = new Set(filteredResults.flatMap(g => g.items.map(i => i.id)));
      const backendOnly = backendGroups.map(g => ({
        ...g,
        items: g.items.filter(i => !clientIds.has(i.id)),
      })).filter(g => g.items.length > 0);

      if (backendOnly.length > 0) {
        return [...filteredResults, ...backendOnly];
      }
    }
    return filteredResults;
  }, [filteredResults, backendGroups]);

  // Flat list for keyboard navigation
  const flatItems = useMemo(() => {
    return mergedResults.flatMap(g => g.items);
  }, [mergedResults]);

  // Clamp selected index
  useEffect(() => {
    if (selectedIndex >= flatItems.length) {
      setSelectedIndex(Math.max(0, flatItems.length - 1));
    }
  }, [flatItems.length, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Navigate to result
  const navigateTo = useCallback((item: SearchItem | null) => {
    if (!item) return;
    close();
    if (item.external) {
      window.open(item.href, '_blank', 'noopener,noreferrer');
    } else if (item.href === WELCOME_SETUP_HREF) {
      window.dispatchEvent(new CustomEvent('atlas-open-welcome-setup'));
    } else {
      router.push(item.href);
    }
  }, [close, router]);

  // Navigate to quick action / recent
  const navigateToHref = useCallback((href: string) => {
    close();
    if (href === WELCOME_SETUP_HREF) {
      window.dispatchEvent(new CustomEvent('atlas-open-welcome-setup'));
      return;
    }
    router.push(href);
  }, [close, router]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const hasResults = query.trim() && flatItems.length > 0;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (hasResults) {
        setSelectedIndex(prev => (prev + 1) % flatItems.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (hasResults) {
        setSelectedIndex(prev => (prev - 1 + flatItems.length) % flatItems.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (hasResults && flatItems[selectedIndex]) {
        navigateTo(flatItems[selectedIndex]);
      }
    }
  }, [query, flatItems, selectedIndex, navigateTo]);

  if (!open) return null;

  // Track flat index across groups
  let flatIndex = 0;

  const cmdkText = '#f3f4f6';
  const cmdkMuted = '#9ca3af';

  return (
    <>
      {/* Overlay - click to close */}
      <div
        className="fixed inset-0 z-[100] cursor-pointer"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          animation: isClosing
            ? 'cmdkOverlayOut 120ms ease-in forwards'
            : 'cmdkOverlayIn 150ms ease-out forwards',
        }}
        onClick={close}
        aria-hidden="true"
      />

      {/* Modal wrapper - pointer-events:none so overlay receives clicks outside */}
      <div
        className="fixed inset-0 z-[101] flex items-start justify-center pointer-events-none"
        style={{ paddingTop: '12vh' }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search commands"
          className="pointer-events-auto"
          style={{
            width: 640,
            maxHeight: 560,
            borderRadius: 16,
            backgroundColor: '#15151f',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: isClosing
              ? 'cmdkClose 120ms ease-in forwards'
              : 'cmdkOpen 150ms ease-out forwards',
          }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          {/* Search Input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '16px 18px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Search
              style={{ width: 18, height: 18, color: cmdkMuted, flexShrink: 0 }}
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search pages, tickets, people..."
              role="combobox"
              aria-expanded="true"
              aria-haspopup="listbox"
              aria-controls="cmdk-listbox"
              aria-label="Search"
              aria-autocomplete="list"
              aria-activedescendant={query.trim() && flatItems.length > 0 ? `cmdk-item-${selectedIndex}` : undefined}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: 15,
                color: cmdkText,
                fontFamily: 'inherit',
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                borderRadius: 6,
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Command style={{ width: 12, height: 12, color: cmdkMuted }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: cmdkMuted }}>K</span>
            </div>
          </div>

          {/* Typeahead suggestions */}
          {query.trim().length >= 1 && typeaheadSuggestions.length > 0 && !mergedResults.length && !isSearching && (
            <div style={{ padding: '4px 16px 0', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {typeaheadSuggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => { setQuery(s); setSelectedIndex(0); }}
                  style={{
                    fontSize: 12,
                    padding: '3px 10px',
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    color: cmdkMuted,
                    cursor: 'pointer',
                    transition: 'all 120ms',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLElement).style.color = cmdkText; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.color = cmdkMuted; }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Search error banner */}
          {searchError && (
            <div style={{ padding: '6px 16px', fontSize: 12, color: cmdkMuted, backgroundColor: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
              Search service unavailable — showing local results
            </div>
          )}

          {/* Screen reader result count announcement */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {query.trim() && !isSearching && flatItems.length > 0 && `${flatItems.length} result${flatItems.length === 1 ? '' : 's'}`}
            {query.trim() && !isSearching && flatItems.length === 0 && 'No results'}
          </div>

          {/* Content Area */}
          <div
            ref={listRef}
            id="cmdk-listbox"
            role="listbox"
            aria-label="Search results"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '8px 8px 0 8px',
            }}
          >
            {/* ── Default State (no query) ───────────────────────── */}
            {!query.trim() && (
              <div>
                {/* Recent Searches */}
                <div style={{ padding: '4px 8px 6px', marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: cmdkMuted }}>
                    Recent Searches
                  </span>
                  {recentSearches.length > 0 && (
                    <button
                      onClick={() => { clearRecentSearches(); setRecentSearches([]); }}
                      style={{
                        fontSize: 11,
                        color: cmdkMuted,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0 2px',
                        transition: 'color 120ms',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = cmdkText; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = cmdkMuted; }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                {recentSearches.map((item, i) => (
                  <button
                    key={i}
                    className="cmdk-result-item"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      animationDelay: `${i * 30}ms`,
                      transition: 'background-color 120ms',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    }}
                    onClick={() => {
                      setQuery(item.query);
                      setSelectedIndex(0);
                      inputRef.current?.focus();
                    }}
                  >
                    <Clock style={{ width: 15, height: 15, color: cmdkMuted, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: cmdkText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.query}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: cmdkMuted, flexShrink: 0 }}>{item.subtitle}</span>
                  </button>
                ))}

                {/* Quick Actions */}
                <div style={{ padding: '12px 8px 6px', marginBottom: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: cmdkMuted }}>
                    Quick Actions
                  </span>
                </div>
                {quickActions.map((action, i) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={i}
                      className="cmdk-result-item"
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        animationDelay: `${(i + 3) * 30}ms`,
                        transition: 'background-color 120ms',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                      }}
                      onClick={() => navigateToHref(action.href)}
                    >
                      <Icon style={{ width: 15, height: 15, color: 'var(--primary)', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: cmdkText }}>
                        {action.label}
                      </span>
                      <ArrowRight style={{ width: 13, height: 13, color: cmdkMuted, flexShrink: 0 }} />
                    </button>
                  );
                })}

                {/* Product Navigation */}
                <div style={{ padding: '12px 8px 6px', marginBottom: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: cmdkMuted }}>
                    Product Navigation
                  </span>
                </div>
                {productNav.map((product, i) => (
                  <button
                    key={product.name}
                    className="cmdk-result-item"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'transparent',
                      cursor: product.comingSoon ? 'default' : 'pointer',
                      textAlign: 'left',
                      animationDelay: `${(i + 9) * 30}ms`,
                      opacity: product.comingSoon ? 0.5 : 1,
                      transition: 'background-color 120ms',
                    }}
                    onMouseEnter={(e) => {
                      if (!product.comingSoon) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    }}
                    onClick={() => {
                      if (!product.comingSoon) navigateToHref(product.href);
                    }}
                  >
                    <Hexagon
                      style={{
                        width: 15,
                        height: 15,
                        color: productColors[product.name],
                        flexShrink: 0,
                      }}
                      strokeWidth={2.5}
                    />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: product.active ? 'var(--primary)' : cmdkText }}>
                      {product.name}
                    </span>
                    {product.active && (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: 4,
                        backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)',
                        color: 'var(--primary)',
                      }}>
                        Active
                      </span>
                    )}
                    {product.comingSoon && (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: 4,
                        backgroundColor: '#1a1a2e',
                        color: cmdkMuted,
                        border: '1px solid #2a2a3a',
                      }}>
                        Coming Soon
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* ── Search Results ──────────────────────────────────── */}
            {query.trim() && mergedResults.length === 0 && !isSearching && (
              <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                <Search style={{ width: 32, height: 32, color: '#2a2a3a', margin: '0 auto 12px' }} />
                <div style={{ fontSize: 14, fontWeight: 500, color: cmdkMuted, marginBottom: 4 }}>
                  No results for &ldquo;{query}&rdquo;
                </div>
                {suggestions?.did_you_mean && (
                  <div style={{ fontSize: 13, color: cmdkMuted, marginBottom: 8 }}>
                    Did you mean{' '}
                    <button
                      onClick={() => { setQuery(suggestions.did_you_mean!); setSelectedIndex(0); }}
                      style={{ color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
                    >
                      {suggestions.did_you_mean}
                    </button>
                    ?
                  </div>
                )}
                <div style={{ fontSize: 12, color: 'var(--secondary-foreground)' }}>
                  Try <span style={{ color: cmdkMuted }}>p:</span> for pages, <span style={{ color: cmdkMuted }}>t:</span> for tickets, or <span style={{ color: cmdkMuted }}>&gt;</span> for commands
                </div>
              </div>
            )}

            {query.trim() && isSearching && mergedResults.length === 0 && (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <div style={{
                  width: 20, height: 20, border: '2px solid #2a2a3a', borderTopColor: 'var(--primary)',
                  borderRadius: '50%', margin: '0 auto 12px',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <div style={{ fontSize: 13, color: cmdkMuted }}>Searching...</div>
              </div>
            )}

            {query.trim() && mergedResults.map((group) => (
              <div key={group.label} role="group" aria-label={group.label} style={{ marginBottom: 6 }}>
                <div style={{ padding: '8px 8px 4px', marginBottom: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: cmdkMuted }}>
                    {group.label}
                  </span>
                </div>
                {group.items.map((item) => {
                  const currentFlatIndex = flatIndex;
                  flatIndex++;
                  const isSelected = currentFlatIndex === selectedIndex;
                  const Icon = item.icon;

                  return (
                    <button
                      key={`${group.label}-${item.id}`}
                      id={`cmdk-item-${currentFlatIndex}`}
                      data-selected={isSelected}
                      role="option"
                      aria-selected={isSelected}
                      className={`cmdk-result-item ${isSelected ? 'cmdk-selected' : ''}`}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: 'none',
                        background: isSelected ? 'color-mix(in srgb, var(--primary) 8%, transparent)' : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 120ms',
                      }}
                      onMouseEnter={(e) => {
                        setSelectedIndex(currentFlatIndex);
                        if (!isSelected) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        }
                      }}
                      onClick={() => navigateTo(item)}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: productBgColor(item.product, '15'),
                          flexShrink: 0,
                        }}
                      >
                        <Icon
                          style={{
                            width: 14,
                            height: 14,
                            color: productColors[item.product],
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: cmdkText,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {item.title}
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: cmdkMuted,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                        }}>
                          <span
                            style={{
                              display: 'inline-block',
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: 3,
                              backgroundColor: productBgColor(item.product, '20'),
                              color: productColors[item.product],
                              letterSpacing: '0.03em',
                            }}
                          >
                            {item.product}
                          </span>
                          <span>{item.subtitle}</span>
                        </div>
                      </div>
                      {item.external && (
                        <ExternalLink style={{ width: 13, height: 13, color: cmdkMuted, flexShrink: 0 }} />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}

            {/* Did you mean + Related queries (shown below results when available) */}
            {query.trim() && mergedResults.length > 0 && suggestions && (
              <div style={{ padding: '4px 8px 4px' }}>
                {suggestions.did_you_mean && (
                  <div style={{ fontSize: 12, color: cmdkMuted, marginBottom: 6 }}>
                    Did you mean{' '}
                    <button
                      onClick={() => { setQuery(suggestions.did_you_mean!); setSelectedIndex(0); }}
                      style={{ color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
                    >
                      {suggestions.did_you_mean}
                    </button>
                    ?
                  </div>
                )}
                {suggestions.related_queries.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: cmdkMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Related:</span>
                    {suggestions.related_queries.map((rq) => (
                      <button
                        key={rq}
                        onClick={() => { setQuery(rq); setSelectedIndex(0); }}
                        style={{
                          fontSize: 12,
                          padding: '2px 8px',
                          borderRadius: 5,
                          border: '1px solid #2a2a3a',
                          backgroundColor: '#1a1a2e',
                          color: cmdkMuted,
                          cursor: 'pointer',
                          transition: 'all 120ms',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLElement).style.color = cmdkText; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.color = cmdkMuted; }}
                      >
                        {rq}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bottom spacer */}
            <div style={{ height: 8 }} />
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            backgroundColor: 'rgba(0,0,0,0.2)',
            }}
          >
            {searchLatency !== null && (
              <span style={{ fontSize: 10, color: cmdkMuted }}>
                {searchLatency}ms
              </span>
            )}
            {searchLatency === null && <span />}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 20, height: 18, borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <ArrowUp style={{ width: 10, height: 10, color: cmdkMuted }} />
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 20, height: 18, borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <ArrowDown style={{ width: 10, height: 10, color: cmdkMuted }} />
              </span>
              <span style={{ fontSize: 11, color: cmdkMuted, marginLeft: 2 }}>Navigate</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 20, height: 18, borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <CornerDownLeft style={{ width: 10, height: 10, color: cmdkMuted }} />
              </span>
              <span style={{ fontSize: 11, color: cmdkMuted, marginLeft: 2 }}>Open</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 5px', height: 18, borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                fontSize: 10, fontWeight: 600, color: cmdkMuted,
              }}>
                esc
              </span>
              <span style={{ fontSize: 11, color: cmdkMuted, marginLeft: 2 }}>Close</span>
            </div>
            <button
              onClick={() => {
                close();
                onShortcutsOpen?.();
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                transition: 'opacity 120ms',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.8'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              aria-label="Open keyboard shortcuts"
            >
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 5px', height: 18, borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                fontSize: 10, fontWeight: 600, color: cmdkMuted,
              }}>
                ?
              </span>
              <span style={{ fontSize: 11, color: cmdkMuted, marginLeft: 2 }}>Shortcuts</span>
            </button>
          </div>
          </div>
        </div>
      </div>
    </>
  );
}
