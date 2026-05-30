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

export const GITHUB_OAUTH: OAuthConfig = {
  provider: 'github',
  authorizeUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  scopes: ['repo', 'admin:repo_hook', 'read:user', 'user:email'],
  clientIdEnv: 'GITHUB_CLIENT_ID',
  clientSecretEnv: 'GITHUB_CLIENT_SECRET',
};

const API_BASE = 'https://api.github.com';
const FETCH_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;
const RETRY_BACKOFF_MS = 500;

class GitHubApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'GitHubApiError';
  }

  get retryable(): boolean {
    return this.status >= 500 || this.status === 429;
  }
}

async function ghFetch<T>(token: string, path: string, options?: RequestInit): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS * Math.pow(2, attempt - 1)));
    }

    try {
      const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        signal: options?.signal ?? AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          ...options?.headers,
        },
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        const err = new GitHubApiError(res.status, `GitHub API ${res.status}: ${body}`);
        if (err.retryable && attempt < MAX_RETRIES) {
          lastError = err;
          continue;
        }
        throw err;
      }

      return res.json();
    } catch (err) {
      if (err instanceof GitHubApiError) throw err;
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) continue;
    }
  }

  throw lastError ?? new Error('GitHub API request failed');
}

// ── Mappers ─────────────────────────────────────────────────────────────────

function mapUser(u: Record<string, unknown>): GitUser {
  return {
    id: String(u.id),
    username: u.login as string,
    display_name: (u.name as string) || (u.login as string),
    email: u.email as string | undefined,
    avatar_url: u.avatar_url as string,
    profile_url: u.html_url as string,
    provider: 'github',
  };
}

function mapRepo(r: Record<string, unknown>): GitRepository {
  const owner = r.owner as Record<string, unknown>;
  return {
    id: String(r.id),
    name: r.name as string,
    full_name: r.full_name as string,
    description: r.description as string | undefined,
    url: r.html_url as string,
    clone_url: r.clone_url as string,
    default_branch: (r.default_branch as string) || 'main',
    language: r.language as string | undefined,
    is_private: r.private as boolean,
    is_fork: r.fork as boolean,
    stars: (r.stargazers_count as number) || 0,
    forks: (r.forks_count as number) || 0,
    open_issues: (r.open_issues_count as number) || 0,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
    pushed_at: r.pushed_at as string | undefined,
    provider: 'github',
    owner: { login: owner.login as string, avatar_url: owner.avatar_url as string },
  };
}

function mapCommit(c: Record<string, unknown>): GitCommit {
  const commit = c.commit as Record<string, unknown>;
  const author = commit.author as Record<string, unknown>;
  const committer = commit.committer as Record<string, unknown>;
  const ghAuthor = c.author as Record<string, unknown> | null;
  return {
    sha: c.sha as string,
    message: commit.message as string,
    author: {
      name: author.name as string,
      email: author.email as string,
      date: author.date as string,
      username: ghAuthor?.login as string | undefined,
      avatar_url: ghAuthor?.avatar_url as string | undefined,
    },
    committer: {
      name: committer.name as string,
      email: committer.email as string,
      date: committer.date as string,
    },
    url: c.html_url as string,
    stats: c.stats
      ? {
          additions: (c.stats as Record<string, number>).additions,
          deletions: (c.stats as Record<string, number>).deletions,
          total: (c.stats as Record<string, number>).total,
        }
      : undefined,
    provider: 'github',
  };
}

function mapPR(p: Record<string, unknown>): GitPullRequest {
  const user = p.user as Record<string, unknown>;
  const head = p.head as Record<string, unknown>;
  const base = p.base as Record<string, unknown>;
  const merged = p.merged as boolean;
  const state = merged ? 'merged' : (p.state as string) === 'closed' ? 'closed' : 'open';
  return {
    id: String(p.id),
    number: p.number as number,
    title: p.title as string,
    description: p.body as string | undefined,
    state,
    url: p.html_url as string,
    source_branch: head.ref as string,
    target_branch: base.ref as string,
    author: { login: user.login as string, avatar_url: user.avatar_url as string },
    created_at: p.created_at as string,
    updated_at: p.updated_at as string,
    merged_at: p.merged_at as string | undefined,
    closed_at: p.closed_at as string | undefined,
    additions: p.additions as number | undefined,
    deletions: p.deletions as number | undefined,
    changed_files: p.changed_files as number | undefined,
    is_draft: (p.draft as boolean) || false,
    provider: 'github',
    labels: (p.labels as Record<string, unknown>[])?.map((l) => l.name as string),
  };
}

// ── Service ─────────────────────────────────────────────────────────────────

