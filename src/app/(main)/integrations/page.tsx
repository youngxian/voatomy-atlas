'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  RefreshCw,
  Plus,
  Clock,
  Check,
  X,
  ArrowRight,
  Plug,
  Zap,
  ArrowDown,
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
  Link2,
  GitBranch,
  MessageSquare,
  Ticket,
  Database,
  Globe,
  BarChart3,
  Shield,
  Headphones,
  FileText,
  Hash,
  MonitorSpeaker,
  PenTool,
  Upload,
  Layers,
} from 'lucide-react';
import { Card, Badge, StatusDot, Button, EmptyState, Skeleton } from '@/components/ui';
import { IntegrationsIllustration } from '@/components/EmptyIllustrations';
import MultiOrbitSemiCircle, { type OrbitItem } from '@/components/ui/multi-orbit-semi-circle';
import { Reveal } from '@/components/Reveal';
import { usePlan } from '@/lib/plan';
import { useAuth } from '@/lib/auth';
import { Lock } from 'lucide-react';
import UpgradeModal from '@/components/UpgradeModal';
import RepoAttachmentModal from '@/components/RepoAttachmentModal';
import {
  listIntegrations,
  listProviders,
  connectIntegration,
  completeOAuthCallback,
  disconnectIntegration,
  triggerIntegrationSync,
  getIntegrationEvents,
  getProjects,
  deleteProject,
  type ConnectedIntegration,
  type IntegrationProvider,
  type IntegrationSyncEvent,
} from '@/lib/api';
import { getProjectProvider } from '@/lib/project-utils';

// ---------------------------------------------------------------------------
// Provider brand config (logo URL + fallback letter + brand color)
// ---------------------------------------------------------------------------

const LOGO_CDN = 'https://cdn.simpleicons.org';

const providerBrands: Record<string, { letter: string; color: string; logo?: string }> = {
  jira:           { letter: 'J',   color: '#2684FF', logo: `${LOGO_CDN}/jira/2684FF`           },
  github:         { letter: 'G',   color: '#181717', logo: `${LOGO_CDN}/github`                 },
  gitlab:         { letter: 'GL',  color: '#FC6D26', logo: `${LOGO_CDN}/gitlab/FC6D26`          },
  linear:         { letter: 'L',   color: '#5E6AD2', logo: `${LOGO_CDN}/linear/5E6AD2`          },
  clickup:        { letter: 'C',   color: '#7B68EE', logo: `${LOGO_CDN}/clickup/7B68EE`         },
  slack:          { letter: 'S',   color: '#4A154B', logo: `${LOGO_CDN}/slack/4A154B`            },
  figma:          { letter: 'F',   color: '#F24E1E', logo: `${LOGO_CDN}/figma/F24E1E`            },
  teams:          { letter: 'T',   color: '#6264A7', logo: `${LOGO_CDN}/microsoftteams/6264A7`   },
  asana:          { letter: 'A',   color: '#F06A6A', logo: `${LOGO_CDN}/asana/F06A6A`            },
  monday:         { letter: 'M',   color: '#FF3D57', logo: `${LOGO_CDN}/mondaydotcom/FF3D57`     },
  trello:         { letter: 'Tr',  color: '#0052CC', logo: `${LOGO_CDN}/trello/0052CC`           },
  miro:           { letter: 'Mi',  color: '#FFD02F', logo: `${LOGO_CDN}/miro/FFD02F`             },
  github_projects:{ letter: 'GP',  color: '#181717', logo: `${LOGO_CDN}/github`                  },
  azuredevops:    { letter: 'AD',  color: '#0078D7', logo: `${LOGO_CDN}/azuredevops/0078D7`      },
  shortcut:       { letter: 'Sc',  color: '#58B1E4', logo: `${LOGO_CDN}/shortcut/58B1E4`         },
  bitbucket:      { letter: 'B',   color: '#0052CC', logo: `${LOGO_CDN}/bitbucket/0052CC`        },
  salesforce:     { letter: 'SF',  color: '#00A1E0', logo: `${LOGO_CDN}/salesforce/00A1E0`       },
  hubspot:        { letter: 'H',   color: '#FF7A59', logo: `${LOGO_CDN}/hubspot/FF7A59`          },
  pipedrive:      { letter: 'P',   color: '#21A366', logo: `${LOGO_CDN}/pipedrive/21A366`        },
  zendesk:        { letter: 'Z',   color: '#03363D', logo: `${LOGO_CDN}/zendesk/03363D`          },
  intercom:       { letter: 'I',   color: '#6AFDEF', logo: `${LOGO_CDN}/intercom/6AFDEF`         },
  freshdesk:      { letter: 'FD',  color: '#35B898', logo: `${LOGO_CDN}/freshdesk/35B898`        },
  datadog:        { letter: 'D',   color: '#632CA6', logo: `${LOGO_CDN}/datadog/632CA6`          },
  pagerduty:      { letter: 'PD',  color: '#06AC38', logo: `${LOGO_CDN}/pagerduty/06AC38`        },
  opsgenie:       { letter: 'O',   color: '#2684FF', logo: `${LOGO_CDN}/opsgenie/2684FF`         },
  sentry:         { letter: 'Se',  color: '#362D59', logo: `${LOGO_CDN}/sentry/362D59`           },
  grafana:        { letter: 'Gr',  color: '#F46800', logo: `${LOGO_CDN}/grafana/F46800`          },
  notion:         { letter: 'N',   color: '#000000', logo: `${LOGO_CDN}/notion`                  },
  confluence:     { letter: 'Co',  color: '#172B4D', logo: `${LOGO_CDN}/confluence/172B4D`        },
  'google-drive': { letter: 'GD',  color: '#4285F4', logo: `${LOGO_CDN}/googledrive/4285F4`      },
  discord:        { letter: 'Di',  color: '#5865F2', logo: `${LOGO_CDN}/discord/5865F2`          },
  csv:            { letter: 'CSV', color: 'var(--muted-foreground)'                               },
};

