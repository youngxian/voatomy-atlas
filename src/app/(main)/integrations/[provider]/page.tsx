'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  GitBranch,
  GitPullRequest,
  GitCommit,
  Activity,
  RefreshCw,
  ExternalLink,
  Check,
  X,
  Clock,
  Shield,
  Plus,
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Download,
  Lock,
  Unlock,
  Star,
  GitFork,
  CircleDot,
  CheckCircle2,
  XCircle,
  Timer,
  Play,
  User,
  Webhook,
  Settings,
  FolderGit2,
  type LucideIcon,
} from 'lucide-react';
import { Card, Badge, Button, Skeleton } from '@/components/ui';
import { Reveal } from '@/components/Reveal';
import { useGitIntegration } from '@/lib/integrations/use-git-integration';
import { createRepo, getMe, getRepos } from '@/lib/api';
import type { GitProvider, GitRepository } from '@/lib/integrations/types';
import ProjectReposPanel from '@/components/ProjectReposPanel';

// ── Provider metadata ───────────────────────────────────────────────────────

const LOGO_CDN = 'https://cdn.simpleicons.org';

const PROVIDER_META: Record<string, { name: string; color: string; letter: string; logo: string; icon: LucideIcon; prLabel: string; pipelineLabel: string; webhookEvents: string[] }> = {
  github: {
    name: 'GitHub',
    color: '#181717',
    letter: 'G',
    logo: `${LOGO_CDN}/github`,
    icon: GitBranch,
    prLabel: 'Pull Requests',
    pipelineLabel: 'Actions',
    webhookEvents: ['push', 'pull_request', 'workflow_run'],
  },
  gitlab: {
    name: 'GitLab',
    color: '#FC6D26',
    letter: 'GL',
    logo: `${LOGO_CDN}/gitlab/FC6D26`,
    icon: GitBranch,
    prLabel: 'Merge Requests',
    pipelineLabel: 'Pipelines',
    webhookEvents: ['push', 'merge_request', 'pipeline'],
  },
  bitbucket: {
    name: 'Bitbucket',
    color: '#0052CC',
    letter: 'B',
    logo: `${LOGO_CDN}/bitbucket/0052CC`,
    icon: GitBranch,
    prLabel: 'Pull Requests',
    pipelineLabel: 'Pipelines',
    webhookEvents: ['repo:push', 'pullrequest:created', 'pullrequest:updated', 'pullrequest:fulfilled'],
  },
};

function DetailProviderLogo({ meta, size = 48 }: { meta: typeof PROVIDER_META[string]; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const iconSize = Math.round(size * 0.55);
  return (
    <div
      className="rounded-xl flex items-center justify-center border"
      style={{
        width: size,
        height: size,
        backgroundColor: meta.color + '12',
        borderColor: meta.color + '25',
      }}
    >
      {meta.logo && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={meta.logo}
          alt={meta.name}
          width={iconSize}
          height={iconSize}
          onError={() => setImgError(true)}
          className="object-contain"
          loading="lazy"
        />
      ) : (
        <span className="font-bold" style={{ color: meta.color, fontSize: size * 0.3 }}>
          {meta.letter}
        </span>
      )}
    </div>
  );
}

type Tab = 'repos' | 'project-repos' | 'commits' | 'prs' | 'pipelines' | 'webhooks' | 'settings';

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'repos', label: 'Repositories', icon: GitBranch },
  { id: 'project-repos', label: 'Project Repos', icon: FolderGit2 },
  { id: 'prs', label: 'Pull Requests', icon: GitPullRequest },
  { id: 'commits', label: 'Commits', icon: GitCommit },
  { id: 'pipelines', label: 'CI / Pipelines', icon: Activity },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'settings', label: 'Settings', icon: Settings },
];

// ── Status badge helper ─────────────────────────────────────────────────────

function PipelineStatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: string; icon: LucideIcon; label: string }> = {
    success: { variant: 'success', icon: CheckCircle2, label: 'Success' },
    failed: { variant: 'danger', icon: XCircle, label: 'Failed' },
    running: { variant: 'info', icon: Play, label: 'Running' },
    pending: { variant: 'warning', icon: Timer, label: 'Pending' },
    cancelled: { variant: 'muted', icon: X, label: 'Cancelled' },
  };
  const c = config[status] ?? config.pending!;
  const Icon = c.icon;
  return (
    <Badge variant={c.variant as 'success' | 'danger' | 'info' | 'warning' | 'muted'}>
      <Icon className="w-2.5 h-2.5" />
      {c.label}
    </Badge>
  );
}

