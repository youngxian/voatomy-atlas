'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  GitBranch,
  Loader2,
  MessageSquare,
  ArrowRight,
  Building2,
  User,
  Check,
  Hash,
  LayoutGrid,
} from 'lucide-react';
import clsx from 'clsx';
import { useGitIntegration } from '@/lib/integrations/use-git-integration';
import { useProject } from '@/lib/project-context';
import { useAuth } from '@/lib/auth';
import ProviderProjectPicker from '@/components/ProviderProjectPicker';
import {
  getRepos,
  getProjectRepos,
  linkRepoToProject,
  createRepo,
  listIntegrations,
  connectIntegration,
  completeOAuthCallback,
  type Repo,
  type ConnectedIntegration,
  type ImportProviderResult,
} from '@/lib/api';
import type { GitRepository } from '@/lib/integrations/types';
import { setTrialGuidedComplete } from '@/lib/trial-guided-setup';

const FLOW_KEY = 'atlas_welcome_flow';
const TRIAL_PHASE_KEY = 'atlas_trial_onboard_phase';

type RepoScope = 'personal' | 'org';

type TrialPhase = 'board' | 'repo' | 'notify';

function TrialPhaseStepper({ phase }: { phase: TrialPhase }) {
  const order: TrialPhase[] = ['board', 'repo', 'notify'];
  const currentIndex = order.indexOf(phase);
  const labels: Record<TrialPhase, string> = {
    board: 'Project board',
    repo: 'Repository',
    notify: 'Team alerts',
  };
  return (
    <nav aria-label="Trial setup steps" className="mb-5">
      <ol className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-2 sm:gap-y-2">
        {order.map((id, i) => {
          const done = i < currentIndex;
          const current = i === currentIndex;
          return (
            <li key={id} className="flex items-center gap-2">
              {i > 0 && (
                <span className="hidden sm:inline text-muted-foreground/35 select-none text-xs" aria-hidden>
                  →
                </span>
              )}
              <div
                className={clsx(
                  'flex flex-1 sm:flex-none items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-semibold transition-colors',
                  done && 'border-primary/35 bg-primary/8 text-primary',
                  current && 'border-primary bg-primary/12 text-foreground shadow-sm ring-1 ring-primary/20',
                  !done && !current && 'border-border/80 bg-muted/30 text-muted-foreground',
                )}
              >
                <span
                  className={clsx(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                    done && 'bg-primary text-white',
                    current && 'bg-primary text-white',
                    !done && !current && 'bg-muted text-muted-foreground',
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="text-left leading-tight">{labels[id]}</span>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-[10px] text-center text-muted-foreground mt-3 max-w-md mx-auto">
        You can skip any step and finish later from the trial banner (Integrations, Repos, Billing).
      </p>
    </nav>
  );
}

interface BoardProviderOption {
  key: string;
  name: string;
  description: string;
  letter: string;
  color: string;
}

const BOARD_PROVIDERS: BoardProviderOption[] = [
  { key: 'clickup', name: 'ClickUp', description: 'Spaces, lists, tasks & sprints', letter: 'C', color: '#7B68EE' },
  { key: 'jira', name: 'Jira', description: 'Projects, boards & sprints', letter: 'J', color: '#2684FF' },
  { key: 'linear', name: 'Linear', description: 'Teams, cycles & issues', letter: 'L', color: '#5E6AD2' },
  { key: 'asana', name: 'Asana', description: 'Projects, sections & tasks', letter: 'A', color: '#F06A6A' },
  { key: 'monday', name: 'Monday', description: 'Boards, groups & items', letter: 'M', color: '#FF3D57' },
  { key: 'github_projects', name: 'GitHub Projects', description: 'Project V2, issues & iterations', letter: 'GH', color: '#238636' },
  { key: 'azuredevops', name: 'Azure DevOps', description: 'Work items, iterations & boards', letter: 'Az', color: '#0078D7' },
  { key: 'shortcut', name: 'Shortcut', description: 'Stories, iterations & epics', letter: 'Sc', color: '#58B1E4' },
];

const PM_PROVIDER_KEYS = new Set(BOARD_PROVIDERS.map((p) => p.key));

interface TrialOnboardingStepProps {
  onComplete: () => void;
}

function saveWelcomeStep(next: 'trial' | 'prefs') {
  try {
    const prev = JSON.parse(sessionStorage.getItem(FLOW_KEY) || '{}');
    sessionStorage.setItem(FLOW_KEY, JSON.stringify({ ...prev, choseTrial: true, step: next }));
  } catch {
    sessionStorage.setItem(FLOW_KEY, JSON.stringify({ choseTrial: true, step: next }));
  }
}

function clearTrialPhase() {
  try {
    sessionStorage.removeItem(TRIAL_PHASE_KEY);
  } catch {
    /* ignore */
  }
}

export default function TrialOnboardingStep({ onComplete }: TrialOnboardingStepProps) {
  const { user, isDemo } = useAuth();
  const { activeProject, projects, refreshProjects, setActiveProject, setDefaultProject } = useProject();
  const github = useGitIntegration('github');
  const gitlab = useGitIntegration('gitlab');
  const [gitProvider, setGitProvider] = useState<'github' | 'gitlab'>('github');
  const git = gitProvider === 'github' ? github : gitlab;

  const [phase, setPhaseState] = useState<TrialPhase>(() => {
    if (typeof window === 'undefined') return 'board';
    const p = sessionStorage.getItem(TRIAL_PHASE_KEY);
    if (p === 'repo' || p === 'notify' || p === 'board') return p;
    return 'board';
  });

  const setPhase = (p: TrialPhase) => {
    try {
      sessionStorage.setItem(TRIAL_PHASE_KEY, p);
    } catch {
      /* ignore */
    }
    setPhaseState(p);
  };

  const [showBoardPicker, setShowBoardPicker] = useState(false);
  const [pickerProvider, setPickerProvider] = useState<string | null>(null);
  const [boardImportDone, setBoardImportDone] = useState(false);
  const [skippedBoard, setSkippedBoard] = useState(false);
  const [connectingPm, setConnectingPm] = useState<string | null>(null);
  const pmOAuthHandled = useRef(false);
  const [scope, setScope] = useState<RepoScope>('personal');
  const [orgRepos, setOrgRepos] = useState<Repo[]>([]);
  const [linkedRepos, setLinkedRepos] = useState<Repo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [busy, setBusy] = useState(false);
  const [integrations, setIntegrations] = useState<ConnectedIntegration[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);

  const loadRepos = useCallback(async () => {
    if (!activeProject || !user) return;
    setLoadingRepos(true);
    try {
      const [org, linked] = await Promise.all([
        getRepos(user.org_id).catch(() => []),
        getProjectRepos(activeProject.id).catch(() => []),
      ]);
      setOrgRepos(Array.isArray(org) ? org : []);
      setLinkedRepos(Array.isArray(linked) ? linked : []);
    } finally {
      setLoadingRepos(false);
    }
  }, [activeProject, user]);

  useEffect(() => {
    loadRepos();
  }, [loadRepos]);

  useEffect(() => {
    if (gitProvider === 'github') {
      if (github.connected && github.repos.length === 0 && !github.loading) {
        void github.fetchRepos({ per_page: 100 });
      }
    } else if (gitlab.connected && gitlab.repos.length === 0 && !gitlab.loading) {
      void gitlab.fetchRepos({ per_page: 100 });
    }
  }, [
    gitProvider,
    github.connected,
    github.repos.length,
    github.loading,
    github.fetchRepos,
    gitlab.connected,
    gitlab.repos.length,
    gitlab.loading,
    gitlab.fetchRepos,
  ]);

  const username = (git.user?.username ?? '').toLowerCase();

  const gitReposFiltered = useMemo(() => {
    const list = git.repos;
    if (!username) return list;
    return list.filter((r) => {
      const owner = r.full_name.split('/')[0]?.toLowerCase() ?? '';
      return scope === 'personal' ? owner === username : owner !== username;
    });
  }, [git.repos, username, scope]);

  const refreshIntegrations = useCallback(() => {
    listIntegrations()
      .then((list) => setIntegrations(Array.isArray(list) ? list : []))
      .catch(() => setIntegrations([]));
  }, []);

  useEffect(() => {
    refreshIntegrations();
  }, [refreshIntegrations, phase]);

  useEffect(() => {
    const onFocus = () => refreshIntegrations();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshIntegrations]);

  // PM OAuth return on /dashboard?welcome_pm=1&provider=…&code=…&state=…
  useEffect(() => {
    if (typeof window === 'undefined' || pmOAuthHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('welcome_pm') !== '1') return;
    const code = params.get('code');
    let state = params.get('state');
    const provider = params.get('provider');
    if (!code || !provider) return;
    if (!state) {
      state = localStorage.getItem(`oauth_state_${provider}`);
      localStorage.removeItem(`oauth_state_${provider}`);
    }
    if (!state) return;
    pmOAuthHandled.current = true;
    void (async () => {
      try {
        await completeOAuthCallback(provider, code, state);
        await refreshIntegrations();
        setPickerProvider(provider);
        setShowBoardPicker(true);
        setPhase('board');
      } catch {
        pmOAuthHandled.current = false;
      } finally {
        const url = new URL(window.location.href);
        url.searchParams.delete('code');
        url.searchParams.delete('state');
        url.searchParams.delete('welcome_pm');
        url.searchParams.delete('provider');
        window.history.replaceState({}, '', `${url.pathname}${url.search}`);
      }
    })();
  }, [refreshIntegrations]);

  const pmIntegration = integrations.find(
    (i) => PM_PROVIDER_KEYS.has(i.provider) && (i.status === 'connected' || i.status === 'syncing'),
  );
  const hasPmConnected = !!pmIntegration;

  const canProceedFromBoard =
    boardImportDone || skippedBoard || (hasPmConnected && projects.length > 0);

  const handleBoardImported = async (result: ImportProviderResult) => {
    setBoardImportDone(true);
    setShowBoardPicker(false);
    await refreshProjects();
    const first = result.created?.[0];
    if (first?.id) {
      setActiveProject(first.id);
      setDefaultProject(first.id);
    }
  };

  const startPmOAuth = (providerKey: string) => {
    saveWelcomeStep('trial');
    setConnectingPm(providerKey);
    void (async () => {
      try {
        const result = await connectIntegration(providerKey, {
          redirect_url: `${window.location.origin}/dashboard?welcome_pm=1&provider=${encodeURIComponent(providerKey)}`,
        });
        if (result.auth_url) {
          if (result.state) {
            localStorage.setItem(`oauth_state_${providerKey}`, result.state);
          }
          window.location.href = result.auth_url;
        }
      } catch {
        setConnectingPm(null);
      }
    })();
  };

  const openPickerForConnectedPm = () => {
    const key = pmIntegration?.provider;
    if (!key) return;
    setPickerProvider(key);
    setShowBoardPicker(true);
  };

  const slackConnected = integrations.some(
    (i) => i.provider === 'slack' && (i.status === 'connected' || i.status === 'syncing'),
  );
  const teamsConnected = integrations.some(
    (i) => i.provider === 'teams' && (i.status === 'connected' || i.status === 'syncing'),
  );

  const hasLinkedOne = linkedRepos.length >= 1;

  const linkGitImport = async (repo: GitRepository) => {
    if (!user || !activeProject || busy) return;
    if (hasLinkedOne) return;
    setBusy(true);
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
      await loadRepos();
    } catch {
      /* may already exist — try link existing */
      const existing = orgRepos.find((r) => r.full_name === repo.full_name);
      if (existing && activeProject) {
        try {
          await linkRepoToProject(activeProject.id, existing.id);
          await loadRepos();
        } catch {
          /* ignore */
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const linkOrgRepo = async (repo: Repo) => {
    if (!activeProject || busy || hasLinkedOne) return;
    setBusy(true);
    try {
      await linkRepoToProject(activeProject.id, repo.id);
      await loadRepos();
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  const startOAuthConnect = (provider: 'slack' | 'teams') => {
    saveWelcomeStep('trial');
    setConnecting(provider);
    void (async () => {
      try {
        const result = await connectIntegration(provider, {
          redirect_url: `${window.location.origin}/integrations?provider=${provider}`,
        });
        if (result.auth_url) {
          if (result.state) {
            localStorage.setItem(`oauth_state_${provider}`, result.state);
          }
          window.location.href = result.auth_url;
        }
      } catch {
        setConnecting(null);
      }
    })();
  };

  const finishTrialSetup = () => {
    clearTrialPhase();
    saveWelcomeStep('prefs');
    setTrialGuidedComplete();
    onComplete();
  };

  const handleDemoSkip = () => {
    finishTrialSetup();
  };

  if (isDemo) {
    return (
      <div className="space-y-4 text-center px-2">
        <p className="text-sm text-muted-foreground">
          Demo mode skips live board, Git, and Slack/Teams connections. In a real workspace, you would connect a project board, one repository, and a team channel here.
        </p>
        <button
          type="button"
          onClick={handleDemoSkip}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pickerProvider && (
        <ProviderProjectPicker
          provider={pickerProvider}
          open={showBoardPicker}
          onClose={() => setShowBoardPicker(false)}
          onImported={handleBoardImported}
        />
      )}

      <TrialPhaseStepper phase={phase} />

      {phase === 'board' && (
        <>
          <div className="text-center space-y-1">
            <h3 className="text-lg font-semibold text-foreground">Connect your project board</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Import Jira, Linear, ClickUp, or another tool so ATLAS can read sprints and backlog. Read-only OAuth — you can skip and connect later.
            </p>
          </div>

          {hasPmConnected && !boardImportDone && projects.length === 0 && (
            <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-center">
              <p className="text-xs text-foreground font-medium mb-2">{pmIntegration?.display_name ?? 'Your tool'} is connected</p>
              <button
                type="button"
                onClick={openPickerForConnectedPm}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Choose board to import
              </button>
            </div>
          )}

          {hasPmConnected && projects.length > 0 && !boardImportDone && (
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground">
                You already have {projects.length} project{projects.length === 1 ? '' : 's'} in ATLAS. Continue to link a repo, or import another board.
              </p>
              <button
                type="button"
                onClick={openPickerForConnectedPm}
                className="mt-2 text-xs font-semibold text-primary hover:underline"
              >
                Import another board
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[min(40vh,280px)] overflow-y-auto pr-1">
            {BOARD_PROVIDERS.map((p) => (
              <button
                key={p.key}
                type="button"
                disabled={connectingPm !== null}
                onClick={() => startPmOAuth(p.key)}
                className="rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 disabled:opacity-50"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white mb-2"
                  style={{ backgroundColor: p.color }}
                >
                  {connectingPm === p.key ? <Loader2 className="w-4 h-4 animate-spin" /> : p.letter}
                </div>
                <p className="text-xs font-semibold text-foreground leading-tight">{p.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center gap-2 pt-2">
            <button
              type="button"
              disabled={!canProceedFromBoard}
              onClick={() => {
                saveWelcomeStep('trial');
                setPhase('repo');
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-40"
            >
              Continue to repository
              <ArrowRight className="w-4 h-4" />
            </button>
            {!canProceedFromBoard && (
              <p className="text-[10px] text-muted-foreground text-center max-w-sm">
                Connect a tool and import a board, or skip if you already use ATLAS with a project.
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setSkippedBoard(true);
                saveWelcomeStep('trial');
                setPhase('repo');
              }}
              className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
            >
              Skip — I will connect a board later
            </button>
          </div>
        </>
      )}

      {phase === 'repo' && !activeProject && (
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Select or create a project from the sidebar, or go back and import a board to create one automatically.
          </p>
          <button
            type="button"
            onClick={() => setPhase('board')}
            className="text-xs font-semibold text-primary hover:underline"
          >
            ← Back to board setup
          </button>
        </div>
      )}

      {phase === 'repo' && activeProject && (
        <>
          <button
            type="button"
            onClick={() => setPhase('board')}
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground mb-1"
          >
            ← Back to board setup
          </button>
          <div className="text-center space-y-1">
            <h3 className="text-lg font-semibold text-foreground">Connect one repository</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              During your Pro trial setup, link a single repo from your personal account or an organization. You can add more after you choose a plan.
            </p>
          </div>

          <div className="flex rounded-xl border border-border p-1 bg-muted/40">
            <button
              type="button"
              onClick={() => setGitProvider('github')}
              className={clsx(
                'flex-1 rounded-lg py-2 text-xs font-semibold transition-colors',
                gitProvider === 'github' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              GitHub
            </button>
            <button
              type="button"
              onClick={() => setGitProvider('gitlab')}
              className={clsx(
                'flex-1 rounded-lg py-2 text-xs font-semibold transition-colors',
                gitProvider === 'gitlab' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              GitLab
            </button>
          </div>

          {!git.connected ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center space-y-3">
              <GitBranch className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                Authorize {gitProvider === 'github' ? 'GitHub' : 'GitLab'} to list repositories. You will return to the app to pick one repo.
              </p>
              <button
                type="button"
                onClick={() => git.connect()}
                className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background"
              >
                Connect {gitProvider === 'github' ? 'GitHub' : 'GitLab'}
              </button>
            </div>
          ) : (
            <>
              {username ? (
                <div className="flex rounded-xl border border-border p-1 bg-muted/30">
                  <button
                    type="button"
                    onClick={() => setScope('personal')}
                    className={clsx(
                      'flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors',
                      scope === 'personal' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
                    )}
                  >
                    <User className="w-3.5 h-3.5" />
                    Personal
                  </button>
                  <button
                    type="button"
                    onClick={() => setScope('org')}
                    className={clsx(
                      'flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors',
                      scope === 'org' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
                    )}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    Organization
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground text-center">
                  Choose one repository below (personal vs org filters appear when your username is available).
                </p>
              )}

              {git.loading && git.repos.length === 0 ? (
                <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading repositories…
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                  {gitReposFiltered.length === 0 ? (
                    <p className="p-4 text-xs text-muted-foreground text-center">
                      No repositories in this tab. Try the other tab or confirm your org access on {gitProvider}.
                    </p>
                  ) : (
                    gitReposFiltered.slice(0, 40).map((repo) => {
                      const imported = orgRepos.some((r) => r.full_name === repo.full_name);
                      const linked = linkedRepos.some((r) => r.full_name === repo.full_name);
                      const existingOrg = orgRepos.find((r) => r.full_name === repo.full_name);
                      return (
                        <div key={repo.full_name} className="flex items-center justify-between gap-2 px-3 py-2.5">
                          <span className="text-xs text-foreground truncate">{repo.full_name}</span>
                          <button
                            type="button"
                            disabled={busy || (hasLinkedOne && !linked)}
                            onClick={() => {
                              if (imported && existingOrg) void linkOrgRepo(existingOrg);
                              else void linkGitImport(repo);
                            }}
                            className="shrink-0 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary hover:bg-primary hover:text-white disabled:opacity-40"
                          >
                            {linked ? (
                              <span className="inline-flex items-center gap-1">
                                <Check className="w-3 h-3" /> Linked
                              </span>
                            ) : busy ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : imported ? (
                              'Attach'
                            ) : (
                              'Import & attach'
                            )}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {orgRepos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Already in ATLAS</p>
                  <div className="max-h-32 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                    {orgRepos.slice(0, 20).map((repo) => {
                      const linked = linkedRepos.some((r) => r.id === repo.id);
                      return (
                        <div key={repo.id} className="flex items-center justify-between gap-2 px-3 py-2">
                          <span className="text-xs truncate">{repo.full_name}</span>
                          <button
                            type="button"
                            disabled={busy || (hasLinkedOne && !linked)}
                            onClick={() => linkOrgRepo(repo)}
                            className="text-[10px] font-semibold text-primary disabled:opacity-40"
                          >
                            {linked ? 'Linked' : 'Attach'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex flex-col items-center gap-2 pt-2">
            <button
              type="button"
              disabled={!hasLinkedOne}
              onClick={() => {
                saveWelcomeStep('trial');
                setPhase('notify');
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-40"
            >
              Continue to team notifications
              <ArrowRight className="w-4 h-4" />
            </button>
            {!hasLinkedOne && (
              <p className="text-[10px] text-muted-foreground">Link exactly one repository to continue.</p>
            )}
          </div>
        </>
      )}

      {phase === 'notify' && (
        <>
          <div className="text-center space-y-1">
            <h3 className="text-lg font-semibold text-foreground">Team notifications</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Connect Slack or Microsoft Teams so sprint updates and AI insights reach your channel.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              className={clsx(
                'rounded-xl border p-4 space-y-3',
                slackConnected ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border bg-card',
              )}
            >
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-[#4A154B]/15 flex items-center justify-center">
                  <Hash className="w-4 h-4 text-[#4A154B]" />
                </div>
                <span className="text-sm font-semibold">Slack</span>
                {slackConnected && <Check className="w-4 h-4 text-emerald-600 ml-auto" />}
              </div>
              <p className="text-[11px] text-muted-foreground">Post digest and alerts to a workspace channel.</p>
              {!slackConnected && (
                <button
                  type="button"
                  disabled={connecting !== null}
                  onClick={() => startOAuthConnect('slack')}
                  className="w-full rounded-lg bg-[#4A154B] py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {connecting === 'slack' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Connect Slack'}
                </button>
              )}
            </div>

            <div
              className={clsx(
                'rounded-xl border p-4 space-y-3',
                teamsConnected ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border bg-card',
              )}
            >
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-[#6264A7]/15 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-[#6264A7]" />
                </div>
                <span className="text-sm font-semibold">Microsoft Teams</span>
                {teamsConnected && <Check className="w-4 h-4 text-emerald-600 ml-auto" />}
              </div>
              <p className="text-[11px] text-muted-foreground">Send notifications via Teams incoming webhook OAuth.</p>
              {!teamsConnected && (
                <button
                  type="button"
                  disabled={connecting !== null}
                  onClick={() => startOAuthConnect('teams')}
                  className="w-full rounded-lg py-2 text-xs font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: '#6264A7' }}
                >
                  {connecting === 'teams' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Connect Teams'}
                </button>
              )}
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            After OAuth you may land on Integrations — open the dashboard from the sidebar to return here; your progress is saved.
          </p>

          <div className="flex flex-col items-center gap-2 pt-2">
            <button
              type="button"
              disabled={!slackConnected && !teamsConnected}
              onClick={finishTrialSetup}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-40"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
            <button type="button" onClick={finishTrialSetup} className="text-[11px] text-muted-foreground underline-offset-2 hover:underline">
              Skip for now — I will connect Slack or Teams later
            </button>
          </div>
        </>
      )}
    </div>
  );
}
