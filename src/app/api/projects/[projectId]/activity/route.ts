import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { config } from '@/lib/config';
import { getTokens } from '@/lib/integrations/token-store';
import { isGitProvider, getGitService } from '@/lib/integrations';
import type { GitCommit, GitPullRequest, GitPipeline } from '@/lib/integrations/types';

export interface ActivityFeedItem {
  id: string;
  type: 'commit' | 'PR' | 'deploy' | 'comment';
  text: string;
  author: { name: string; initials: string };
  time: string;
  timestamp: string;
  url?: string;
  ticketRef?: { external_id: string; id: string };
  repo?: string;
  branch?: string;
  sha?: string;
}

export interface ActivityStats {
  commitsToday: number;
  prsMerged: number;
  deployments: number;
  comments: number;
}

export interface UserBreakdown {
  name: string;
  initials: string;
  commits: number;
  prs: number;
  comments: number;
  deployments: number;
  total: number;
  items: ActivityFeedItem[];
}

export interface ActivityResponse {
  stats: ActivityStats;
  feed: ActivityFeedItem[];
  userBreakdown: Record<string, UserBreakdown>;
  byType: {
    commit: ActivityFeedItem[];
    PR: ActivityFeedItem[];
    deploy: ActivityFeedItem[];
    comment: ActivityFeedItem[];
  };
  range: string;
}

function toInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffM < 1) return 'just now';
  if (diffM < 60) return `${diffM}m ago`;
  if (diffH < 24) return `${diffH}h ago`;
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString();
}

