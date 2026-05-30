'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  GitBranch,
  GitPullRequest,
  GitCommit,
  Clock,
  ExternalLink,
  Plus,
  Code2,
  ChevronDown,
  CheckCircle2,
  Plug,
  Download,
  Check,
  Search,
  Lock,
  Unlock,
  Star,
  GitFork,
  ArrowRight,
  Loader2,
  User,
  Building2,
} from 'lucide-react';
import { DownloadDoneIcon } from '@/components/ui/animated-state-icons';
import { usePlan } from '@/lib/plan';
import LimitWall from '@/components/LimitWall';
import SectionGate from '@/components/SectionGate';
import { getRepos, getMe, createRepo, linkRepoToProject, type Repo as APIRepo } from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { useAuth } from '@/lib/auth';
import type { GitRepository, GitProvider, GitUser, GitCommit as GitCommitType, GitPullRequest as GitPRType } from '@/lib/integrations/types';
import { ReposIllustration } from '@/components/EmptyIllustrations';

const PROVIDERS: { key: GitProvider; label: string; color: string }[] = [
  { key: 'github', label: 'GitHub', color: '#181717' },
  { key: 'gitlab', label: 'GitLab', color: '#FC6D26' },
  { key: 'bitbucket', label: 'Bitbucket', color: '#0052CC' },
];

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5', Go: '#00ADD8',
  Rust: '#dea584', Java: '#b07219', Ruby: '#701516', PHP: '#4F5D95',
  Swift: '#F05138', Kotlin: '#A97BFF', C: '#555555', 'C++': '#f34b7d',
  'C#': '#178600', Dart: '#00B4AB', Scala: '#c22d40', Shell: '#89e051',
  HTML: '#e34c26', CSS: '#563d7c', Vue: '#41b883', Svelte: '#ff3e00',
};

// ---------------------------------------------------------------------------
// Empty state — no repos yet (generic / demo)
// ---------------------------------------------------------------------------