function getBrand(key: string) {
  return providerBrands[key] ?? { letter: key[0]?.toUpperCase() ?? '?', color: 'var(--muted-foreground)' };
}

function getColorWithAlpha(color: string, alphaHex: string): string {
  if (color.startsWith('var(')) {
    const pct = Math.round((parseInt(alphaHex, 16) / 255) * 100);
    return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
  }
  return color + alphaHex;
}

function ProviderLogo({ providerKey, size = 44 }: { providerKey: string; size?: number }) {
  const brand = getBrand(providerKey);
  const [imgError, setImgError] = useState(false);
  const iconSize = Math.round(size * 0.5);

  return (
    <div
      className="rounded-xl flex items-center justify-center shrink-0 border"
      style={{
        width: size,
        height: size,
        backgroundColor: getColorWithAlpha(brand.color, '12'),
        borderColor: getColorWithAlpha(brand.color, '25'),
      }}
    >
      {brand.logo && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={brand.logo}
          alt={providerKey}
          width={iconSize}
          height={iconSize}
          onError={() => setImgError(true)}
          className="object-contain"
          loading="lazy"
        />
      ) : (
        <span className="text-sm font-bold" style={{ color: brand.color }}>
          {brand.letter}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Orbit items for visual hero
// ---------------------------------------------------------------------------

const ORBIT_ICON_SIZE = 16;

function orbitLogo(key: string, fallback: React.ReactNode) {
  const brand = getBrand(key);
  if (!brand.logo) return fallback;
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img src={brand.logo} width={ORBIT_ICON_SIZE} height={ORBIT_ICON_SIZE} className="object-contain" loading="lazy" />;
}

const orbitData: OrbitItem[][] = [
  [
    { icon: orbitLogo('jira', <Ticket size={ORBIT_ICON_SIZE} />), label: 'Jira', color: '#2684FF' },
    { icon: orbitLogo('github', <GitBranch size={ORBIT_ICON_SIZE} />), label: 'GitHub', color: '#181717' },
    { icon: orbitLogo('slack', <Hash size={ORBIT_ICON_SIZE} />), label: 'Slack', color: '#4A154B' },
    { icon: orbitLogo('linear', <Layers size={ORBIT_ICON_SIZE} />), label: 'Linear', color: '#5E6AD2' },
    { icon: orbitLogo('clickup', <CheckCircle2 size={ORBIT_ICON_SIZE} />), label: 'ClickUp', color: '#7B68EE' },
  ],
  [
    { icon: orbitLogo('gitlab', <GitBranch size={ORBIT_ICON_SIZE} />), label: 'GitLab', color: '#FC6D26' },
    { icon: orbitLogo('figma', <PenTool size={ORBIT_ICON_SIZE} />), label: 'Figma', color: '#F24E1E' },
    { icon: orbitLogo('miro', <PenTool size={ORBIT_ICON_SIZE} />), label: 'Miro', color: '#FFD02F' },
    { icon: orbitLogo('teams', <MessageSquare size={ORBIT_ICON_SIZE} />), label: 'Teams', color: '#6264A7' },
    { icon: orbitLogo('salesforce', <Globe size={ORBIT_ICON_SIZE} />), label: 'Salesforce', color: '#00A1E0' },
    { icon: orbitLogo('hubspot', <BarChart3 size={ORBIT_ICON_SIZE} />), label: 'HubSpot', color: '#FF7A59' },
    { icon: orbitLogo('zendesk', <Headphones size={ORBIT_ICON_SIZE} />), label: 'Zendesk', color: '#03363D' },
    { icon: orbitLogo('sentry', <Shield size={ORBIT_ICON_SIZE} />), label: 'Sentry', color: '#362D59' },
  ],
  [
    { icon: orbitLogo('datadog', <Database size={ORBIT_ICON_SIZE} />), label: 'Datadog', color: '#632CA6' },
    { icon: orbitLogo('pagerduty', <MonitorSpeaker size={ORBIT_ICON_SIZE} />), label: 'PagerDuty', color: '#06AC38' },
    { icon: orbitLogo('notion', <FileText size={ORBIT_ICON_SIZE} />), label: 'Notion', color: '#000000' },
    { icon: orbitLogo('confluence', <FileText size={ORBIT_ICON_SIZE} />), label: 'Confluence', color: '#172B4D' },
    { icon: orbitLogo('intercom', <Globe size={ORBIT_ICON_SIZE} />), label: 'Intercom', color: '#6AFDEF' },
    { icon: orbitLogo('freshdesk', <Headphones size={ORBIT_ICON_SIZE} />), label: 'Freshdesk', color: '#35B898' },
    { icon: orbitLogo('asana', <Ticket size={ORBIT_ICON_SIZE} />), label: 'Asana', color: '#F06A6A' },
    { icon: orbitLogo('monday', <Ticket size={ORBIT_ICON_SIZE} />), label: 'Monday', color: '#FF3D57' },
    { icon: <Upload size={ORBIT_ICON_SIZE} />, label: 'CSV Import', color: 'var(--muted-foreground)' },
  ],
];

// ---------------------------------------------------------------------------
// Category grouping
// ---------------------------------------------------------------------------

const categoryLabels: Record<string, string> = {
  code: 'Code & Version Control',
  'project-management': 'Project Management',
  communication: 'Communication',
  collaboration: 'Collaboration & Whiteboarding',
  crm: 'CRM & Sales',
  support: 'Support',
  design: 'Design',
  monitoring: 'Monitoring & Observability',
  documents: 'Documents & Knowledge',
  import: 'Import',
};

// ---------------------------------------------------------------------------
// Hardcoded fallback (demo mode when API unreachable)
// ---------------------------------------------------------------------------

const DEMO_PROVIDERS: IntegrationProvider[] = [
  { key: 'jira', display_name: 'Jira', category: 'project-management', auth_method: 'oauth2' },
  { key: 'github', display_name: 'GitHub', category: 'code', auth_method: 'oauth2' },
  { key: 'gitlab', display_name: 'GitLab', category: 'code', auth_method: 'oauth2' },
  { key: 'bitbucket', display_name: 'Bitbucket', category: 'code', auth_method: 'oauth2' },
  { key: 'slack', display_name: 'Slack', category: 'communication', auth_method: 'oauth2' },
  { key: 'linear', display_name: 'Linear', category: 'project-management', auth_method: 'oauth2' },
  { key: 'clickup', display_name: 'ClickUp', category: 'project-management', auth_method: 'oauth2' },
  { key: 'asana', display_name: 'Asana', category: 'project-management', auth_method: 'oauth2' },
  { key: 'monday', display_name: 'Monday', category: 'project-management', auth_method: 'oauth2' },
  { key: 'github_projects', display_name: 'GitHub Projects', category: 'project-management', auth_method: 'oauth2' },
  { key: 'azuredevops', display_name: 'Azure DevOps', category: 'project-management', auth_method: 'oauth2' },
  { key: 'shortcut', display_name: 'Shortcut', category: 'project-management', auth_method: 'api_key' },
  { key: 'miro', display_name: 'Miro', category: 'collaboration', auth_method: 'oauth2' },
];

const GIT_PROVIDERS = new Set(['github', 'gitlab', 'bitbucket']);
const PM_PROVIDERS = new Set(['jira', 'linear', 'clickup', 'asana', 'monday', 'github_projects', 'azuredevops', 'shortcut']);

// ---------------------------------------------------------------------------
// Git provider status helpers (cookie-based tokens)
// ---------------------------------------------------------------------------

interface GitProviderStatus {
  connected: boolean;
  user: { username: string; display_name: string; avatar_url?: string } | null;
}

async function fetchGitProviderStatus(provider: string): Promise<GitProviderStatus> {
  try {
    const res = await fetch(`/api/git/${provider}/status`);
    if (!res.ok) return { connected: false, user: null };
    return await res.json();
  } catch {
    return { connected: false, user: null };
  }
}

async function disconnectGitProvider(provider: string): Promise<void> {
  await fetch(`/api/git/${provider}/disconnect`, { method: 'POST' });
}

// ---------------------------------------------------------------------------
// Data flow nodes
// ---------------------------------------------------------------------------

const dataFlowNodes = [
  { label: 'Jira', sub: 'Tickets & Sprints', color: '#2684FF', key: 'jira' },
  { label: 'GitHub', sub: 'PRs & Code', color: '#181717', key: 'github' },
  { label: 'ATLAS', sub: 'Intelligence Engine', color: 'var(--primary)', isCenter: true },
  { label: 'Slack', sub: 'Notifications', color: '#4A154B', key: 'slack' },
  { label: 'Dashboard', sub: 'Insights & Reports', color: 'var(--success)' },
];

// ---------------------------------------------------------------------------
// Integration Card
// ---------------------------------------------------------------------------

function IntegrationCard({
  provider,
  connection,
  gitStatus,
  gatedByPlan,
  onConnect,
  onDisconnect,
  onSync,
  syncing,
  connecting,
  readOnly,
}: {
  provider: IntegrationProvider;
  connection?: ConnectedIntegration;
  gitStatus?: GitProviderStatus;
  gatedByPlan: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onSync: () => void;
  syncing: boolean;
  connecting?: boolean;
  readOnly?: boolean;
}) {
  const isGit = GIT_PROVIDERS.has(provider.key);
  const isGitConnected = isGit && gitStatus?.connected;
  const isBackendConnected = connection && (connection.status === 'connected' || connection.status === 'syncing');
  const isConnected = isGitConnected || isBackendConnected;
  const isPending = connection?.status === 'pending';
  const isError = connection?.status === 'error';
  const brand = getBrand(provider.key);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const statusVariant = isConnected ? 'success' : isError ? 'danger' : isPending ? 'warning' : 'muted';
  const statusLabel = isConnected ? 'Connected' : isError ? 'Error' : isPending ? 'Pending' : 'Available';

  return (
    <div className="rounded-2xl" style={{ borderLeft: `3px solid ${brand.color}` }}>
    <Card className="bento-card rounded-2xl space-y-4 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <ProviderLogo providerKey={provider.key} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{provider.display_name}</span>
              {gatedByPlan ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">Pro</span>
              ) : (
                <Badge variant={statusVariant}>
                  {isConnected && <Check className="w-2.5 h-2.5" />}
                  {statusLabel}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">{provider.category.replace('-', ' ')}</p>
          </div>
        </div>
      </div>

      {/* Connected details */}
      {isConnected && !gatedByPlan && (isGitConnected || connection) && (
        <div className="rounded-lg bg-secondary/50 border border-border/50 p-3 space-y-1.5">
          {isGitConnected && gitStatus?.user && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-1 h-1 rounded-full bg-primary" />
              {gitStatus.user.display_name || gitStatus.user.username}
            </div>
          )}
          {!isGit && connection?.account_id && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-1 h-1 rounded-full bg-primary" />
              Account: {connection.account_id}
            </div>
          )}
          {connection?.connected_at && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-1 h-1 rounded-full bg-primary" />
              Connected {new Date(connection.connected_at).toLocaleDateString()}
            </div>
          )}
          {connection?.last_sync_at && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-1 h-1 rounded-full bg-primary" />
              Last sync: {new Date(connection.last_sync_at).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {isError && connection?.error_message && (
        <div className="rounded-lg bg-destructive/5 border border-destructive/15 p-3">
          <p className="text-xs text-destructive">{connection.error_message}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        {gatedByPlan ? (
          <span className="text-[10px] text-muted-foreground">Requires Pro plan</span>
        ) : isConnected ? (
          <div className="flex items-center gap-1.5 text-[10px] text-primary">
            <StatusDot status="live" />
            <span className="text-muted-foreground">
              {connection?.last_sync_at
                ? `Synced ${new Date(connection.last_sync_at).toLocaleTimeString()}`
                : 'Connected'}
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground">Ready to connect</span>
        )}
        {!readOnly && (
        <div className="flex items-center gap-2">
          {gatedByPlan ? (
            <button
              onClick={() => setUpgradeOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
            >
              <Lock className="w-3 h-3" />
              Upgrade
            </button>
          ) : isConnected ? (
            <>
              {GIT_PROVIDERS.has(provider.key) && (
                <Link href={`/integrations/${provider.key}`}>
                  <Button variant="primary" size="sm">
                    <ArrowRight className="w-3 h-3" />
                    Manage
                  </Button>
                </Link>
              )}
              <Button variant="secondary" size="sm" onClick={onSync} loading={syncing}>
                <RefreshCw className="w-3 h-3" />
                Re-sync
              </Button>
              {confirmDisconnect ? (
                <div className="flex items-center gap-1">
                  <Button variant="danger" size="sm" onClick={() => { onDisconnect(); setConfirmDisconnect(false); }}>
                    Confirm
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDisconnect(false)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setConfirmDisconnect(true)}>
                  <X className="w-3 h-3 text-muted-foreground" />
                </Button>
              )}
            </>
          ) : (
            <Button variant="primary" size="sm" onClick={onConnect} loading={connecting}>
              <Plus className="w-3 h-3" />
              Connect
            </Button>
          )}
        </div>
        )}
      </div>

      {gatedByPlan && (
        <UpgradeModal
          open={upgradeOpen}
          onClose={() => setUpgradeOpen(false)}
          targetTier="pro"
          featureLabel={`${provider.display_name} integration`}
        />
      )}
    </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function IntegrationsPage() {
  const { limits } = usePlan();
  const { isDemo } = useAuth();
  const allowedSet = new Set(limits.allowedIntegrations);
  const isFreeForAll = allowedSet.has('*');
  const searchParams = useSearchParams();

  const [providers, setProviders] = useState<IntegrationProvider[]>([]);
  const [connections, setConnections] = useState<ConnectedIntegration[]>([]);
  const [gitStatuses, setGitStatuses] = useState<Record<string, GitProviderStatus>>({});
  const [events, setEvents] = useState<IntegrationSyncEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showRepoAttach, setShowRepoAttach] = useState(false);
  const [repoAttachProvider, setRepoAttachProvider] = useState<string | null>(null);

  const availableSectionRef = useRef<HTMLDivElement>(null);
  const callbackHandled = useRef(false);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), type === 'error' ? 8000 : 4000);
  }, []);

  const fetchGitStatuses = useCallback(async () => {
    const gitKeys = ['github', 'gitlab', 'bitbucket'];
    const results = await Promise.all(gitKeys.map((k) => fetchGitProviderStatus(k)));
    const map: Record<string, GitProviderStatus> = {};
    gitKeys.forEach((k, i) => { map[k] = results[i]; });
    setGitStatuses(map);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [provs, conns] = await Promise.all([listProviders(), listIntegrations()]);
      setProviders(provs);
      setConnections(conns);
      setIsDemoMode(false);

      const connectedProviders = conns.filter((c) => c.status === 'connected');
      if (connectedProviders.length > 0) {
        const evts = await Promise.all(connectedProviders.map((c) => getIntegrationEvents(c.provider)));
        setEvents(evts.flat());
      }
    } catch {
      setProviders(DEMO_PROVIDERS);
      setConnections([]);
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isDemo) {
      setLoading(false);
      return;
    }
    fetchData();
    fetchGitStatuses();
  }, [fetchData, fetchGitStatuses, isDemo]);

  // Handle OAuth callback from non-git providers
  const oauthCode = useMemo(() => searchParams.get('code'), [searchParams]);
  const oauthStateParam = useMemo(() => searchParams.get('state'), [searchParams]);
  const oauthProvider = useMemo(() => searchParams.get('provider'), [searchParams]);

  useEffect(() => {
    if (!oauthCode || !oauthProvider || callbackHandled.current) return;

    // Some providers (e.g. ClickUp) don't return state in the redirect URL
    let state = oauthStateParam;
    if (!state) {
      state = localStorage.getItem(`oauth_state_${oauthProvider}`);
      localStorage.removeItem(`oauth_state_${oauthProvider}`);
    }
    if (!state) return;

    callbackHandled.current = true;
    (async () => {
      try {
        await completeOAuthCallback(oauthProvider, oauthCode, state);
        showToast('success', `${oauthProvider} connected successfully`);
      } catch {
        showToast('error', `Failed to complete ${oauthProvider} connection. Please try again.`);
      }
      window.history.replaceState({}, '', '/integrations');
      await fetchData();
    })();
  }, [oauthCode, oauthStateParam, oauthProvider, fetchData, showToast]);

  // Handle ?error= from git provider OAuth callback
  useEffect(() => {
    const err = searchParams.get('error');
    if (err) {
      showToast('error', `Connection failed: ${decodeURIComponent(err)}`);
      window.history.replaceState({}, '', '/integrations');
    }
  }, [searchParams, showToast]);

  // Handle ?repo_attach=provider param (triggered after git provider connection)
  useEffect(() => {
    const attachProvider = searchParams.get('repo_attach');
    if (attachProvider) {
      setRepoAttachProvider(attachProvider);
      setShowRepoAttach(true);
      window.history.replaceState({}, '', '/integrations');
    }
  }, [searchParams]);

  const connectedPMCount = useMemo(() => {
    const backendPM = connections.filter((c) =>
      PM_PROVIDERS.has(c.provider) && (c.status === 'connected' || c.status === 'syncing'),
    ).length;
    return backendPM;
  }, [connections]);

  const handleConnect = async (provider: IntegrationProvider) => {
    if (isDemo) {
      showToast('error', 'Integrations are disabled in demo mode. Sign up to connect your tools.');
      return;
    }
    if (PM_PROVIDERS.has(provider.key) && limits.maxPMIntegrations > 0 && connectedPMCount >= limits.maxPMIntegrations) {
      showToast('error', `Free plan allows ${limits.maxPMIntegrations} project management tool. Upgrade to Pro for unlimited.`);
      return;
    }

    if (GIT_PROVIDERS.has(provider.key)) {
      setConnectingProvider(provider.key);
      try {
        const res = await fetch(`/api/auth/${provider.key}/preflight`);
        const data = await res.json();
        if (!data.configured) {
          setConnectingProvider(null);
          showToast('error', data.error || `${provider.display_name} is not configured. Ask your admin to set the ${provider.display_name} credentials in environment variables.`);
          return;
        }
      } catch {
        // preflight failed, try anyway
      }
      window.location.href = `/api/auth/${provider.key}/authorize`;
      return;
    }

    await initiateConnect(provider.key);
  };

  const initiateConnect = async (providerKey: string) => {
    setConnectingProvider(providerKey);
    try {
      const result = await connectIntegration(providerKey, {
        redirect_url: `${window.location.origin}/integrations?provider=${providerKey}`,
      });
      if (result.auth_url) {
        if (result.state) {
          localStorage.setItem(`oauth_state_${providerKey}`, result.state);
        }
        window.location.href = result.auth_url;
      } else {
        showToast('success', `${providerKey} connected`);
        await fetchData();
      }
    } catch (err) {
      showToast('error', `Failed to connect ${providerKey}. ${isDemoMode ? 'Backend unavailable in demo mode.' : 'Please try again.'}`);
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = async (providerKey: string) => {
    if (isDemo) return;
    try {
      if (GIT_PROVIDERS.has(providerKey)) {
        await disconnectGitProvider(providerKey);
        await fetchGitStatuses();
      } else {
        // Delete projects linked to this PM provider before removing the integration
        try {
          const projects = await getProjects();
          const linked = (Array.isArray(projects) ? projects : []).filter((p) => {
            const prov = getProjectProvider(p);
            return prov === providerKey;
          });
          await Promise.all(linked.map((p) => deleteProject(p.id)));
        } catch {
          // best-effort cleanup — proceed with disconnect even if this fails
        }
        await disconnectIntegration(providerKey);
        await fetchData();
      }
      showToast('success', `${providerKey} disconnected`);
    } catch {
      showToast('error', `Failed to disconnect ${providerKey}`);
    }
  };

  const handleSync = async (providerKey: string) => {
    if (isDemo) return;
    setSyncingProvider(providerKey);
    try {
      if (GIT_PROVIDERS.has(providerKey)) {
        await fetchGitStatuses();
        showToast('success', `${providerKey} status refreshed`);
      } else {
        await triggerIntegrationSync(providerKey);
        await fetchData();
        showToast('success', `${providerKey} sync triggered`);
      }
    } catch {
      showToast('error', `Failed to sync ${providerKey}`);
    } finally {
      setSyncingProvider(null);
    }
  };

  const backendConnectedCount = connections.filter((c) => c.status === 'connected' || c.status === 'syncing').length;
  const gitConnectedCount = Object.values(gitStatuses).filter((s) => s.connected).length;
  const connectedCount = backendConnectedCount + gitConnectedCount;

  const connectionMap = new Map<string, ConnectedIntegration>();
  for (const c of connections) connectionMap.set(c.provider, c);

  const isProviderConnected = (key: string) =>
    connectionMap.has(key) || (GIT_PROVIDERS.has(key) && gitStatuses[key]?.connected);

  const connectedProviders = providers.filter((p) => isProviderConnected(p.key));
  const availableProviders = providers.filter((p) => !isProviderConnected(p.key));

  const categorized = new Map<string, IntegrationProvider[]>();
  for (const p of availableProviders) {
    const cat = p.category || 'other';
    if (!categorized.has(cat)) categorized.set(cat, []);
    categorized.get(cat)!.push(p);
  }

  return (
    <Reveal>
      <div className="space-y-8">
        {/* Toast notification */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 ${
              toast.type === 'success'
                ? 'bg-card border-border text-foreground'
                : 'bg-destructive/10 border-destructive/20 text-destructive'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0" />
            )}
            {toast.message}
            <button onClick={() => setToast(null)} className="ml-2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="icon-box-violet">
              <Plug className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>Integrations</h1>
              <p className="text-sm text-muted-foreground">Connect your tools to power ATLAS signals</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border/50">
              <StatusDot status="live" />
              <span className="text-sm font-medium text-foreground">{connectedCount}</span>
              <span className="text-xs text-muted-foreground">Connected</span>
            </div>
            {isDemo && (
              <Badge variant="warning">Demo — Read Only</Badge>
            )}
            {isDemoMode && !isDemo && (
              <>
                <Badge variant="warning">Demo Mode</Badge>
                <button
                  onClick={() => { setLoading(true); fetchData().then(() => fetchGitStatuses()); }}
                  className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </button>
              </>
            )}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border/50">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">All systems operational</span>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton variant="rectangular" width={44} height={44} className="rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <Skeleton width="40%" height={14} />
                    <Skeleton width="60%" height={12} />
                  </div>
                </div>
                <Skeleton width="100%" height={60} className="rounded-lg" />
              </Card>
            ))}
          </div>
        )}

        {/* Connected Integrations */}
        {!loading && connectedCount > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Connected Integrations
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {connectedProviders.map((p) => {
                const gated = !isFreeForAll && !allowedSet.has(p.key);
                return (
                  <IntegrationCard
                    key={p.key}
                    provider={p}
                    connection={connectionMap.get(p.key)}
                    gitStatus={GIT_PROVIDERS.has(p.key) ? gitStatuses[p.key] : undefined}
                    gatedByPlan={gated}
                    onConnect={() => handleConnect(p)}
                    onDisconnect={() => handleDisconnect(p.key)}
                    onSync={() => handleSync(p.key)}
                    syncing={syncingProvider === p.key}
                    connecting={connectingProvider === p.key}
                    readOnly={isDemo}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Orbit Hero — visual showcase of integrations ecosystem */}
        {!loading && connectedCount === 0 && (
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <div className="text-center pt-8 px-6">
              <IntegrationsIllustration className="w-[220px] h-[176px] mx-auto" />
              <h2 className="text-lg font-bold text-foreground mt-4">Connect your ecosystem</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                ATLAS works best when connected to your tools. Start by connecting your board (Jira, Linear, ClickUp, Asana, Monday), GitHub, Slack, or Miro.
              </p>
            </div>
            <MultiOrbitSemiCircle orbits={orbitData} className="-mt-4" />
            <div className="flex justify-center pb-6 -mt-6">
              <Button variant="primary" onClick={() => availableSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}>
                <Plus className="w-3.5 h-3.5" />
                Browse Integrations
              </Button>
            </div>
          </div>
        )}

        {/* Available Integrations */}
        {!loading && availableProviders.length > 0 && (
          <div ref={availableSectionRef}>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Available Integrations
            </h2>
            {Array.from(categorized.entries()).map(([cat, provs]) => (
              <div key={cat} className="mb-6">
                <h3 className="text-xs font-medium text-secondary-foreground mb-3 flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5" />
                  {categoryLabels[cat] || cat}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {provs.map((p) => {
                    const gated = !isFreeForAll && !allowedSet.has(p.key);
                    return (
                      <IntegrationCard
                        key={p.key}
                        provider={p}
                        gitStatus={GIT_PROVIDERS.has(p.key) ? gitStatuses[p.key] : undefined}
                        gatedByPlan={gated}
                        onConnect={() => handleConnect(p)}
                        onDisconnect={() => handleDisconnect(p.key)}
                        onSync={() => handleSync(p.key)}
                        syncing={false}
                        connecting={connectingProvider === p.key}
                        readOnly={isDemo}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Data Flow Section */}
        {!loading && (
          <Card variant="inset" padding="lg" className="bento-card rounded-2xl">
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Data Flow</h2>
                <span className="text-xs text-muted-foreground">How your integrations connect through ATLAS</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0 py-4 overflow-x-auto">
                {dataFlowNodes.map((node, i) => (
                  <div key={node.label} className="flex items-center">
                    <div
                      className={`flex flex-col items-center gap-1.5 px-5 py-3 rounded-xl border ${
                        node.isCenter
                          ? 'bg-primary/8 border-primary/20'
                          : 'bg-card border-border/50'
                      }`}
                    >
                      {'key' in node && (node as { key?: string }).key ? (
                        <ProviderLogo providerKey={(node as { key: string }).key} size={32} />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-foreground border"
                          style={{
                            backgroundColor: getColorWithAlpha(node.isCenter ? 'var(--primary)' : node.color, '15'),
                            borderColor: getColorWithAlpha(node.isCenter ? 'var(--primary)' : node.color, '30'),
                          }}
                        >
                          {node.label[0]}
                        </div>
                      )}
                      <span className={`text-xs font-semibold ${node.isCenter ? 'text-primary' : 'text-foreground'}`}>
                        {node.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{node.sub}</span>
                    </div>
                    {i < dataFlowNodes.length - 1 && (
                      <div className="hidden sm:flex items-center px-2">
                        <div className="w-6 h-px bg-border" />
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <div className="w-6 h-px bg-border" />
                      </div>
                    )}
                    {i < dataFlowNodes.length - 1 && (
                      <div className="flex sm:hidden items-center py-1">
                        <ArrowDown className="w-3 h-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Sync Activity Feed */}
        {!loading && (
          <Card variant="inset" padding="lg" className="bento-card rounded-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <h2 className="text-base font-semibold text-foreground">Sync Activity</h2>
                  <Badge variant="muted">{events.length} events</Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={fetchData}>
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </Button>
              </div>

              {events.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No sync events yet. Connect an integration to see activity.
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {events.map((event) => {
                    return (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/60 transition-colors group"
                      >
                        <div className="shrink-0">
                          <ProviderLogo providerKey={event.provider} size={24} />
                        </div>

                        <span className="shrink-0 text-[10px] font-semibold text-muted-foreground capitalize">
                          {event.provider}
                        </span>

                        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors flex-1 truncate">
                          {event.message}
                        </span>

                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(event.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {showRepoAttach && (
        <RepoAttachmentModal
          provider={repoAttachProvider ?? undefined}
          onClose={() => {
            setShowRepoAttach(false);
            setRepoAttachProvider(null);
          }}
        />
      )}
    </Reveal>
  );
}