async function fetchAtlas<T>(path: string, cookieHeader: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${config.atlasApiBase}${path}`, {
    headers: {
      Cookie: cookieHeader,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    signal,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || res.statusText);
  }
  const json = await res.json();
  return (json.data ?? json) as T;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const cookieHeader = `session=${session}`;

  const since = request.nextUrl.searchParams.get('since') ?? undefined;
  const until = request.nextUrl.searchParams.get('until') ?? undefined;
  const range = request.nextUrl.searchParams.get('range') ?? 'sprint';

  const routeAbort = new AbortController();
  const routeTimeout = setTimeout(() => routeAbort.abort(), 20_000);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  function computeSinceFromRange(r: string): string {
    switch (r) {
      case 'today': {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
      }
      case '7d': {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString();
      }
      case '14d': {
        const d = new Date();
        d.setDate(d.getDate() - 14);
        return d.toISOString();
      }
      case '30d': {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString();
      }
      case 'sprint':
      default: {
        const d = new Date();
        d.setDate(d.getDate() - 14);
        return d.toISOString();
      }
    }
  }

  const sinceIso = since ?? computeSinceFromRange(range);

  const stats: ActivityStats = {
    commitsToday: 0,
    prsMerged: 0,
    deployments: 0,
    comments: 0,
  };
  const feed: ActivityFeedItem[] = [];

  function buildAggregates(allFeed: ActivityFeedItem[]) {
    allFeed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const ub: Record<string, UserBreakdown> = {};
    for (const item of allFeed) {
      const key = item.author.name;
      if (!ub[key]) {
        ub[key] = { name: item.author.name, initials: item.author.initials, commits: 0, prs: 0, comments: 0, deployments: 0, total: 0, items: [] };
      }
      ub[key].total++;
      if (item.type === 'commit') ub[key].commits++;
      else if (item.type === 'PR') ub[key].prs++;
      else if (item.type === 'comment') ub[key].comments++;
      else if (item.type === 'deploy') ub[key].deployments++;
      ub[key].items.push(item);
    }
    return {
      userBreakdown: ub,
      byType: {
        commit: allFeed.filter((i) => i.type === 'commit'),
        PR: allFeed.filter((i) => i.type === 'PR'),
        deploy: allFeed.filter((i) => i.type === 'deploy'),
        comment: allFeed.filter((i) => i.type === 'comment'),
      },
    };
  }

  const TICKET_ID_REGEX = /\b([A-Z][A-Z0-9]*-\d+)\b/gi;

  function parseTicketRefs(text: string): string[] {
    if (!text) return [];
    const matches: string[] = [];
    let m: RegExpExecArray | null;
    const re = new RegExp(TICKET_ID_REGEX.source, 'gi');
    while ((m = re.exec(text)) !== null) {
      const ref = m[1].toUpperCase();
      if (!matches.includes(ref)) matches.push(ref);
    }
    return matches;
  }

  function findTicketRef(
    title: string,
    branch: string,
    ticketMap: Map<string, { id: string; external_id: string }>,
  ): { external_id: string; id: string } | undefined {
    const refs = [...parseTicketRefs(title), ...parseTicketRefs(branch || '')];
    for (const ref of refs) {
      const t = ticketMap.get(ref);
      if (t) return { external_id: t.external_id, id: t.id };
    }
    return undefined;
  }

  try {
    const [repos, ticketsResp, commentsResp] = await Promise.all([
      fetchAtlas<{ id: string; full_name: string; provider: string }[]>(
        `/v1/projects/${projectId}/repos`,
        cookieHeader,
        routeAbort.signal,
      ),
      fetchAtlas<{ id: string; external_id: string }[]>(`/v1/projects/${projectId}/tickets`, cookieHeader, routeAbort.signal).catch(
        () => [] as { id: string; external_id: string }[],
      ),
      fetchAtlas<{ comments: Array<{ id: string; ticket_id: string; ticket_external_id: string; ticket_title: string; author_name: string; body_snippet: string; created_at: string; external_url?: string }> }>(
        `/v1/projects/${projectId}/activity/recent-comments?since=${encodeURIComponent(sinceIso)}${until ? `&until=${encodeURIComponent(until)}` : ''}&limit=50`,
        cookieHeader,
        routeAbort.signal,
      ).catch(() => ({ comments: [] })),
    ]);

    const ticketMap = new Map<string, { id: string; external_id: string }>();
    const ticketList = Array.isArray(ticketsResp) ? ticketsResp : [];
    for (const t of ticketList) {
      if (t.external_id) ticketMap.set(t.external_id.toUpperCase(), { id: t.id, external_id: t.external_id });
    }

    const recentComments = commentsResp?.comments ?? [];
    stats.comments = recentComments.length;
    for (const c of recentComments) {
      feed.push({
        id: `comment-${c.id}`,
        type: 'comment',
        text: `Commented on ${c.ticket_external_id}: ${(c.body_snippet || '').slice(0, 60)}${(c.body_snippet?.length ?? 0) > 60 ? '...' : ''}`,
        author: { name: c.author_name || 'Unknown', initials: toInitials(c.author_name || '') },
        time: formatRelative(c.created_at),
        timestamp: c.created_at,
        url: c.external_url ?? undefined,
        ticketRef: { external_id: c.ticket_external_id, id: c.ticket_id },
      });
    }

    if (!Array.isArray(repos) || repos.length === 0) {
      clearTimeout(routeTimeout);
      const agg = buildAggregates(feed);
      return NextResponse.json({ stats, feed: feed.slice(0, 100), ...agg, range });
    }

    const MAX_REPOS = 10;
    const repoSlice = repos.slice(0, MAX_REPOS);

    function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
      return Promise.race([
        promise,
        new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
      ]);
    }

    const repoResults = await Promise.all(
      repoSlice.map(async (repo) => {
        if (routeAbort.signal.aborted) return { commits: [] as GitCommit[], prs: [] as GitPullRequest[], pipelines: [] as GitPipeline[], repoName: '', repoId: repo.id };
        const [owner, repoName] = (repo.full_name || '').split('/');
        if (!owner || !repoName) return { commits: [] as GitCommit[], prs: [] as GitPullRequest[], pipelines: [] as GitPipeline[], repoName, repoId: repo.id };

        const provider = repo.provider?.toLowerCase() || 'github';
        if (!isGitProvider(provider)) return { commits: [] as GitCommit[], prs: [] as GitPullRequest[], pipelines: [] as GitPipeline[], repoName, repoId: repo.id };

        const tokens = await getTokens(provider).catch(() => null);
        if (!tokens?.access_token) return { commits: [] as GitCommit[], prs: [] as GitPullRequest[], pipelines: [] as GitPipeline[], repoName, repoId: repo.id };

        const service = getGitService(provider);

        const [commits, prs, pipelines] = await withTimeout(
          Promise.all([
            service.listCommits(tokens.access_token, owner, repoName, { per_page: 20, since: sinceIso }).catch(() => [] as GitCommit[]),
            service.listPullRequests(tokens.access_token, owner, repoName, { state: 'closed', per_page: 15 }).catch(() => [] as GitPullRequest[]),
            service.listPipelines
              ? service.listPipelines(tokens.access_token, owner, repoName, { per_page: 10 }).catch(() => [] as GitPipeline[])
              : Promise.resolve([] as GitPipeline[]),
          ]),
          3000,
          [[] as GitCommit[], [] as GitPullRequest[], [] as GitPipeline[]],
        );

        return { commits, prs, pipelines, repoName, repoId: repo.id };
      }),
    );

    for (const { commits, prs, pipelines, repoName, repoId } of repoResults) {
      const mergedPrs = Array.isArray(prs) ? prs.filter((p) => p.state === 'merged') : [];
      let successPipelines = Array.isArray(pipelines)
        ? pipelines.filter((p) => p.status === 'success')
        : [];
      if (until) {
        const untilMs = new Date(until).getTime();
        const sinceMs = new Date(sinceIso).getTime();
        successPipelines = successPipelines.filter((p) => {
          const fin = p.finished_at || p.created_at;
          if (!fin) return false;
          const ms = new Date(fin).getTime();
          return ms >= sinceMs && ms <= untilMs;
        });
      }

      const todayStr = todayStart.toISOString().slice(0, 10);
      const commitsTodayCount = Array.isArray(commits)
        ? commits.filter((c) => (c.author?.date || c.committer?.date || '').slice(0, 10) === todayStr).length
        : 0;
      stats.commitsToday += commitsTodayCount;
      stats.prsMerged += mergedPrs.length;
      stats.deployments += successPipelines.length;

      const arr = Array.isArray(commits) ? commits : [];
      for (const c of arr) {
        const name = c.author?.name || c.author?.username || 'Unknown';
        feed.push({
          id: `commit-${repoId}-${c.sha}`,
          type: 'commit',
          text: c.message?.split('\n')[0]?.slice(0, 80) || `Committed to ${repoName}`,
          author: { name, initials: toInitials(name) },
          time: formatRelative(c.author?.date || c.committer?.date || ''),
          timestamp: c.author?.date || c.committer?.date || '',
          url: c.url,
          repo: repoName,
          sha: c.sha?.slice(0, 7),
          branch: '',
        });
      }
      for (const p of mergedPrs) {
        const name = p.author?.login || 'Unknown';
        const ticketRef = findTicketRef(p.title || '', p.source_branch || '', ticketMap);
        const titlePart = p.title?.slice(0, 60) || '';
        const ticketSuffix = ticketRef ? ` → ${ticketRef.external_id}` : '';
        feed.push({
          id: `pr-${repoId}-${p.id}`,
          type: 'PR',
          text: `Merged PR #${p.number}: ${titlePart}${ticketSuffix}`,
          author: { name, initials: toInitials(name) },
          time: formatRelative(p.merged_at || p.updated_at || ''),
          timestamp: p.merged_at || p.updated_at || '',
          url: p.url,
          ticketRef,
          repo: repoName,
          branch: p.source_branch || '',
        });
      }
      for (const p of successPipelines) {
        const name = p.ref || 'deploy';
        feed.push({
          id: `deploy-${repoId}-${p.id}`,
          type: 'deploy',
          text: `Deployed ${p.ref || p.name || 'pipeline'} to ${repoName}`,
          author: { name, initials: 'DP' },
          time: formatRelative(p.finished_at || p.created_at || ''),
          timestamp: p.finished_at || p.created_at || '',
          url: p.url,
          repo: repoName,
          branch: p.ref || '',
        });
      }
    }

    const agg = buildAggregates(feed);
    clearTimeout(routeTimeout);
    return NextResponse.json({ stats, feed: feed.slice(0, 200), ...agg, range });
  } catch (err) {
    clearTimeout(routeTimeout);
    const isAbort = (err instanceof DOMException && err.name === 'AbortError') || (err instanceof Error && err.name === 'AbortError');
    if (isAbort) {
      const agg = buildAggregates(feed);
      return NextResponse.json({ stats, feed: feed.slice(0, 100), ...agg, range, partial: true });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load activity' },
      { status: 502 },
    );
  }
}
