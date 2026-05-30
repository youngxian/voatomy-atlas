import crypto from 'crypto';
import type {
  GitProviderService,
  GitUser,
  GitRepository,
  GitCommit,
  GitPullRequest,
  GitPipeline,
  GitWebhook,
  NormalizedWebhookEvent,
  OAuthConfig,
} from './types';

// ── OAuth Configuration ─────────────────────────────────────────────────────

export const BITBUCKET_OAUTH: OAuthConfig = {
  provider: 'bitbucket',
  authorizeUrl: 'https://bitbucket.org/site/oauth2/authorize',
  tokenUrl: 'https://bitbucket.org/site/oauth2/access_token',
  scopes: ['repository', 'pullrequest', 'webhook', 'account', 'email'],
  clientIdEnv: 'BITBUCKET_CLIENT_ID',
  clientSecretEnv: 'BITBUCKET_CLIENT_SECRET',
};

const API_BASE = 'https://api.bitbucket.org/2.0';

async function bbFetch<T>(token: string, path: string, options?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Bitbucket API ${res.status}: ${body}`);
  }
  return res.json();
}

// ── Mappers ─────────────────────────────────────────────────────────────────

function mapUser(u: Record<string, unknown>): GitUser {
  const links = u.links as Record<string, Record<string, string>> | undefined;
  return {
    id: u.uuid as string,
    username: u.nickname as string || u.username as string,
    display_name: u.display_name as string,
    email: undefined,
    avatar_url: links?.avatar?.href,
    profile_url: links?.html?.href,
    provider: 'bitbucket',
  };
}

function mapRepo(r: Record<string, unknown>): GitRepository {
  const links = r.links as Record<string, Record<string, string>> | undefined;
  const owner = r.owner as Record<string, unknown>;
  const mainbranch = r.mainbranch as Record<string, unknown> | undefined;
  return {
    id: r.uuid as string,
    name: r.name as string,
    full_name: r.full_name as string,
    description: r.description as string | undefined,
    url: links?.html?.href ?? '',
    clone_url: links?.clone ? (links.clone as unknown as { href: string; name: string }[])?.find((c) => c.name === 'https')?.href : undefined,
    default_branch: (mainbranch?.name as string) ?? 'main',
    language: r.language as string | undefined,
    is_private: r.is_private as boolean,
    is_fork: !!(r.parent),
    stars: 0,
    forks: (r.forks as Record<string, unknown>)?.size as number ?? 0,
    open_issues: 0,
    created_at: r.created_on as string,
    updated_at: r.updated_on as string,
    pushed_at: r.updated_on as string,
    provider: 'bitbucket',
    owner: {
      login: (owner?.nickname as string) ?? (owner?.username as string) ?? '',
      avatar_url: (owner?.links as Record<string, Record<string, string>>)?.avatar?.href,
    },
  };
}

function mapCommit(c: Record<string, unknown>): GitCommit {
  const author = c.author as Record<string, unknown>;
  const user = author?.user as Record<string, unknown> | undefined;
  return {
    sha: c.hash as string,
    message: c.message as string,
    author: {
      name: author?.raw as string || '',
      email: '',
      date: c.date as string,
      username: user?.nickname as string | undefined,
      avatar_url: (user?.links as Record<string, Record<string, string>>)?.avatar?.href,
    },
    committer: {
      name: author?.raw as string || '',
      email: '',
      date: c.date as string,
    },
    url: (c.links as Record<string, Record<string, string>>)?.html?.href ?? '',
    provider: 'bitbucket',
  };
}

function mapPR(p: Record<string, unknown>): GitPullRequest {
  const author = p.author as Record<string, unknown>;
  const src = p.source as Record<string, unknown>;
  const dest = p.destination as Record<string, unknown>;
  const stateMap: Record<string, GitPullRequest['state']> = {
    OPEN: 'open', MERGED: 'merged', DECLINED: 'closed', SUPERSEDED: 'closed',
  };
  return {
    id: String(p.id),
    number: p.id as number,
    title: p.title as string,
    description: p.description as string | undefined,
    state: stateMap[(p.state as string)?.toUpperCase()] ?? 'open',
    url: (p.links as Record<string, Record<string, string>>)?.html?.href ?? '',
    source_branch: (src?.branch as Record<string, string>)?.name ?? '',
    target_branch: (dest?.branch as Record<string, string>)?.name ?? '',
    author: {
      login: (author?.nickname as string) ?? (author?.display_name as string) ?? '',
      avatar_url: (author?.links as Record<string, Record<string, string>>)?.avatar?.href,
    },
    created_at: p.created_on as string,
    updated_at: p.updated_on as string,
    merged_at: p.state === 'MERGED' ? (p.updated_on as string) : undefined,
    closed_at: p.state === 'DECLINED' ? (p.updated_on as string) : undefined,
    is_draft: false,
    provider: 'bitbucket',
  };
}

function mapPipeline(p: Record<string, unknown>): GitPipeline {
  const target = p.target as Record<string, unknown> | undefined;
  const state = p.state as Record<string, unknown> | undefined;
  const statusName = (state?.name as string)?.toLowerCase() ?? 'pending';
  const resultName = ((state?.result as Record<string, unknown>)?.name as string)?.toLowerCase();
  const statusMap: Record<string, GitPipeline['status']> = {
    successful: 'success', failed: 'failed', stopped: 'cancelled', error: 'failed',
  };
  let status: GitPipeline['status'] = 'pending';
  if (statusName === 'completed' && resultName) {
    status = statusMap[resultName] ?? 'failed';
  } else if (statusName === 'running' || statusName === 'in_progress') {
    status = 'running';
  }

  return {
    id: p.uuid as string,
    name: `Pipeline #${p.build_number}`,
    status,
    ref: (target?.ref_name as string) ?? '',
    sha: ((target?.commit as Record<string, unknown>)?.hash as string) ?? '',
    url: (p.links as Record<string, Record<string, string>>)?.html?.href ?? '',
    created_at: p.created_on as string,
    finished_at: p.completed_on as string | undefined,
    duration: p.duration_in_seconds as number | undefined,
    provider: 'bitbucket',
  };
}

