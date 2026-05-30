// Shared types across GitHub, GitLab, and Bitbucket integrations

export type GitProvider = 'github' | 'gitlab' | 'bitbucket';

// ── OAuth ───────────────────────────────────────────────────────────────────

export interface OAuthConfig {
  provider: GitProvider;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientIdEnv: string;
  clientSecretEnv: string;
}

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
  scope?: string;
  created_at?: number;
}

// ── Normalized entities ─────────────────────────────────────────────────────

export interface GitUser {
  id: string;
  username: string;
  display_name: string;
  email?: string;
  avatar_url?: string;
  profile_url?: string;
  provider: GitProvider;
}

export interface GitRepository {
  id: string;
  name: string;
  full_name: string;
  description?: string;
  url: string;
  clone_url?: string;
  default_branch: string;
  language?: string;
  is_private: boolean;
  is_fork: boolean;
  stars: number;
  forks: number;
  open_issues: number;
  created_at: string;
  updated_at: string;
  pushed_at?: string;
  provider: GitProvider;
  owner: { login: string; avatar_url?: string };
}

export interface GitCommit {
  sha: string;
  message: string;
  author: { name: string; email: string; date: string; username?: string; avatar_url?: string };
  committer: { name: string; email: string; date: string };
  url: string;
  stats?: { additions: number; deletions: number; total: number };
  provider: GitProvider;
}

export interface GitPullRequest {
  id: string;
  number: number;
  title: string;
  description?: string;
  state: 'open' | 'closed' | 'merged';
  url: string;
  source_branch: string;
  target_branch: string;
  author: { login: string; avatar_url?: string };
  reviewers?: { login: string; avatar_url?: string }[];
  created_at: string;
  updated_at: string;
  merged_at?: string;
  closed_at?: string;
  additions?: number;
  deletions?: number;
  changed_files?: number;
  is_draft: boolean;
  provider: GitProvider;
  labels?: string[];
}

export interface GitPipeline {
  id: string;
  name?: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  ref: string;
  sha: string;
  url: string;
  created_at: string;
  finished_at?: string;
  duration?: number;
  provider: GitProvider;
}

export interface GitWebhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at?: string;
  provider: GitProvider;
}

// ── Webhook event payloads (normalized) ─────────────────────────────────────

export type WebhookEventType = 'push' | 'pull_request' | 'pipeline' | 'unknown';

export interface NormalizedWebhookEvent {
  type: WebhookEventType;
  provider: GitProvider;
  action?: string;
  repository: { id: string; full_name: string; url: string };
  sender: { login: string; avatar_url?: string };
  ref?: string;
  sha?: string;
  commits?: {
    sha: string;
    message: string;
    author: string;
    author_email?: string;
    author_login?: string;
    timestamp: string;
  }[];
  pull_request?: {
    number: number;
    title: string;
    body?: string;
    state: string;
    source_branch: string;
    target_branch: string;
    user_login?: string;
    user_email?: string;
    html_url?: string;
  };
  pipeline?: {
    id: string;
    status: string;
    ref: string;
    duration?: number;
  };
  timestamp: string;
  delivery_id?: string;
}

// ── Provider service interface ──────────────────────────────────────────────

export interface GitProviderService {
  provider: GitProvider;

  getUser(token: string): Promise<GitUser>;
  listRepositories(token: string, options?: { page?: number; per_page?: number }): Promise<GitRepository[]>;
  listCommits(token: string, owner: string, repo: string, options?: { sha?: string; since?: string; until?: string; page?: number; per_page?: number }): Promise<GitCommit[]>;
  listPullRequests(token: string, owner: string, repo: string, options?: { state?: 'open' | 'closed' | 'all'; page?: number; per_page?: number }): Promise<GitPullRequest[]>;
  listPipelines?(token: string, owner: string, repo: string, options?: { page?: number; per_page?: number }): Promise<GitPipeline[]>;

  createWebhook(token: string, owner: string, repo: string, config: { url: string; secret: string; events: string[] }): Promise<GitWebhook>;
  deleteWebhook(token: string, owner: string, repo: string, hookId: string): Promise<void>;
  listWebhooks(token: string, owner: string, repo: string): Promise<GitWebhook[]>;

  parseWebhookEvent(headers: Record<string, string>, body: unknown): NormalizedWebhookEvent;
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
}
