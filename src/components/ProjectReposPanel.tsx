'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  GitBranch,
  Search,
  Link2,
  Unlink,
  Check,
  Loader2,
  FolderGit2,
  Lock,
  Plus,
  CheckCheck,
  X,
} from 'lucide-react';
import {
  getRepos,
  getProjectRepos,
  linkRepoToProject,
  unlinkRepoFromProject,
  bulkLinkReposToProject,
  createRepo,
  type Repo,
} from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { useAuth } from '@/lib/auth';
import { usePlan } from '@/lib/plan';
import type { GitRepository, GitProvider } from '@/lib/integrations/types';

const PROVIDERS: { key: GitProvider; label: string; color: string }[] = [
  { key: 'github', label: 'GitHub', color: '#181717' },
  { key: 'gitlab', label: 'GitLab', color: '#FC6D26' },
  { key: 'bitbucket', label: 'Bitbucket', color: '#0052CC' },
];

interface Props {
  onLinked?: () => void;
}

export default function ProjectReposPanel({ onLinked }: Props) {
  const { activeProject } = useProject();
  const { user } = useAuth();
  const { isTrialing } = usePlan();

  const [orgRepos, setOrgRepos] = useState<Repo[]>([]);
  const [linkedRepos, setLinkedRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [linkingAll, setLinkingAll] = useState(false);

  const [showImport, setShowImport] = useState(false);
  const [providerRepos, setProviderRepos] = useState<GitRepository[]>([]);
  const [loadingProvider, setLoadingProvider] = useState(false);
  const [activeProvider, setActiveProvider] = useState<GitProvider | null>(null);
  const [connectedProviders, setConnectedProviders] = useState<GitProvider[]>([]);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedNames, setImportedNames] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    if (!activeProject || !user) return;
    setLoading(true);
    try {
      const [org, linked] = await Promise.all([
        getRepos(user.org_id).catch(() => []),
        getProjectRepos(activeProject.id).catch(() => []),
      ]);
      setOrgRepos(Array.isArray(org) ? org : []);
      setLinkedRepos(Array.isArray(linked) ? linked : []);
    } finally {
      setLoading(false);
    }
  }, [activeProject, user]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    async function checkProviders() {
      const connected: GitProvider[] = [];
      await Promise.all(
        PROVIDERS.map(async ({ key }) => {
          try {
            const res = await fetch(`/api/git/${key}/status`);
            const data = await res.json();
            if (data.connected) connected.push(key);
          } catch { /* skip */ }
        }),
      );
      setConnectedProviders(connected);
    }
    checkProviders();
  }, []);

  const linkedSet = new Set(linkedRepos.map((r) => r.id));
  const trialBlocksSecondLink = isTrialing && linkedRepos.length >= 1;

  const handleToggle = async (repo: Repo) => {
    if (!activeProject) return;
    if (!linkedSet.has(repo.id) && trialBlocksSecondLink) return;
    setBusyIds((prev) => new Set(prev).add(repo.id));
    try {
      if (linkedSet.has(repo.id)) {
        await unlinkRepoFromProject(activeProject.id, repo.id);
        setLinkedRepos((prev) => prev.filter((r) => r.id !== repo.id));
      } else {
        await linkRepoToProject(activeProject.id, repo.id);
        setLinkedRepos((prev) => [...prev, repo]);
      }
      onLinked?.();
    } catch { /* ignore */ }
    finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(repo.id);
        return next;
      });
    }
  };

  const handleLinkAll = async () => {
    if (!activeProject) return;
    if (trialBlocksSecondLink) return;
    setLinkingAll(true);
    try {
      await bulkLinkReposToProject(activeProject.id, { all: true });
      await loadData();
      onLinked?.();
    } catch { /* ignore */ }
    finally { setLinkingAll(false); }
  };

  const fetchProviderRepos = async (provider: GitProvider) => {
    setActiveProvider(provider);
    setLoadingProvider(true);
    setProviderRepos([]);
    try {
      const res = await fetch(`/api/git/${provider}/repos?per_page=100`);
      if (res.ok) setProviderRepos(await res.json());
    } catch { /* ignore */ }
    finally { setLoadingProvider(false); }
  };

  const handleImportRepo = async (repo: GitRepository) => {
    if (!user || !activeProject) return;
    if (trialBlocksSecondLink) return;
    setImportingId(repo.full_name);
    try {
      const newRepo = await createRepo({
        org_id: user.org_id,
        name: repo.name,
        full_name: repo.full_name,
        provider: repo.provider,
        default_branch: repo.default_branch,
        language: repo.language,
        description: repo.description,
        external_url: repo.url,
        is_private: repo.is_private,
      });
      if (newRepo?.id) {
        await linkRepoToProject(activeProject.id, newRepo.id);
      }
      setImportedNames((prev) => new Set(prev).add(repo.full_name));
      await loadData();
      onLinked?.();
    } catch { /* might already exist */ setImportedNames((prev) => new Set(prev).add(repo.full_name)); }
    finally { setImportingId(null); }
  };

  const filtered = orgRepos.filter((r) =>
    r.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const providerFiltered = providerRepos.filter((r) => {
    const alreadyImported = orgRepos.some((o) => o.full_name === r.full_name);
    if (alreadyImported) return false;
    return r.full_name.toLowerCase().includes(search.toLowerCase());
  });

  if (!activeProject) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        Select a project to manage repos
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Loading repos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2" style={{ fontFamily: 'var(--font-serif)' }}>
          <FolderGit2 className="w-4 h-4 text-primary" />
          Project Repositories
          <span className="text-xs font-normal text-muted-foreground">({linkedRepos.length} linked)</span>
        </h3>
        <div className="flex items-center gap-2">
          {orgRepos.length > 0 && (
            <button
              onClick={handleLinkAll}
              disabled={linkingAll || trialBlocksSecondLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary hover:bg-primary/90 text-white transition-colors disabled:opacity-50"
            >
              {linkingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
              Attach All
            </button>
          )}
          <button
            onClick={() => { setShowImport(!showImport); if (!showImport && connectedProviders.length > 0 && !activeProvider) fetchProviderRepos(connectedProviders[0]); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 border border-border text-foreground transition-colors"
          >
            <Plus className="w-3 h-3" />
            Import from Provider
          </button>
        </div>
      </div>

      {trialBlocksSecondLink && (
        <p className="text-[11px] text-muted-foreground rounded-lg border border-border/80 bg-muted/30 px-3 py-2">
          During your Pro trial, link one repository per project. Unlink to switch repos, or finish your plan to attach more.
        </p>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search repositories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Org repos with toggle */}
      {filtered.length > 0 ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          {filtered.map((repo) => {
            const isLinked = linkedSet.has(repo.id);
            const busy = busyIds.has(repo.id);
            return (
              <div key={repo.id} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <GitBranch className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{repo.full_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground capitalize">{repo.provider}</span>
                      {repo.is_private && <Lock className="w-2.5 h-2.5 text-muted-foreground" />}
                      {repo.language && <span className="text-[10px] text-muted-foreground">{repo.language}</span>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(repo)}
                  disabled={busy || (!isLinked && trialBlocksSecondLink)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    isLinked
                      ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20'
                      : 'bg-muted text-muted-foreground border border-border hover:bg-primary/10 hover:text-primary hover:border-primary/20'
                  } disabled:opacity-50`}
                >
                  {busy ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : isLinked ? (
                    <>
                      <Check className="w-3 h-3" />
                      Linked
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3 h-3" />
                      Attach
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ) : !showImport ? (
        <div className="text-center py-8 rounded-xl border border-dashed border-border bg-card">
          <GitBranch className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-2">
            {orgRepos.length === 0 ? 'No repos imported yet' : 'No repos match your search'}
          </p>
          {connectedProviders.length > 0 && (
            <button
              onClick={() => { setShowImport(true); if (!activeProvider) fetchProviderRepos(connectedProviders[0]); }}
              className="text-xs text-primary hover:underline"
            >
              Import from {connectedProviders[0]}
            </button>
          )}
        </div>
      ) : null}

      {/* Import from provider */}
      {showImport && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-2">
              {connectedProviders.map((p) => (
                <button
                  key={p}
                  onClick={() => fetchProviderRepos(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    activeProvider === p ? 'bg-primary text-white' : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
                  }`}
                >
                  {PROVIDERS.find((pp) => pp.key === p)?.label ?? p}
                </button>
              ))}
            </div>
            <button onClick={() => setShowImport(false)} className="p-1 rounded hover:bg-muted text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          {loadingProvider ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <span className="ml-2 text-xs text-muted-foreground">Fetching repos...</span>
            </div>
          ) : providerFiltered.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              {connectedProviders.length === 0
                ? 'No git providers connected. Go to Integrations to connect.'
                : 'All repos already imported or no repos found.'}
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-border">
              {providerFiltered.slice(0, 50).map((repo) => (
                <div key={repo.full_name} className="flex items-center justify-between px-4 py-2.5 hover:bg-secondary/40 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <GitBranch className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-foreground truncate">{repo.full_name}</span>
                    {repo.is_private && <Lock className="w-2.5 h-2.5 text-muted-foreground shrink-0" />}
                  </div>
                  <button
                    onClick={() => handleImportRepo(repo)}
                    disabled={
                      trialBlocksSecondLink || importingId === repo.full_name || importedNames.has(repo.full_name)
                    }
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                  >
                    {importingId === repo.full_name ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : importedNames.has(repo.full_name) ? (
                      <><Check className="w-3 h-3" /> Imported</>
                    ) : (
                      <><Plus className="w-3 h-3" /> Import & Attach</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