// ── Service ─────────────────────────────────────────────────────────────────

export const bitbucketService: GitProviderService = {
  provider: 'bitbucket',

  async getUser(token) {
    const data = await bbFetch<Record<string, unknown>>(token, '/user');
    return mapUser(data);
  },

  async listRepositories(token, options) {
    const params = new URLSearchParams({
      sort: '-updated_on',
      pagelen: String(options?.per_page ?? 30),
      page: String(options?.page ?? 1),
      role: 'member',
    });
    const data = await bbFetch<{ values: Record<string, unknown>[] }>(token, `/repositories?${params}`);
    return (data.values || []).map(mapRepo);
  },

  async listCommits(token, workspace, repo, options) {
    const params = new URLSearchParams({ pagelen: String(options?.per_page ?? 30), page: String(options?.page ?? 1) });
    const path = options?.sha
      ? `/repositories/${workspace}/${repo}/commits/${options.sha}`
      : `/repositories/${workspace}/${repo}/commits`;
    const data = await bbFetch<{ values: Record<string, unknown>[] }>(token, `${path}?${params}`);
    return (data.values || []).map(mapCommit);
  },

  async listPullRequests(token, workspace, repo, options) {
    const stateMap: Record<string, string> = { open: 'OPEN', closed: 'MERGED,DECLINED,SUPERSEDED', all: '' };
    const params = new URLSearchParams({
      pagelen: String(options?.per_page ?? 30),
      page: String(options?.page ?? 1),
      sort: '-updated_on',
    });
    const state = stateMap[options?.state ?? 'all'];
    if (state) params.set('state', state);
    const data = await bbFetch<{ values: Record<string, unknown>[] }>(token, `/repositories/${workspace}/${repo}/pullrequests?${params}`);
    return (data.values || []).map(mapPR);
  },

  async listPipelines(token, workspace, repo, options) {
    const params = new URLSearchParams({
      pagelen: String(options?.per_page ?? 30),
      page: String(options?.page ?? 1),
      sort: '-created_on',
    });
    const data = await bbFetch<{ values: Record<string, unknown>[] }>(token, `/repositories/${workspace}/${repo}/pipelines?${params}`);
    return (data.values || []).map(mapPipeline);
  },

  async createWebhook(token, workspace, repo, config) {
    const data = await bbFetch<Record<string, unknown>>(token, `/repositories/${workspace}/${repo}/hooks`, {
      method: 'POST',
      body: JSON.stringify({
        description: 'ATLAS webhook',
        url: config.url,
        active: true,
        secret: config.secret,
        events: config.events,
      }),
    });
    return {
      id: data.uuid as string,
      url: data.url as string,
      events: (data.events as string[]) ?? config.events,
      active: data.active as boolean,
      created_at: data.created_at as string,
      provider: 'bitbucket' as const,
    };
  },

  async deleteWebhook(token, workspace, repo, hookId) {
    await fetch(`${API_BASE}/repositories/${workspace}/${repo}/hooks/${hookId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async listWebhooks(token, workspace, repo) {
    const data = await bbFetch<{ values: Record<string, unknown>[] }>(token, `/repositories/${workspace}/${repo}/hooks`);
    return (data.values || []).map((h) => ({
      id: h.uuid as string,
      url: h.url as string,
      events: (h.events as string[]) ?? [],
      active: h.active as boolean,
      created_at: h.created_at as string,
      provider: 'bitbucket' as const,
    }));
  },

  parseWebhookEvent(headers, body): NormalizedWebhookEvent {
    const eventKey = headers['x-event-key'] || headers['X-Event-Key'] || '';
    const payload = body as Record<string, unknown>;
    const repoData = payload.repository as Record<string, unknown>;
    const actor = payload.actor as Record<string, unknown>;

    const base: NormalizedWebhookEvent = {
      type: 'unknown',
      provider: 'bitbucket',
      repository: {
        id: (repoData?.uuid as string) ?? '',
        full_name: (repoData?.full_name as string) ?? '',
        url: ((repoData?.links as Record<string, Record<string, string>>)?.html?.href) ?? '',
      },
      sender: {
        login: (actor?.nickname as string) ?? (actor?.display_name as string) ?? '',
        avatar_url: (actor?.links as Record<string, Record<string, string>>)?.avatar?.href,
      },
      timestamp: new Date().toISOString(),
      delivery_id: headers['x-request-uuid'] || headers['X-Request-UUID'],
    };

    if (eventKey === 'repo:push') {
      const push = payload.push as Record<string, unknown>;
      const changes = (push?.changes as Record<string, unknown>[]) ?? [];
      const first = changes[0];
      const newTarget = first?.new as Record<string, unknown> | undefined;
      const commits = (first?.commits as Record<string, unknown>[]) ?? [];
      return {
        ...base,
        type: 'push',
        ref: newTarget ? `refs/heads/${(newTarget.name as string)}` : undefined,
        sha: (newTarget?.target as Record<string, unknown>)?.hash as string,
        commits: commits.map((c) => {
          const author = c.author as Record<string, unknown> | undefined;
          const raw = author?.raw as string | undefined;
          const emailMatch = raw?.match(/<([^>]+)>/);
          return {
            sha: c.hash as string,
            message: c.message as string,
            author: raw ?? '',
            author_email: emailMatch ? emailMatch[1].trim() : undefined,
            timestamp: c.date as string,
          };
        }),
      };
    }

    if (eventKey.startsWith('pullrequest:')) {
      const pr = payload.pullrequest as Record<string, unknown>;
      const author = pr?.author as Record<string, unknown> | undefined;
      const actionMap: Record<string, string> = {
        'pullrequest:created': 'opened',
        'pullrequest:updated': 'updated',
        'pullrequest:fulfilled': 'merged',
        'pullrequest:rejected': 'closed',
        'pullrequest:approved': 'approved',
      };
      return {
        ...base,
        type: 'pull_request',
        action: actionMap[eventKey] ?? eventKey.split(':')[1],
        pull_request: {
          number: pr?.id as number,
          title: pr?.title as string,
          body: pr?.description as string | undefined,
          state: (pr?.state as string)?.toLowerCase(),
          source_branch: ((pr?.source as Record<string, unknown>)?.branch as Record<string, string>)?.name ?? '',
          target_branch: ((pr?.destination as Record<string, unknown>)?.branch as Record<string, string>)?.name ?? '',
          user_login: author?.username as string | undefined,
          user_email: (author?.user as Record<string, unknown>)?.email as string | undefined,
          html_url: ((pr?.links as Record<string, unknown>)?.html as Record<string, unknown>)?.href as
            | string
            | undefined,
        },
      };
    }

    if (eventKey.startsWith('pipeline')) {
      return { ...base, type: 'pipeline' };
    }

    return base;
  },

  verifyWebhookSignature(payload, signature, secret) {
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  },
};