export const githubService: GitProviderService = {
  provider: 'github',

  async getUser(token) {
    const data = await ghFetch<Record<string, unknown>>(token, '/user');
    return mapUser(data);
  },

  async listRepositories(token, options) {
    const params = new URLSearchParams({
      sort: 'pushed',
      per_page: String(options?.per_page ?? 30),
      page: String(options?.page ?? 1),
    });
    const data = await ghFetch<Record<string, unknown>[]>(token, `/user/repos?${params}`);
    return data.map(mapRepo);
  },

  async listCommits(token, owner, repo, options) {
    const params = new URLSearchParams({
      per_page: String(options?.per_page ?? 30),
      page: String(options?.page ?? 1),
    });
    if (options?.sha) params.set('sha', options.sha);
    if (options?.since) params.set('since', options.since);
    if (options?.until) params.set('until', options.until);
    const data = await ghFetch<Record<string, unknown>[]>(token, `/repos/${owner}/${repo}/commits?${params}`);
    return data.map(mapCommit);
  },

  async listPullRequests(token, owner, repo, options) {
    const params = new URLSearchParams({
      state: options?.state ?? 'all',
      sort: 'updated',
      direction: 'desc',
      per_page: String(options?.per_page ?? 30),
      page: String(options?.page ?? 1),
    });
    const data = await ghFetch<Record<string, unknown>[]>(token, `/repos/${owner}/${repo}/pulls?${params}`);
    return data.map(mapPR);
  },

  async listPipelines(token, owner, repo, options) {
    const params = new URLSearchParams({
      per_page: String(options?.per_page ?? 30),
      page: String(options?.page ?? 1),
    });
    const data = await ghFetch<{ workflow_runs: Record<string, unknown>[] }>(token, `/repos/${owner}/${repo}/actions/runs?${params}`);
    return (data.workflow_runs || []).map((r): GitPipeline => ({
      id: String(r.id),
      name: r.name as string,
      status: mapGHRunStatus(r.status as string, r.conclusion as string | null),
      ref: r.head_branch as string,
      sha: r.head_sha as string,
      url: r.html_url as string,
      created_at: r.created_at as string,
      finished_at: r.updated_at as string | undefined,
      duration: r.run_started_at ? Math.round((new Date(r.updated_at as string).getTime() - new Date(r.run_started_at as string).getTime()) / 1000) : undefined,
      provider: 'github',
    }));
  },

  async createWebhook(token, owner, repo, config) {
    const data = await ghFetch<Record<string, unknown>>(token, `/repos/${owner}/${repo}/hooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'web',
        active: true,
        events: config.events,
        config: { url: config.url, content_type: 'json', secret: config.secret, insecure_ssl: '0' },
      }),
    });
    return mapWebhook(data);
  },

  async deleteWebhook(token, owner, repo, hookId) {
    await fetch(`${API_BASE}/repos/${owner}/${repo}/hooks/${hookId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    });
  },

  async listWebhooks(token, owner, repo) {
    const data = await ghFetch<Record<string, unknown>[]>(token, `/repos/${owner}/${repo}/hooks`);
    return data.map(mapWebhook);
  },

  parseWebhookEvent(headers, body): NormalizedWebhookEvent {
    const eventType = headers['x-github-event'] || headers['X-GitHub-Event'] || '';
    const payload = body as Record<string, unknown>;
    const repoData = payload.repository as Record<string, unknown>;
    const sender = payload.sender as Record<string, unknown>;

    const base: NormalizedWebhookEvent = {
      type: 'unknown',
      provider: 'github',
      repository: {
        id: String(repoData?.id ?? ''),
        full_name: (repoData?.full_name as string) ?? '',
        url: (repoData?.html_url as string) ?? '',
      },
      sender: { login: (sender?.login as string) ?? '', avatar_url: sender?.avatar_url as string },
      timestamp: new Date().toISOString(),
      delivery_id: headers['x-github-delivery'] || headers['X-GitHub-Delivery'],
    };

    if (eventType === 'push') {
      const commits = (payload.commits as Record<string, unknown>[]) || [];
      return {
        ...base,
        type: 'push',
        ref: payload.ref as string,
        sha: payload.after as string,
        commits: commits.map((c) => {
          const author = c.author as Record<string, unknown> | undefined;
          return {
            sha: c.id as string,
            message: c.message as string,
            author: (author?.name as string) ?? '',
            author_email: author?.email as string | undefined,
            author_login: author?.username as string | undefined,
            timestamp: c.timestamp as string,
          };
        }),
      };
    }

    if (eventType === 'pull_request') {
      const pr = payload.pull_request as Record<string, unknown>;
      const user = pr.user as Record<string, unknown> | undefined;
      return {
        ...base,
        type: 'pull_request',
        action: payload.action as string,
        pull_request: {
          number: pr.number as number,
          title: pr.title as string,
          body: (pr.body as string) || undefined,
          state: pr.merged ? 'merged' : (pr.state as string),
          source_branch: (pr.head as Record<string, unknown>)?.ref as string,
          target_branch: (pr.base as Record<string, unknown>)?.ref as string,
          user_login: user?.login as string | undefined,
          user_email: user?.email as string | undefined,
          html_url: pr.html_url as string | undefined,
        },
      };
    }

    if (eventType === 'workflow_run') {
      const run = payload.workflow_run as Record<string, unknown>;
      return {
        ...base,
        type: 'pipeline',
        action: payload.action as string,
        pipeline: {
          id: String(run.id),
          status: mapGHRunStatus(run.status as string, run.conclusion as string | null),
          ref: run.head_branch as string,
        },
      };
    }

    return base;
  },

  verifyWebhookSignature(payload, signature, secret) {
    const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function mapGHRunStatus(status: string, conclusion: string | null): GitPipeline['status'] {
  if (status === 'completed') {
    if (conclusion === 'success') return 'success';
    if (conclusion === 'failure') return 'failed';
    if (conclusion === 'cancelled') return 'cancelled';
    return 'failed';
  }
  if (status === 'in_progress') return 'running';
  return 'pending';
}

function mapWebhook(h: Record<string, unknown>): GitWebhook {
  const config = h.config as Record<string, unknown> | undefined;
  return {
    id: String(h.id),
    url: (config?.url as string) ?? '',
    events: (h.events as string[]) ?? [],
    active: h.active as boolean,
    created_at: h.created_at as string,
    provider: 'github',
  };
}
