'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Circle, LayoutGrid, GitBranch, MessageSquare, Users, Sparkles, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { usePlan } from '@/lib/plan';
import { useProject } from '@/lib/project-context';
import {
  listIntegrations,
  getProjectRepos,
  getTeamMembers,
  type ConnectedIntegration,
  type Repo,
} from '@/lib/api';
import { isTrialGuidedComplete, setTrialGuidedComplete, TRIAL_GUIDED_UPDATED_EVENT } from '@/lib/trial-guided-setup';

/** Must match PM keys used in TrialOnboardingStep (BOARD_PROVIDERS). */
const PM_PROVIDER_KEYS = new Set([
  'clickup',
  'jira',
  'linear',
  'asana',
  'monday',
  'github_projects',
  'azuredevops',
  'shortcut',
]);

function pmConnected(integrations: ConnectedIntegration[]) {
  return integrations.some(
    (i) => PM_PROVIDER_KEYS.has(i.provider) && (i.status === 'connected' || i.status === 'syncing'),
  );
}

function chatConnected(integrations: ConnectedIntegration[]) {
  const slack = integrations.some(
    (i) => i.provider === 'slack' && (i.status === 'connected' || i.status === 'syncing'),
  );
  const teams = integrations.some(
    (i) => i.provider === 'teams' && (i.status === 'connected' || i.status === 'syncing'),
  );
  return slack || teams;
}

export default function TrialSetupChecklist() {
  const { isTrialing } = usePlan();
  const { activeProject, projects } = useProject();
  const [guidedDone, setGuidedDone] = useState(() => isTrialGuidedComplete());
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<ConnectedIntegration[]>([]);
  const [linkedRepos, setLinkedRepos] = useState<Repo[]>([]);
  const [teamCount, setTeamCount] = useState(0);

  const refresh = useCallback(async () => {
    setGuidedDone(isTrialGuidedComplete());
    setLoading(true);
    try {
      const integ = await listIntegrations().catch(() => [] as ConnectedIntegration[]);
      setIntegrations(Array.isArray(integ) ? integ : []);

      if (activeProject) {
        const [repos, members] = await Promise.all([
          getProjectRepos(activeProject.id).catch(() => [] as Repo[]),
          getTeamMembers(activeProject.id).catch(() => [] as { id: string }[]),
        ]);
        setLinkedRepos(Array.isArray(repos) ? repos : []);
        setTeamCount(Array.isArray(members) ? members.length : 0);
      } else {
        setLinkedRepos([]);
        setTeamCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, [activeProject]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onUpdated = () => {
      setGuidedDone(isTrialGuidedComplete());
    };
    const onFocus = () => void refresh();
    window.addEventListener(TRIAL_GUIDED_UPDATED_EVENT, onUpdated);
    window.addEventListener('storage', onUpdated);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener(TRIAL_GUIDED_UPDATED_EVENT, onUpdated);
      window.removeEventListener('storage', onUpdated);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  if (!isTrialing || guidedDone) return null;

  const hasPm = pmConnected(integrations);
  const boardOrProject = projects.length > 0 || hasPm;
  const repoOk = linkedRepos.length >= 1;
  const notifyOk = chatConnected(integrations);
  const teammatesOk = teamCount >= 2;

  const rows: { id: string; label: string; done: boolean; href: string; actionLabel: string }[] = [
    {
      id: 'board',
      label: 'Project board connected or project in ATLAS',
      done: boardOrProject,
      href: '/integrations',
      actionLabel: 'Integrations',
    },
    {
      id: 'repo',
      label: 'At least one repository linked to this project',
      done: repoOk,
      href: '/repos',
      actionLabel: 'Repos',
    },
    {
      id: 'notify',
      label: 'Slack or Microsoft Teams connected',
      done: notifyOk,
      href: '/integrations',
      actionLabel: 'Team alerts',
    },
    {
      id: 'team',
      label: 'Invite teammates (2+ members on this project)',
      done: teammatesOk,
      href: '/team',
      actionLabel: 'Team',
    },
  ];

  const doneCount = rows.filter((r) => r.done).length;

  const openWizard = () => {
    window.dispatchEvent(new CustomEvent('atlas-open-welcome-setup'));
  };

  const markComplete = () => {
    setTrialGuidedComplete();
    setGuidedDone(true);
  };

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/[0.04] px-4 py-3.5 mb-4 sm:mb-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/12">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">Finish your Pro trial setup</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              One board, one repo, team notifications — {doneCount}/{rows.length} complete
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={openWizard}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
          >
            Open setup wizard
          </button>
          <button
            type="button"
            onClick={markComplete}
            className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            Mark complete
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Checking your workspace…
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((row) => {
            const Icon =
              row.id === 'board' ? LayoutGrid : row.id === 'repo' ? GitBranch : row.id === 'notify' ? MessageSquare : Users;
            return (
              <li
                key={row.id}
                className={clsx(
                  'flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs',
                  row.done ? 'border-emerald-500/30 bg-emerald-500/[0.06]' : 'border-border/80 bg-card/60',
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {row.done ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />
                  )}
                  <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <span className={clsx('font-medium', row.done ? 'text-foreground' : 'text-muted-foreground')}>
                    {row.label}
                  </span>
                </div>
                <Link
                  href={row.href}
                  className="shrink-0 text-[11px] font-semibold text-primary hover:underline"
                >
                  {row.actionLabel}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