function ReposEmptyState({ onImport, isDemo }: { onImport: () => void; isDemo: boolean }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6">
      <ReposIllustration className="w-[260px] h-[200px] mb-4" />
      <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
        {isDemo ? 'Repository Intelligence' : 'No repositories yet'}
      </h2>
      <p className="text-sm text-muted-foreground max-w-md mb-8 leading-relaxed">
        {isDemo
          ? 'Connect GitHub, GitLab, or Bitbucket to unlock commit analytics, PR health tracking, and code velocity signals across your team.'
          : 'Import repositories from your connected Git providers to track commits, pull requests, and code health metrics.'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg mb-10">
        {[
          { icon: GitCommit, label: 'Commit Analytics', desc: 'Track velocity & frequency' },
          { icon: GitPullRequest, label: 'PR Health', desc: 'Review time & merge rate' },
          { icon: GitBranch, label: 'Branch Activity', desc: 'Active branches & staleness' },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border/40">
            <item.icon className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">{item.label}</span>
            <span className="text-[10px] text-muted-foreground">{item.desc}</span>
          </div>
        ))}
      </div>

      {isDemo ? (
        <Link
          href="/integrations"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plug className="w-4 h-4" />
          View Integrations
        </Link>
      ) : (
        <button
          onClick={onImport}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Import Repositories
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty-state: import repos from connected providers
// ---------------------------------------------------------------------------

interface OwnerGroup {
  owner: string;
  avatarUrl?: string;
  isPersonal: boolean;
  repos: GitRepository[];
}

function RepoImportEmptyState({ onImported }: { onImported: () => void }) {
  const { activeProjectId } = useProject();
  const [connectedProviders, setConnectedProviders] = useState<GitProvider[]>([]);
  const [providerUsers, setProviderUsers] = useState<Record<string, GitUser | null>>({});
  const [checking, setChecking] = useState(true);
  const [activeProvider, setActiveProvider] = useState<GitProvider | null>(null);
  const [availableRepos, setAvailableRepos] = useState<GitRepository[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [search, setSearch] = useState('');
  const [importingRepo, setImportingRepo] = useState<string | null>(null);
  const [importedRepos, setImportedRepos] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function checkProviders() {
      const connected: GitProvider[] = [];
      const users: Record<string, GitUser | null> = {};
      await Promise.all(
        PROVIDERS.map(async ({ key }) => {
          try {
            const res = await fetch(`/api/git/${key}/status`);
            const data = await res.json();
            if (data.connected) {
              connected.push(key);
              users[key] = data.user ?? null;
            }
          } catch { /* skip */ }
        }),
      );
      setConnectedProviders(connected);
      setProviderUsers(users);
      if (connected.length > 0) setActiveProvider(connected[0]);
      setChecking(false);
    }
    checkProviders();
  }, []);

  const fetchProviderRepos = useCallback(async (provider: GitProvider) => {
    setLoadingRepos(true);
    setAvailableRepos([]);
    try {
      const res = await fetch(`/api/git/${provider}/repos?per_page=100`);
      if (res.ok) {
        const data: GitRepository[] = await res.json();
        setAvailableRepos(data);
      }
    } catch { /* ignore */ }
    setLoadingRepos(false);
  }, []);

  useEffect(() => {
    if (activeProvider) fetchProviderRepos(activeProvider);
  }, [activeProvider, fetchProviderRepos]);

  const handleImport = async (repo: GitRepository) => {
    setImportingRepo(repo.full_name);
    try {
      const me = await getMe();
      const newRepo = await createRepo({
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
      if (activeProjectId && newRepo?.id) {
        linkRepoToProject(activeProjectId, newRepo.id).catch((err) => console.error('Failed to link repo', err));
      }
    } catch {
      setImportedRepos(prev => new Set(prev).add(repo.full_name));
    } finally {
      setImportingRepo(null);
    }
  };

  const handleImportAll = async () => {
    const toImport = filtered.filter(r => !importedRepos.has(r.full_name));
    for (const repo of toImport) {
      await handleImport(repo);
    }
  };

  const handleImportGroup = async (groupRepos: GitRepository[]) => {
    const toImport = groupRepos.filter(r => !importedRepos.has(r.full_name));
    for (const repo of toImport) {
      await handleImport(repo);
    }
  };

  const toggleGroup = (owner: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(owner)) next.delete(owner);
      else next.add(owner);
      return next;
    });
  };

  const handleDone = () => {
    if (importedRepos.size > 0) onImported();
  };

  const filtered = availableRepos.filter(r =>
    r.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.language ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const currentUser = activeProvider ? providerUsers[activeProvider] : null;

  const ownerGroups: OwnerGroup[] = (() => {
    const map = new Map<string, { avatarUrl?: string; repos: GitRepository[] }>();
    for (const repo of filtered) {
      const owner = repo.owner.login;
      if (!map.has(owner)) map.set(owner, { avatarUrl: repo.owner.avatar_url, repos: [] });
      map.get(owner)!.repos.push(repo);
    }
    const groups: OwnerGroup[] = [];
    const personalOwner = currentUser?.username;
    for (const [owner, data] of map) {
      groups.push({
        owner,
        avatarUrl: data.avatarUrl,
        isPersonal: owner === personalOwner,
        repos: data.repos,
      });
    }
    groups.sort((a, b) => {
      if (a.isPersonal && !b.isPersonal) return -1;
      if (!a.isPersonal && b.isPersonal) return 1;
      return a.owner.localeCompare(b.owner);
    });
    return groups;
  })();

  if (checking) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No providers connected at all
  if (connectedProviders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center mb-6">
          <GitBranch className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
          No repositories connected
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mb-8 leading-relaxed">
          Connect your GitHub, GitLab, or Bitbucket account to get started.
          Once connected, you&apos;ll be able to import your repositories here.
        </p>
        <Link
          href="/integrations"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors shadow-sm shadow-primary/15"
        >
          <Plug className="w-4 h-4" />
          Connect an Integration
        </Link>
        <span className="text-xs text-muted-foreground mt-3">
          Supports GitHub, GitLab &amp; Bitbucket
        </span>
      </div>
    );
  }

  const providerMeta = PROVIDERS.find(p => p.key === activeProvider);
  const importedCount = importedRepos.size;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3 pt-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center mx-auto">
          <Download className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>
          Import your repositories
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Select the repositories you want to track in this project. Imported repos will appear on
          your dashboard with commit activity, pull requests, and health metrics.
        </p>
      </div>

      {/* Provider tabs */}
      {connectedProviders.length > 1 && (
        <div className="flex items-center justify-center gap-2">
          {connectedProviders.map(key => {
            const meta = PROVIDERS.find(p => p.key === key)!;
            const isActive = activeProvider === key;
            return (
              <button
                key={key}
                onClick={() => { setActiveProvider(key); setSearch(''); }}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                  isActive
                    ? 'bg-card border-primary/30 text-foreground shadow-sm'
                    : 'bg-transparent border-border/60 text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                {meta.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Search + actions bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${providerMeta?.label ?? ''} repositories...`}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-border/60 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          {filtered.length > 0 && filtered.some(r => !importedRepos.has(r.full_name)) && (
            <button
              onClick={handleImportAll}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-border/60 bg-card hover:bg-muted text-foreground transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Import All ({filtered.filter(r => !importedRepos.has(r.full_name)).length})
            </button>
          )}
          {importedCount > 0 && (
            <button
              onClick={handleDone}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors shadow-sm shadow-primary/15 whitespace-nowrap"
            >
              Done
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Imported counter banner */}
      {importedCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#16a34a]/8 border border-[#16a34a]/15">
          <CheckCircle2 className="w-4.5 h-4.5 text-[#16a34a] shrink-0" />
          <span className="text-sm text-foreground">
            <strong>{importedCount} {importedCount === 1 ? 'repository' : 'repositories'}</strong> imported.
            {' '}Click <strong>Done</strong> to view them on your dashboard.
          </span>
        </div>
      )}

      {/* Repo list */}
      {loadingRepos ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-muted rounded" />
                  <div className="h-3 w-72 bg-muted/60 rounded" />
                </div>
                <div className="h-8 w-20 bg-muted rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-border/60 bg-card">
          <Search className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {availableRepos.length === 0
              ? `No repositories found on your ${providerMeta?.label} account.`
              : 'No repositories match your search.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {ownerGroups.map((group) => {
            const isCollapsed = !expandedGroups.has(group.owner);
            const groupPending = group.repos.filter(r => !importedRepos.has(r.full_name)).length;
            const groupImported = group.repos.length - groupPending;

            return (
              <div key={group.owner} className="rounded-xl border border-border/60 bg-card overflow-hidden">
                {/* Group header */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleGroup(group.owner)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleGroup(group.owner); } }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer select-none"
                >
                  {group.avatarUrl ? (
                    <img
                      src={group.avatarUrl}
                      alt={group.owner}
                      className="w-7 h-7 rounded-full border border-border/60 shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-muted border border-border/60 flex items-center justify-center shrink-0">
                      {group.isPersonal
                        ? <User className="w-3.5 h-3.5 text-muted-foreground" />
                        : <Building2 className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">{group.owner}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border/40">
                        {group.isPersonal ? 'Personal' : 'Organization'}
                      </span>
                      {groupImported > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/15">
                          {groupImported} imported
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {group.repos.length} {group.repos.length === 1 ? 'repository' : 'repositories'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!isCollapsed && groupPending > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleImportGroup(group.repos); }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md border border-border/60 bg-card hover:bg-muted text-foreground transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Import All
                      </button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
                  </div>
                </div>

                {/* Group repos */}
                {!isCollapsed && (
                  <div className="divide-y divide-border/50">
                    {group.repos.map((repo, index) => {
                      const isImported = importedRepos.has(repo.full_name);
                      const isImporting = importingRepo === repo.full_name;
                      const langColor = LANGUAGE_COLORS[repo.language ?? ''] ?? 'var(--muted-foreground)';

                      return (
                        <div
                          key={repo.id}
                          className={`flex items-center gap-4 px-4 py-3.5 transition-colors ${
                            isImported ? 'bg-[#16a34a]/[0.03]' : 'hover:bg-muted/30'
                          }`}
                          style={{ animation: `fade-up 0.25s ease-out ${Math.min(index * 0.03, 0.3)}s both` }}
                        >
                          <div
                            className="w-9 h-9 rounded-lg border flex items-center justify-center shrink-0"
                            style={{ backgroundColor: (providerMeta?.color ?? '#000') + '08', borderColor: (providerMeta?.color ?? '#000') + '18' }}
                          >
                            <GitBranch className="w-4 h-4" style={{ color: providerMeta?.color }} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-foreground truncate">{repo.name}</span>
                              {repo.is_private
                                ? <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
                                : <Unlock className="w-3 h-3 text-muted-foreground shrink-0" />}
                              {repo.language && (
                                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: langColor }} />
                                  {repo.language}
                                </span>
                              )}
                            </div>
                            {repo.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{repo.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                              <span className="inline-flex items-center gap-0.5"><Star className="w-3 h-3" />{repo.stars}</span>
                              <span className="inline-flex items-center gap-0.5"><GitFork className="w-3 h-3" />{repo.forks}</span>
                              <span className="hidden sm:inline">Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isImported ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-[#16a34a] bg-[#16a34a]/10 border border-[#16a34a]/15">
                                <Check className="w-3 h-3" />
                                Imported
                              </span>
                            ) : (
                              <button
                                onClick={() => handleImport(repo)}
                                disabled={isImporting}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-colors disabled:opacity-50"
                              >
                                {isImporting ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Download className="w-3 h-3" />
                                )}
                                {isImporting ? 'Importing...' : 'Import'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer hint */}
      <p className="text-center text-xs text-muted-foreground pb-4">
        {connectedProviders.length < 3 && (
          <>
            Want to add repos from another provider?{' '}
            <Link href="/integrations" className="text-primary hover:underline">
              Connect more integrations
            </Link>
          </>
        )}
      </p>

      <style jsx>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expanded repo detail — fetches live data from the git provider
// ---------------------------------------------------------------------------

function RepoDetail({ repo, provider }: { repo: APIRepo; provider: string }) {
  const [commits, setCommits] = useState<GitCommitType[]>([]);
  const [prs, setPrs] = useState<GitPRType[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'commits' | 'prs'>('overview');

  useEffect(() => {
    const [owner, name] = (repo.full_name || '').split('/');
    if (!owner || !name) { setLoadingDetail(false); return; }

    setLoadingDetail(true);
    Promise.all([
      fetch(`/api/git/${provider}/commits?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(name)}&per_page=10`)
        .then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`/api/git/${provider}/pull-requests?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(name)}&state=all&per_page=10`)
        .then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([c, p]) => {
      setCommits(c);
      setPrs(p);
    }).finally(() => setLoadingDetail(false));
  }, [repo.full_name, provider]);

  const openPrs = prs.filter(p => p.state === 'open').length;
  const mergedPrs = prs.filter(p => p.state === 'merged').length;
  const langColor = LANGUAGE_COLORS[repo.language ?? ''] ?? 'var(--muted-foreground)';

  const tabs: { key: typeof activeTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'overview', label: 'Overview', icon: Code2 },
    { key: 'commits', label: `Commits (${commits.length})`, icon: GitCommit },
    { key: 'prs', label: `PRs (${prs.length})`, icon: GitPullRequest },
  ];

  return (
    <div className="border-t border-border/60 p-5 space-y-5" style={{ animation: 'fade-in 0.3s ease-out' }}>
      {loadingDetail ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Recent Commits', value: String(commits.length), icon: GitCommit, color: 'text-primary' },
              { label: 'Open PRs', value: String(openPrs), icon: GitPullRequest, color: 'text-warning' },
              { label: 'Merged PRs', value: String(mergedPrs), icon: CheckCircle2, color: 'text-success' },
              { label: 'Connected', value: new Date(repo.connected_at).toLocaleDateString(), icon: Clock, color: 'text-muted-foreground' },
            ].map(stat => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-xl bg-muted/50 border border-border/40 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className={`w-3 h-3 ${stat.color}`} />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground tabular-nums">{stat.value}</p>
                </div>
              );
            })}
          </div>

          {/* Metadata pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border border-border/40 text-xs text-muted-foreground">
              <GitBranch className="w-3 h-3" />
              {repo.default_branch}
            </span>
            {repo.language && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border border-border/40 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: langColor }} />
                {repo.language}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border border-border/40 text-xs text-muted-foreground">
              {repo.is_private ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              {repo.is_private ? 'Private' : 'Public'}
            </span>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-1 border-b border-border/50">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'text-primary border-primary'
                      : 'text-muted-foreground border-transparent hover:text-foreground'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Overview sub-tab */}
          {activeTab === 'overview' && (
            <div className="space-y-3">
              {repo.description && (
                <p className="text-sm text-muted-foreground">{repo.description}</p>
              )}
              {commits.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Latest Commits</p>
                  <div className="space-y-0 rounded-lg border border-border/40 overflow-hidden">
                    {commits.slice(0, 3).map((c, i) => (
                      <div key={c.sha} className={`flex items-center gap-3 px-3 py-2.5 ${i > 0 ? 'border-t border-border/40' : ''}`}>
                        {c.author.avatar_url ? (
                          <img src={c.author.avatar_url} alt="" className="w-6 h-6 rounded-full shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <User className="w-3 h-3 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{c.message.split('\n')[0]}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                            <span>{c.author.username || c.author.name}</span>
                            <span className="font-mono">{c.sha.slice(0, 7)}</span>
                            <span>{new Date(c.author.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {prs.filter(p => p.state === 'open').length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Open Pull Requests</p>
                  <div className="space-y-0 rounded-lg border border-border/40 overflow-hidden">
                    {prs.filter(p => p.state === 'open').slice(0, 3).map((pr, i) => (
                      <div key={pr.id} className={`flex items-center gap-3 px-3 py-2.5 ${i > 0 ? 'border-t border-border/40' : ''}`}>
                        <GitPullRequest className="w-4 h-4 text-success shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">#{pr.number} {pr.title}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                            <span>{pr.author.login}</span>
                            <span>{pr.source_branch} → {pr.target_branch}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Commits sub-tab */}
          {activeTab === 'commits' && (
            <div className="space-y-0 rounded-lg border border-border/40 overflow-hidden">
              {commits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No recent commits found.</p>
              ) : (
                commits.map((c, i) => (
                  <div key={c.sha} className={`flex items-center gap-3 px-3 py-2.5 ${i > 0 ? 'border-t border-border/40' : ''}`}>
                    {c.author.avatar_url ? (
                      <img src={c.author.avatar_url} alt="" className="w-6 h-6 rounded-full shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="w-3 h-3 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{c.message.split('\n')[0]}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span>{c.author.username || c.author.name}</span>
                        <span className="font-mono">{c.sha.slice(0, 7)}</span>
                        <span>{new Date(c.author.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="shrink-0 p-1 rounded hover:bg-muted transition-colors">
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </a>
                  </div>
                ))
              )}
            </div>
          )}

          {/* PRs sub-tab */}
          {activeTab === 'prs' && (
            <div className="space-y-0 rounded-lg border border-border/40 overflow-hidden">
              {prs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No pull requests found.</p>
              ) : (
                prs.map((pr, i) => (
                  <div key={pr.id} className={`flex items-center gap-3 px-3 py-2.5 ${i > 0 ? 'border-t border-border/40' : ''}`}>
                    <GitPullRequest className={`w-4 h-4 shrink-0 ${
                      pr.state === 'open' ? 'text-success' : pr.state === 'merged' ? 'text-primary' : 'text-destructive'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-medium text-foreground truncate">#{pr.number} {pr.title}</p>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          pr.state === 'open' ? 'bg-success/10 text-success' : pr.state === 'merged' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
                        }`}>
                          {pr.state}
                        </span>
                        {pr.is_draft && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">Draft</span>}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span>{pr.author.login}</span>
                        <span>{pr.source_branch} → {pr.target_branch}</span>
                        <span>{new Date(pr.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <a href={pr.url} target="_blank" rel="noopener noreferrer" className="shrink-0 p-1 rounded hover:bg-muted transition-colors">
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </a>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {repo.external_url && (
              <a
                href={repo.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/60 bg-card hover:bg-muted text-foreground transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Open in {provider === 'gitlab' ? 'GitLab' : provider === 'bitbucket' ? 'Bitbucket' : 'GitHub'}
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ReposPage() {
  const { usage, limits } = usePlan();
  const { isDemo } = useAuth();
  const [repos, setRepos] = useState<APIRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  const loadRepos = useCallback(() => {
    if (isDemo) { setLoading(false); return; }
    setLoading(true);
    getMe()
      .then(me => getRepos(me.org_id))
      .then(apiRepos => {
        const list = Array.isArray(apiRepos) ? apiRepos : [];
        setRepos(list);
        if (list.length > 0) setExpandedRepo(list[0].id);
      })
      .catch(() => setRepos([]))
      .finally(() => setLoading(false));
  }, [isDemo]);

  useEffect(() => { loadRepos(); }, [loadRepos]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isDemo && repos.length === 0) {
    return <ReposEmptyState onImport={() => setShowImport(true)} isDemo />;
  }

  if (repos.length === 0 || showImport) {
    return (
      <RepoImportEmptyState
        onImported={() => {
          setShowImport(false);
          loadRepos();
        }}
      />
    );
  }

  if (repos.length === 0 && !showImport) {
    return <ReposEmptyState onImport={() => setShowImport(true)} isDemo={false} />;
  }

  const platformLabel = (p: string) => p === 'gitlab' ? 'GitLab' : p === 'bitbucket' ? 'Bitbucket' : 'GitHub';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
            <DownloadDoneIcon size={20} color="var(--primary)" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>Repositories</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{repos.length} {repos.length === 1 ? 'repo' : 'repos'} imported</p>
          </div>
        </div>
        <LimitWall used={usage.reposUsed} max={limits.maxRepos} noun="repos">
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors shadow-sm shadow-primary/15"
          >
            <Plus className="w-4 h-4" />
            Import More Repos
          </button>
        </LimitWall>
      </div>

      {/* Repository Cards */}
      <div className="space-y-3">
        {repos.map((repo, index) => {
          const isExpanded = expandedRepo === repo.id;
          const langColor = LANGUAGE_COLORS[repo.language ?? ''] ?? 'var(--muted-foreground)';
          const isAdditionalRepo = limits.maxRepos >= 0 && index >= limits.maxRepos;

          const repoCard = (
            <div
              key={repo.id}
              className={`bento-card rounded-2xl border overflow-hidden transition-all duration-300 ${
                isExpanded ? 'bg-card border-primary/20 shadow-sm' : 'bg-card border-border/50'
              }`}
              style={{ animation: `slide-in 0.4s ease-out ${index * 0.06}s both` }}
            >
              {/* Card header */}
              <button
                onClick={() => setExpandedRepo(isExpanded ? null : repo.id)}
                className="w-full text-left p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-lg border border-border/60 bg-muted/30 flex items-center justify-center">
                      <Code2 className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-foreground truncate">{repo.full_name || repo.name}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                          {platformLabel(repo.provider)}
                        </span>
                        {repo.language && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: langColor }} />
                            {repo.language}
                          </span>
                        )}
                        {repo.is_private && (
                          <Lock className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{repo.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:block text-[10px] text-muted-foreground">
                      {repo.default_branch}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>
              </button>

              {/* Expanded: live detail component */}
              {isExpanded && <RepoDetail repo={repo} provider={repo.provider} />}
            </div>
          );

          if (isAdditionalRepo) {
            return (
              <SectionGate key={repo.id} requiredTier="pro" label="Connect more repos with Pro">
                {repoCard}
              </SectionGate>
            );
          }
          return repoCard;
        })}
      </div>

      {/* CSS Keyframes */}
      <style jsx>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
