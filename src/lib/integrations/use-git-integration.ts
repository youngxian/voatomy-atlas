'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GitProvider, GitUser, GitRepository, GitCommit, GitPullRequest, GitPipeline, GitWebhook } from './types';

interface ConnectionStatus {
  connected: boolean;
  user: GitUser | null;
}

/**
 * Frontend hook for managing a git provider integration.
 * All calls go through Next.js API routes which handle token storage & provider APIs server-side.
 *
 * Usage:
 *   const gh = useGitIntegration('github');
 *   gh.connect();                         // redirects to OAuth
 *   gh.repos                              // fetched repos
 *   gh.fetchCommits('owner', 'repo');     // load commits for a repo
 */
export function useGitIntegration(provider: GitProvider) {
  const [status, setStatus] = useState<ConnectionStatus>({ connected: false, user: null });
  const [loading, setLoading] = useState(true);
  const [repos, setRepos] = useState<GitRepository[]>([]);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [pullRequests, setPullRequests] = useState<GitPullRequest[]>([]);
  const [pipelines, setPipelines] = useState<GitPipeline[]>([]);
  const [webhooks, setWebhooks] = useState<GitWebhook[]>([]);

  // Check connection status on mount
  const checkStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/git/${provider}/status`);
      const data: ConnectionStatus = await res.json();
      setStatus(data);
    } catch {
      setStatus({ connected: false, user: null });
    }
    setLoading(false);
  }, [provider]);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  // OAuth — redirect browser to /api/auth/[provider]/authorize
  const connect = useCallback(() => {
    window.location.href = `/api/auth/${provider}/authorize`;
  }, [provider]);

  const disconnect = useCallback(async () => {
    await fetch(`/api/git/${provider}/disconnect`, { method: 'POST' });
    setStatus({ connected: false, user: null });
    setRepos([]);
    setCommits([]);
    setPullRequests([]);
    setPipelines([]);
    setWebhooks([]);
  }, [provider]);

  // Fetch repositories
  const fetchRepos = useCallback(async (options?: { page?: number; per_page?: number }) => {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', String(options.page));
    if (options?.per_page) params.set('per_page', String(options.per_page));
    try {
      const res = await fetch(`/api/git/${provider}/repos?${params}`);
      if (!res.ok) return [];
      const data: GitRepository[] = await res.json();
      setRepos(data);
      return data;
    } catch {
      return [];
    }
  }, [provider]);

  // Fetch commits for a repo
  const fetchCommits = useCallback(async (owner: string, repo: string, options?: { page?: number; per_page?: number; since?: string }) => {
    const params = new URLSearchParams({ owner, repo });
    if (options?.page) params.set('page', String(options.page));
    if (options?.per_page) params.set('per_page', String(options.per_page));
    if (options?.since) params.set('since', options.since);
    try {
      const res = await fetch(`/api/git/${provider}/commits?${params}`);
      if (!res.ok) return [];
      const data: GitCommit[] = await res.json();
      setCommits(data);
      return data;
    } catch {
      return [];
    }
  }, [provider]);

  // Fetch PRs / MRs for a repo
  const fetchPullRequests = useCallback(async (owner: string, repo: string, options?: { state?: 'open' | 'closed' | 'all'; page?: number; per_page?: number }) => {
    const params = new URLSearchParams({ owner, repo });
    if (options?.state) params.set('state', options.state);
    if (options?.page) params.set('page', String(options.page));
    if (options?.per_page) params.set('per_page', String(options.per_page));
    try {
      const res = await fetch(`/api/git/${provider}/pull-requests?${params}`);
      if (!res.ok) return [];
      const data: GitPullRequest[] = await res.json();
      setPullRequests(data);
      return data;
    } catch {
      return [];
    }
  }, [provider]);

  // Fetch pipelines / actions for a repo
  const fetchPipelines = useCallback(async (owner: string, repo: string, options?: { page?: number; per_page?: number }) => {
    const params = new URLSearchParams({ owner, repo });
    if (options?.page) params.set('page', String(options.page));
    if (options?.per_page) params.set('per_page', String(options.per_page));
    try {
      const res = await fetch(`/api/git/${provider}/pipelines?${params}`);
      if (!res.ok) return [];
      const data: GitPipeline[] = await res.json();
      setPipelines(data);
      return data;
    } catch {
      return [];
    }
  }, [provider]);

  // Fetch webhooks for a repo
  const fetchWebhooks = useCallback(async (owner: string, repo: string) => {
    try {
      const res = await fetch(`/api/git/${provider}/webhooks?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`);
      if (!res.ok) return [];
      const data: GitWebhook[] = await res.json();
      setWebhooks(data);
      return data;
    } catch {
      return [];
    }
  }, [provider]);

  // Create webhook for a repo
  const createWebhook = useCallback(async (owner: string, repo: string, events: string[]) => {
    try {
      const res = await fetch(`/api/git/${provider}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, events }),
      });
      if (!res.ok) return null;
      const hook: GitWebhook = await res.json();
      setWebhooks((prev) => [...prev, hook]);
      return hook;
    } catch {
      return null;
    }
  }, [provider]);

  // Delete webhook
  const deleteWebhook = useCallback(async (owner: string, repo: string, hookId: string) => {
    try {
      await fetch(`/api/git/${provider}/webhooks?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&hookId=${encodeURIComponent(hookId)}`, {
        method: 'DELETE',
      });
      setWebhooks((prev) => prev.filter((w) => w.id !== hookId));
    } catch { /* ignore */ }
  }, [provider]);

  return {
    provider,
    connected: status.connected,
    user: status.user,
    loading,
    repos,
    commits,
    pullRequests,
    pipelines,
    webhooks,
    connect,
    disconnect,
    checkStatus,
    fetchRepos,
    fetchCommits,
    fetchPullRequests,
    fetchPipelines,
    fetchWebhooks,
    createWebhook,
    deleteWebhook,
  } as const;
}