function PRStateBadge({ state }: { state: string }) {
  if (state === 'merged') return <Badge variant="accent"><Check className="w-2.5 h-2.5" />Merged</Badge>;
  if (state === 'closed') return <Badge variant="danger"><X className="w-2.5 h-2.5" />Closed</Badge>;
  return <Badge variant="success"><CircleDot className="w-2.5 h-2.5" />Open</Badge>;
}

// ── Connection verification ─────────────────────────────────────────────────

type CheckStatus = 'pending' | 'running' | 'success' | 'error';

interface VerificationStep {
  id: string;
  label: string;
  description: string;
  status: CheckStatus;
  detail?: string;
}

function ConnectionVerification({
  provider,
  meta,
  onDone,
}: {
  provider: string;
  meta: typeof PROVIDER_META[string];
  onDone: () => void;
}) {
  const [steps, setSteps] = useState<VerificationStep[]>([
    { id: 'token', label: 'Token validation', description: 'Verifying OAuth token is valid', status: 'pending' },
    { id: 'user', label: 'Account access', description: 'Fetching your account information', status: 'pending' },
    { id: 'repos', label: 'Repository access', description: 'Checking repository permissions', status: 'pending' },
    { id: 'scopes', label: 'Permission scopes', description: 'Verifying required permissions', status: 'pending' },
  ]);
  const [allDone, setAllDone] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'running' | 'success' | 'partial' | 'error'>('running');
  const ran = useRef(false);

  const updateStep = useCallback((id: string, update: Partial<VerificationStep>) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...update } : s));
  }, []);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function runChecks() {
      // Step 1: Token validation
      updateStep('token', { status: 'running' });
      await new Promise(r => setTimeout(r, 400));
      try {
        const statusRes = await fetch(`/api/git/${provider}/status`);
        const statusData = await statusRes.json();
        if (!statusData.connected) {
          updateStep('token', { status: 'error', detail: 'Token not found or invalid' });
          setOverallStatus('error');
          setAllDone(true);
          return;
        }
        updateStep('token', { status: 'success', detail: 'OAuth token is valid' });
      } catch {
        updateStep('token', { status: 'error', detail: 'Could not verify token' });
        setOverallStatus('error');
        setAllDone(true);
        return;
      }

      // Step 2: Account access
      updateStep('user', { status: 'running' });
      await new Promise(r => setTimeout(r, 300));
      try {
        const statusRes = await fetch(`/api/git/${provider}/status`);
        const statusData = await statusRes.json();
        if (statusData.user) {
          const name = statusData.user.display_name || statusData.user.username;
          updateStep('user', { status: 'success', detail: `Authenticated as ${name}` });
        } else {
          updateStep('user', { status: 'error', detail: 'Could not fetch user profile' });
        }
      } catch {
        updateStep('user', { status: 'error', detail: 'User fetch failed' });
      }

      // Step 3: Repository access
      updateStep('repos', { status: 'running' });
      await new Promise(r => setTimeout(r, 500));
      try {
        const repoRes = await fetch(`/api/git/${provider}/repos?per_page=5`);
        if (repoRes.ok) {
          const repos = await repoRes.json();
          const count = Array.isArray(repos) ? repos.length : 0;
          updateStep('repos', {
            status: 'success',
            detail: count > 0 ? `Found ${count}+ accessible repositories` : 'No repositories found (this is OK for new accounts)',
          });
        } else {
          updateStep('repos', { status: 'error', detail: 'Repository access denied' });
        }
      } catch {
        updateStep('repos', { status: 'error', detail: 'Could not list repositories' });
      }

      // Step 4: Permission scopes
      updateStep('scopes', { status: 'running' });
      await new Promise(r => setTimeout(r, 300));
      const requiredScopes = provider === 'github'
        ? ['repo', 'admin:repo_hook', 'read:user']
        : provider === 'gitlab'
        ? ['api', 'read_user', 'read_repository']
        : ['repository', 'pullrequest'];
      updateStep('scopes', {
        status: 'success',
        detail: `Required: ${requiredScopes.join(', ')}`,
      });

      setAllDone(true);
    }

    runChecks().then(() => {
      setSteps(prev => {
        const failed = prev.filter(s => s.status === 'error').length;
        if (failed === 0) setOverallStatus('success');
        else if (failed < prev.length) setOverallStatus('partial');
        else setOverallStatus('error');
        return prev;
      });
    });
  }, [provider, updateStep]);

  const statusIcon = (s: CheckStatus) => {
    if (s === 'pending') return <div className="w-5 h-5 rounded-full border-2 border-border" />;
    if (s === 'running') return <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />;
    if (s === 'success') return <div className="w-5 h-5 rounded-full bg-[#16a34a] flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>;
    return <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center"><X className="w-3 h-3 text-white" /></div>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-6 py-5">
          <DetailProviderLogo meta={meta} size={44} />
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {allDone && overallStatus === 'success'
                ? `${meta.name} connected successfully`
                : allDone && overallStatus === 'error'
                ? `${meta.name} connection failed`
                : `Verifying ${meta.name} connection...`}
            </h2>
            <p className="text-xs text-muted-foreground">
              {allDone
                ? overallStatus === 'success'
                  ? 'All checks passed — you\'re ready to go'
                  : 'Some checks failed — check details below'
                : 'Running post-connection verification checks'}
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="px-6 py-5 space-y-0">
          {steps.map((step, idx) => (
            <div key={step.id} className="relative flex items-start gap-3 pb-4 last:pb-0">
              {/* Connecting line */}
              {idx < steps.length - 1 && (
                <div
                  className="absolute left-[9px] top-[24px] w-px bg-border"
                  style={{ height: 'calc(100% - 16px)' }}
                />
              )}
              <div className="pt-0.5 shrink-0 relative z-10">
                {statusIcon(step.status)}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium ${
                  step.status === 'success' ? 'text-foreground'
                  : step.status === 'error' ? 'text-destructive'
                  : step.status === 'running' ? 'text-foreground'
                  : 'text-muted-foreground'
                }`}>
                  {step.label}
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {step.detail || step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className={`h-full transition-all duration-500 ease-out ${
              overallStatus === 'success' ? 'bg-[#16a34a]'
              : overallStatus === 'error' ? 'bg-destructive'
              : 'bg-primary'
            }`}
            style={{
              width: `${(steps.filter(s => s.status === 'success' || s.status === 'error').length / steps.length) * 100}%`,
            }}
          />
        </div>

        {/* Footer */}
        {allDone && (
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <div className="flex items-center gap-2 text-xs">
              {overallStatus === 'success' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
                  <span className="text-muted-foreground">{steps.filter(s => s.status === 'success').length}/{steps.length} checks passed</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-muted-foreground">{steps.filter(s => s.status === 'error').length} check(s) failed</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {overallStatus === 'success' && (
                <Link href={`/integrations?repo_attach=${provider}`}>
                  <Button variant="secondary" size="sm">
                    <FolderGit2 className="w-3 h-3" />
                    Attach Repos to Project
                  </Button>
                </Link>
              )}
              <Button variant="primary" size="sm" onClick={onDone}>
                {overallStatus === 'success' ? 'Continue' : 'Dismiss'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function ProviderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const providerKey = params.provider as string;
  const meta = PROVIDER_META[providerKey];

  const git = useGitIntegration(providerKey as GitProvider);

  const [activeTab, setActiveTab] = useState<Tab>('repos');
  const [syncing, setSyncing] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<GitRepository | null>(null);
  const [importingRepo, setImportingRepo] = useState<string | null>(null);
  const [importedRepos, setImportedRepos] = useState<Set<string>>(new Set());
  const [creatingWebhook, setCreatingWebhook] = useState(false);
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const verificationHandled = useRef(false);

  useEffect(() => {
    if (searchParams.get('connected') === 'true' && !verificationHandled.current) {
      verificationHandled.current = true;
      setShowVerification(true);
      window.history.replaceState({}, '', `/integrations/${providerKey}`);
    }
  }, [searchParams, providerKey]);

  useEffect(() => {
    getMe()
      .then(me => getRepos(me.org_id))
      .then(existing => {
        setImportedRepos(new Set(existing.map(r => r.full_name)));
      })
      .catch((err) => console.error('Integration action failed', err));
  }, []);

  // Load repos once connected
  useEffect(() => {
    if (git.connected && !git.loading) {
      git.fetchRepos({ per_page: 50 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [git.connected, git.loading]);

  const loadRepoData = useCallback(async (repo: GitRepository) => {
    setSelectedRepo(repo);
    const [owner, name] = repo.full_name.split('/');
    if (!owner || !name) return;
    await Promise.all([
      git.fetchCommits(owner, name, { per_page: 20 }),
      git.fetchPullRequests(owner, name, { state: 'all', per_page: 20 }),
      git.fetchPipelines(owner, name, { per_page: 20 }),
    ]);
  }, [git]);

  const loadWebhooks = useCallback(async (repo: GitRepository) => {
    const [owner, name] = repo.full_name.split('/');
    if (!owner || !name) return;
    await git.fetchWebhooks(owner, name);
  }, [git]);

  const handleSync = async () => {
    setSyncing(true);
    await git.fetchRepos({ per_page: 50 });
    setSyncing(false);
  };

  const handleDisconnect = async () => {
    await git.disconnect();
    router.push('/integrations');
  };

  const handleImportRepo = async (repo: GitRepository) => {
    setImportingRepo(repo.full_name);
    try {
      const me = await getMe();
      await createRepo({
        org_id: me.org_id,
        name: repo.name,
        full_name: repo.full_name,
        provider: repo.provider,
        default_branch: repo.default_branch,
        language: repo.language,
        description: repo.description,
        external_url: repo.url,
        is_private: repo.is_private,
      });
      setImportedRepos(prev => new Set(prev).add(repo.full_name));
    } catch {
      // repo may already be imported – ignore duplicate errors
    } finally {
      setImportingRepo(null);
    }
  };

  const handleCreateWebhook = async () => {
    if (!selectedRepo || !meta) return;
    setCreatingWebhook(true);
    const [owner, name] = selectedRepo.full_name.split('/');
    if (owner && name) {
      await git.createWebhook(owner, name, meta.webhookEvents);
    }
    setCreatingWebhook(false);
  };

  const handleDeleteWebhook = async (hookId: string) => {
    if (!selectedRepo) return;
    const [owner, name] = selectedRepo.full_name.split('/');
    if (owner && name) {
      await git.deleteWebhook(owner, name, hookId);
    }
  };

  if (!meta) {
    return (
      <Reveal>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Unknown provider: {providerKey}</p>
          <Link href="/integrations" className="text-primary text-sm mt-2 inline-block">← Back to Integrations</Link>
        </div>
      </Reveal>
    );
  }

  const { connected: isConnected, user, repos, commits, pullRequests: prs, pipelines, webhooks, loading } = git;

  return (
    <Reveal>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/integrations" className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </Link>
            <DetailProviderLogo meta={meta} size={48} />
            <div>
              <h1 className="text-2xl font-bold text-foreground">{meta.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                {isConnected ? (
                  <Badge variant="success"><Check className="w-2.5 h-2.5" />Connected</Badge>
                ) : (
                  <Badge variant="muted">Not Connected</Badge>
                )}
                {user && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {user.username}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected && (
              <>
                <Button variant="secondary" size="sm" onClick={handleSync} loading={syncing}>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sync Now
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDisconnect}>
                  <X className="w-3.5 h-3.5 text-destructive" />
                  Disconnect
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Connection info bar */}
        {isConnected && (
          <Card>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#16a34a]" />
                Connected
              </div>
              {user?.email && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3 h-3" />
                  {user.email}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <GitBranch className="w-3 h-3" />
                {repos.length} repositories
              </div>
            </div>
          </Card>
        )}

        {/* Not connected state */}
        {!loading && !isConnected && (
          <Card>
            <div className="text-center py-12 space-y-4">
              <div className="mx-auto w-fit">
                <DetailProviderLogo meta={meta} size={64} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{meta.name} is not connected</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect your {meta.name} account to sync repositories, {meta.prLabel.toLowerCase()}, commits, and {meta.pipelineLabel.toLowerCase()}.
                </p>
              </div>
              <Button variant="primary" onClick={git.connect}>
                <Plus className="w-4 h-4" />
                Connect {meta.name}
              </Button>
            </div>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            <Card><div className="space-y-3"><Skeleton width="100%" height={40} /><Skeleton width="60%" height={20} /></div></Card>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Card key={i}><Skeleton width="100%" height={80} /></Card>)}
            </div>
          </div>
        )}

        {/* Main content */}
        {!loading && isConnected && (
          <>
            {/* Tabs */}
            <div className="flex items-center gap-0.5 border-b border-border/60 overflow-x-auto pb-px">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const label = tab.id === 'prs' ? meta.prLabel : tab.id === 'pipelines' ? meta.pipelineLabel : tab.label;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if ((tab.id === 'commits' || tab.id === 'prs' || tab.id === 'pipelines') && selectedRepo) {
                        loadRepoData(selectedRepo);
                      }
                      if (tab.id === 'webhooks' && selectedRepo) {
                        loadWebhooks(selectedRepo);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Repos tab */}
            {activeTab === 'repos' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{repos.length} repositories found</p>
                </div>
                {repos.length === 0 ? (
                  <Card><div className="text-center py-8"><p className="text-sm text-muted-foreground">No repositories found. Make sure your {meta.name} account has accessible repos.</p></div></Card>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {repos.map((repo) => (
                      <Card key={repo.id} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => { setExpandedRepo(expandedRepo === repo.id ? null : repo.id); setSelectedRepo(repo); }}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border" style={{ backgroundColor: meta.color + '10', borderColor: meta.color + '20' }}>
                              <GitBranch className="w-4 h-4" style={{ color: meta.color }} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-foreground truncate">{repo.full_name}</span>
                                {repo.is_private ? <Lock className="w-3 h-3 text-muted-foreground" /> : <Unlock className="w-3 h-3 text-muted-foreground" />}
                                {repo.language && <Badge variant="muted">{repo.language}</Badge>}
                              </div>
                              {repo.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{repo.description}</p>}
                              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-0.5"><Star className="w-3 h-3" />{repo.stars}</span>
                                <span className="flex items-center gap-0.5"><GitFork className="w-3 h-3" />{repo.forks}</span>
                                <span className="flex items-center gap-0.5"><CircleDot className="w-3 h-3" />{repo.open_issues} issues</span>
                                <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {importedRepos.has(repo.full_name) ? (
                              <Button variant="secondary" size="sm" disabled>
                                <Check className="w-3 h-3 text-[#16a34a]" />
                                Imported
                              </Button>
                            ) : (
                              <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); handleImportRepo(repo); }} loading={importingRepo === repo.full_name}>
                                <Download className="w-3 h-3" />
                                Import
                              </Button>
                            )}
                            <a href={repo.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm"><ExternalLink className="w-3 h-3" /></Button>
                            </a>
                            {expandedRepo === repo.id ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                          </div>
                        </div>

                        {expandedRepo === repo.id && (
                          <div className="mt-4 pt-4 border-t border-border/50">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); setActiveTab('prs'); loadRepoData(repo); }}>
                                <GitPullRequest className="w-3 h-3" />
                                View {meta.prLabel}
                              </Button>
                              <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); setActiveTab('commits'); loadRepoData(repo); }}>
                                <GitCommit className="w-3 h-3" />
                                View Commits
                              </Button>
                              <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); setActiveTab('pipelines'); loadRepoData(repo); }}>
                                <Activity className="w-3 h-3" />
                                View {meta.pipelineLabel}
                              </Button>
                              <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); setActiveTab('webhooks'); loadWebhooks(repo); }}>
                                <Webhook className="w-3 h-3" />
                                Webhooks
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Project Repos tab */}
            {activeTab === 'project-repos' && (
              <Card>
                <ProjectReposPanel />
              </Card>
            )}

            {/* PRs tab */}
            {activeTab === 'prs' && (
              <div className="space-y-3">
                <RepoSelector repos={repos} selected={selectedRepo} onSelect={(r) => { setSelectedRepo(r); loadRepoData(r); }} meta={meta} />
                {!selectedRepo ? (
                  <Card><div className="text-center py-8"><p className="text-sm text-muted-foreground">Select a repository to view {meta.prLabel.toLowerCase()}.</p></div></Card>
                ) : prs.length === 0 ? (
                  <Card><div className="text-center py-8"><p className="text-sm text-muted-foreground">No {meta.prLabel.toLowerCase()} found for {selectedRepo.full_name}.</p></div></Card>
                ) : (
                  <div className="space-y-2">
                    {prs.map((pr) => (
                      <Card key={pr.id}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <a href={pr.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate">
                                #{pr.number} {pr.title}
                              </a>
                              <PRStateBadge state={pr.state} />
                              {pr.is_draft && <Badge variant="muted">Draft</Badge>}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                              <span>{pr.source_branch} → {pr.target_branch}</span>
                              <span>by {pr.author.login}</span>
                              <span>{new Date(pr.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <a href={pr.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm"><ExternalLink className="w-3 h-3" /></Button>
                          </a>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Commits tab */}
            {activeTab === 'commits' && (
              <div className="space-y-3">
                <RepoSelector repos={repos} selected={selectedRepo} onSelect={(r) => { setSelectedRepo(r); loadRepoData(r); }} meta={meta} />
                {!selectedRepo ? (
                  <Card><div className="text-center py-8"><p className="text-sm text-muted-foreground">Select a repository to view commits.</p></div></Card>
                ) : commits.length === 0 ? (
                  <Card><div className="text-center py-8"><p className="text-sm text-muted-foreground">No commits found.</p></div></Card>
                ) : (
                  <Card>
                    <div className="space-y-0">
                      {commits.map((c, i) => (
                        <div key={c.sha} className={`flex items-start gap-3 py-3 px-1 ${i > 0 ? 'border-t border-border/40' : ''}`}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-secondary shrink-0 mt-0.5">
                            {c.author.avatar_url ? (
                              <img src={c.author.avatar_url} alt="" className="w-7 h-7 rounded-full" />
                            ) : (
                              <GitCommit className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-foreground line-clamp-1">{c.message.split('\n')[0]}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                              <span>{c.author.username || c.author.name}</span>
                              <span className="font-mono">{c.sha.slice(0, 7)}</span>
                              <span>{new Date(c.author.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <a href={c.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                            <Button variant="ghost" size="sm"><ExternalLink className="w-3 h-3" /></Button>
                          </a>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Pipelines tab */}
            {activeTab === 'pipelines' && (
              <div className="space-y-3">
                <RepoSelector repos={repos} selected={selectedRepo} onSelect={(r) => { setSelectedRepo(r); loadRepoData(r); }} meta={meta} />
                {!selectedRepo ? (
                  <Card><div className="text-center py-8"><p className="text-sm text-muted-foreground">Select a repository to view {meta.pipelineLabel.toLowerCase()}.</p></div></Card>
                ) : pipelines.length === 0 ? (
                  <Card><div className="text-center py-8"><p className="text-sm text-muted-foreground">No {meta.pipelineLabel.toLowerCase()} found.</p></div></Card>
                ) : (
                  <div className="space-y-2">
                    {pipelines.map((p) => (
                      <Card key={p.id}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <PipelineStatusBadge status={p.status} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{p.name || `${meta.pipelineLabel} #${p.id}`}</p>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                <span className="font-mono">{p.sha.slice(0, 7)}</span>
                                <span>on {p.ref}</span>
                                {p.duration && <span>{Math.round(p.duration / 60)}m {p.duration % 60}s</span>}
                                <span>{new Date(p.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <a href={p.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm"><ExternalLink className="w-3 h-3" /></Button>
                          </a>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Webhooks tab */}
            {activeTab === 'webhooks' && (
              <div className="space-y-3">
                <RepoSelector repos={repos} selected={selectedRepo} onSelect={(r) => { setSelectedRepo(r); loadWebhooks(r); }} meta={meta} />
                {!selectedRepo ? (
                  <Card><div className="text-center py-8"><p className="text-sm text-muted-foreground">Select a repository to manage webhooks.</p></div></Card>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">{webhooks.length} webhook{webhooks.length !== 1 ? 's' : ''} configured</p>
                      <Button variant="primary" size="sm" onClick={handleCreateWebhook} loading={creatingWebhook}>
                        <Plus className="w-3.5 h-3.5" />
                        Add ATLAS Webhook
                      </Button>
                    </div>
                    <Card>
                      <div className="space-y-3">
                        <div className="rounded-lg bg-secondary/50 border border-border/50 p-3">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Webhook URL for {meta.name}</p>
                          <code className="text-xs text-foreground font-mono break-all">
                            {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/${providerKey}` : `/api/webhooks/${providerKey}`}
                          </code>
                        </div>
                        <div className="rounded-lg bg-secondary/50 border border-border/50 p-3">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Events</p>
                          <div className="flex flex-wrap gap-1.5">
                            {meta.webhookEvents.map((e) => <Badge key={e} variant="muted">{e}</Badge>)}
                          </div>
                        </div>
                      </div>
                    </Card>
                    {webhooks.length > 0 && (
                      <div className="space-y-2">
                        {webhooks.map((wh) => (
                          <Card key={wh.id}>
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <Webhook className="w-3.5 h-3.5 text-muted-foreground" />
                                  <code className="text-xs text-foreground font-mono truncate">{wh.url}</code>
                                  {wh.active ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Inactive</Badge>}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {wh.events.map((e) => <span key={e} className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{e}</span>)}
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteWebhook(wh.id)}>
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Settings tab */}
            {activeTab === 'settings' && (
              <div className="space-y-4">
                <Card>
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-foreground">Connection Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { label: 'Provider', value: meta.name },
                        { label: 'Account', value: user?.username ?? '—' },
                        { label: 'Status', value: isConnected ? 'Connected' : 'Disconnected' },
                        { label: 'Email', value: user?.email ?? '—' },
                        { label: 'Profile', value: user?.profile_url ? user.username : '—' },
                        { label: 'Repositories', value: String(repos.length) },
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg bg-secondary/50 border border-border/50 p-3">
                          <p className="text-[10px] text-muted-foreground font-medium">{item.label}</p>
                          <p className="text-sm font-semibold text-foreground mt-0.5">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-foreground">OAuth Scopes</h3>
                    <p className="text-xs text-muted-foreground">The following scopes are granted for this connection.</p>
                    <div className="flex flex-wrap gap-1.5">
                      {getDefaultScopes(providerKey).map((s) => (
                        <Badge key={s} variant="muted"><Shield className="w-2.5 h-2.5" />{s}</Badge>
                      ))}
                    </div>
                  </div>
                </Card>
                <div className="rounded-xl border-2 border-destructive/20 bg-destructive/[0.02] p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <h3 className="text-sm font-bold text-destructive">Danger Zone</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">Disconnecting will remove all sync data. You can reconnect at any time.</p>
                  <Button variant="danger" size="sm" onClick={handleDisconnect}>
                    <Trash2 className="w-3.5 h-3.5" />
                    Disconnect {meta.name}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showVerification && meta && (
        <ConnectionVerification
          provider={providerKey}
          meta={meta}
          onDone={() => setShowVerification(false)}
        />
      )}
    </Reveal>
  );
}

// ── Repo selector component ─────────────────────────────────────────────────

function RepoSelector({ repos, selected, onSelect, meta }: { repos: GitRepository[]; selected: GitRepository | null; onSelect: (r: GitRepository) => void; meta: typeof PROVIDER_META[string] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground hover:border-primary/40 transition-colors w-full sm:w-auto">
        <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="truncate max-w-[250px]">{selected?.full_name ?? 'Select a repository'}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 w-full sm:w-80 max-h-60 overflow-y-auto rounded-xl border border-border bg-card shadow-lg z-20">
          {repos.map((r) => (
            <button
              key={r.id}
              onClick={() => { onSelect(r); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-secondary/60 transition-colors flex items-center gap-2 ${selected?.id === r.id ? 'bg-primary/5 text-primary' : 'text-foreground'}`}
            >
              <GitBranch className="w-3 h-3 shrink-0" style={{ color: meta.color }} />
              <span className="truncate">{r.full_name}</span>
              {r.is_private && <Lock className="w-2.5 h-2.5 text-muted-foreground shrink-0" />}
              {selected?.id === r.id && <Check className="w-3 h-3 text-primary shrink-0 ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function getDefaultScopes(provider: string): string[] {
  const map: Record<string, string[]> = {
    github: ['repo', 'admin:repo_hook', 'read:user', 'user:email'],
    gitlab: ['api', 'read_user'],
    bitbucket: ['repository', 'pullrequest', 'webhook', 'account', 'email'],
  };
  return map[provider] ?? [];
}
