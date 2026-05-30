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

export const GITLAB_OAUTH: OAuthConfig = {
  provider: 'gitlab',
  authorizeUrl: 'https://gitlab.com/oauth/authorize',
  tokenUrl: 'https://gitlab.com/oauth/token',
  scopes: ['api', 'read_user'],
  clientIdEnv: 'GITLAB_CLIENT_ID',
  clientSecretEnv: 'GITLAB_CLIENT_SECRET',
};

const API_BASE = 'https://gitlab.com/api/v4';

async function glFetch<T>(token: string, path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GitLab API ${res.status}: ${body}`);
  }
  return res.json();
}

// ── Mappers ─────────────────────────────────────────────────────────────────

function mapUser(u: Record<string, unknown>): GitUser {
  return {
    id: String(u.id),
    username: u.username as string,
    display_name: (u.name as string) || (u.username as string),
    email: u.email as string | undefined,
    avatar_url: u.avatar_url as string,
    profile_url: u.web_url as string,
    provider: 'gitlab',
  };
}

function mapProject(p: Record<string, unknown>): GitRepository {
  const ns = p.namespace as Record<string, unknown>;
  return {
    id: String(p.id),
    name: p.name as string,
    full_name: p.path_with_namespace as string,
    description: p.description as string | undefined,
    url: p.web_url as string,
    clone_url: p.http_url_to_repo as string,
    default_branch: (p.default_branch as string) || 'main',
    language: undefined,
    is_private: (p.visibility as string) === 'private',
    is_fork: !!(p.forked_from_project),
    stars: (p.star_count as number) || 0,
    forks: (p.forks_count as number) || 0,
    open_issues: (p.open_issues_count as number) || 0,
    created_at: p.created_at as string,
    updated_at: p.last_activity_at as string,
    pushed_at: p.last_activity_at as string,
    provider: 'gitlab',
    owner: { login: ns?.path as string, avatar_url: ns?.avatar_url as string | undefined },
  };
}

function mapCommit(c: Record<string, unknown>): GitCommit {
  return {
    sha: c.id as string,
    message: c.message as string,
    author: {
      name: c.author_name as string,
      email: c.author_email as string,
      date: c.authored_date as string,
      username: undefined,
      avatar_url: undefined,
    },
    committer: {
      name: c.committer_name as string,
      email: c.committer_email as string,
      date: c.committed_date as string,
    },
    url: c.web_url as string,
    stats: c.stats
      ? {
          additions: (c.stats as Record<string, number>).additions,
          deletions: (c.stats as Record<string, number>).deletions,
          total: (c.stats as Record<string, number>).total,
        }
      : undefined,
    provider: 'gitlab',
  };
}

function mapMR(m: Record<string, unknown>): GitPullRequest {
  const author = m.author as Record<string, unknown>;
  const state = (m.state as string) === 'merged' ? 'merged' : (m.state as string) === 'closed' ? 'closed' : 'open';
  return {
    id: String(m.id),
    number: m.iid as number,
    title: m.title as string,
    description: m.description as string | undefined,
    state,
    url: m.web_url as string,
    source_branch: m.source_branch as string,
    target_branch: m.target_branch as string,
    author: { login: author?.username as string, avatar_url: author?.avatar_url as string },
    created_at: m.created_at as string,
    updated_at: m.updated_at as string,
    merged_at: m.merged_at as string | undefined,
    closed_at: m.closed_at as string | undefined,
    is_draft: (m.draft as boolean) || (m.work_in_progress as boolean) || false,
    provider: 'gitlab',
    labels: m.labels as string[] | undefined,
  };
}

function mapPipeline(p: Record<string, unknown>): GitPipeline {
  const statusMap: Record<string, GitPipeline['status']> = {
    success: 'success', failed: 'failed', canceled: 'cancelled', cancelled: 'cancelled',
    pending: 'pending', running: 'running', created: 'pending', manual: 'pending',
    waiting_for_resource: 'pending', preparing: 'pending', scheduled: 'pending',
  };
  return {
    id: String(p.id),
    name: p.ref as string,
    status: statusMap[p.status as string] ?? 'pending',
    ref: p.ref as string,
    sha: p.sha as string,
    url: p.web_url as string,
    created_at: p.created_at as string,
    finished_at: p.finished_at as string | undefined,
    duration: p.duration as number | undefined,
    provider: 'gitlab',
  };
}

// ── Service ─────────────────────────────────────────────────────────────────

export const gitlabService: GitProviderService = {
  provider: 'gitlab',

  async getUser(token) {
    const data = await glFetch<Record<string, unknown>>(token, '/user');
    return mapUser(data);
  },

  async listRepositories(token, options) {
    const params = new URLSearchParams({
      membership: 'true',
      order_by: 'last_activity_at',
      sort: 'desc',
      per_page: String(options?.per_page ?? 30),
      page: String(options?.page ?? 1),
    });
    const data = await glFetch<Record<string, unknown>[]>(token, `/projects?${params}`);
    return data.map(mapProject);
  },

  async listCommits(token, _owner, repo, options) {
    const encodedId = encodeURIComponent(repo);
    const params = new URLSearchParams({
      per_page: String(options?.per_page ?? 30),
      page: String(options?.page ?? 1),
    });
    if (options?.sha) params.set('ref_name', options.sha);
    if (options?.since) params.set('since', options.since);
    if (options?.until) params.set('until', options.until);
    const data = await glFetch<Record<string, unknown>[]>(token, `/projects/${encodedId}/repository/commits?${params}`);
    return data.map(mapCommit);
  },

  async listPullRequests(token, _owner, repo, options) {
    const encodedId = encodeURIComponent(repo);
    const stateMap: Record<string, string> = { open: 'opened', closed: 'closed', all: 'all' };
    const params = new URLSearchParams({
      state: stateMap[options?.state ?? 'all'] ?? 'all',
      order_by: 'updated_at',
      sort: 'desc',
      per_page: String(options?.per_page ?? 30),
      page: String(options?.page ?? 1),
    });
    const data = await glFetch<Record<string, unknown>[]>(token, `/projects/${encodedId}/merge_requests?${params}`);
    return data.map(mapMR);
  },

  async listPipelines(token, _owner, repo, options) {
    const encodedId = encodeURIComponent(repo);
    const params = new URLSearchParams({
      order_by: 'updated_at',
      sort: 'desc',
      per_page: String(options?.per_page ?? 30),
      page: String(options?.page ?? 1),
    });
    const data = await glFetch<Record<string, unknown>[]>(token, `/projects/${encodedId}/pipelines?${params}`);
    return data.map(mapPipeline);
  },

  async createWebhook(token, _owner, repo, config) {
    const encodedId = encodeURIComponent(repo);
    const data = await glFetch<Record<string, unknown>>(token, `/projects/${encodedId}/hooks`, {
      method: 'POST',
      body: JSON.stringify({
        url: config.url,
        token: config.secret,
        push_events: config.events.includes('push'),
        merge_requests_events: config.events.includes('merge_request'),
        pipeline_events: config.events.includes('pipeline'),
        enable_ssl_verification: true,
      }),
    });
    return {
      id: String(data.id),
      url: data.url as string,
      events: buildGLEventList(data),
      active: true,
      created_at: data.created_at as string,
      provider: 'gitlab' as const,
    };
  },

  async deleteWebhook(token, _owner, repo, hookId) {
    const encodedId = encodeURIComponent(repo);
    await fetch(`${API_BASE}/projects/${encodedId}/hooks/${hookId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async listWebhooks(token, _owner, repo) {
    const encodedId = encodeURIComponent(repo);
    const data = await glFetch<Record<string, unknown>[]>(token, `/projects/${encodedId}/hooks`);
    return data.map((h) => ({
      id: String(h.id),
      url: h.url as string,
      events: buildGLEventList(h),
      active: true,
      created_at: h.created_at as string,
      provider: 'gitlab' as const,
    }));
  },

  parseWebhookEvent(headers, body): NormalizedWebhookEvent {
    const eventType = headers['x-gitlab-event'] || headers['X-Gitlab-Event'] || '';
    const payload = body as Record<string, unknown>;
    const project = payload.project as Record<string, unknown> | undefined;

    const base: NormalizedWebhookEvent = {
      type: 'unknown',
      provider: 'gitlab',
      repository: {
        id: String(project?.id ?? ''),
        full_name: (project?.path_with_namespace as string) ?? '',
        url: (project?.web_url as string) ?? '',
      },
      sender: {
        login: (payload.user_username as string) ?? (payload.user_name as string) ?? '',
      },
      timestamp: new Date().toISOString(),
    };

    if (eventType === 'Push Hook') {
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
            timestamp: c.timestamp as string,
          };
        }),
      };
    }

    if (eventType === 'Merge Request Hook') {
      const attrs = payload.object_attributes as Record<string, unknown>;
      const user = payload.user as Record<string, unknown> | undefined;
      return {
        ...base,
        type: 'pull_request',
        action: attrs.action as string,
        pull_request: {
          number: attrs.iid as number,
          title: attrs.title as string,
          body: attrs.description as string | undefined,
          state: attrs.state as string,
          source_branch: attrs.source_branch as string,
          target_branch: attrs.target_branch as string,
          user_login: user?.username as string | undefined,
          user_email: user?.email as string | undefined,
          html_url: attrs.url as string | undefined,
        },
      };
    }

    if (eventType === 'Pipeline Hook') {
      const attrs = payload.object_attributes as Record<string, unknown>;
      return {
        ...base,
        type: 'pipeline',
        pipeline: {
          id: String(attrs.id),
          status: attrs.status as string,
          ref: attrs.ref as string,
          duration: attrs.duration as number | undefined,
        },
      };
    }

    return base;
  },

  verifyWebhookSignature(_payload, signature, secret) {
    return crypto.timingSafeEqual(Buffer.from(secret), Buffer.from(signature));
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildGLEventList(h: Record<string, unknown>): string[] {
  const events: string[] = [];
  if (h.push_events) events.push('push');
  if (h.merge_requests_events) events.push('merge_request');
  if (h.pipeline_events) events.push('pipeline');
  if (h.issues_events) events.push('issues');
  if (h.tag_push_events) events.push('tag_push');
  if (h.note_events) events.push('note');
  if (h.job_events) events.push('job');
  return events;
}
