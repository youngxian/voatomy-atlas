export * from './types';
export { githubService, GITHUB_OAUTH } from './github';
export { gitlabService, GITLAB_OAUTH } from './gitlab';
export { bitbucketService, BITBUCKET_OAUTH } from './bitbucket';
export { useGitIntegration } from './use-git-integration';
export { getClientCredentials } from './credential-store';
export type { ClientCredentials } from './credential-store';

import type { GitProvider, GitProviderService, OAuthConfig } from './types';
import { githubService, GITHUB_OAUTH } from './github';
import { gitlabService, GITLAB_OAUTH } from './gitlab';
import { bitbucketService, BITBUCKET_OAUTH } from './bitbucket';

const services: Record<GitProvider, GitProviderService> = {
  github: githubService,
  gitlab: gitlabService,
  bitbucket: bitbucketService,
};

const oauthConfigs: Record<GitProvider, OAuthConfig> = {
  github: GITHUB_OAUTH,
  gitlab: GITLAB_OAUTH,
  bitbucket: BITBUCKET_OAUTH,
};

export function getGitService(provider: GitProvider): GitProviderService {
  const svc = services[provider];
  if (!svc) throw new Error(`Unknown git provider: ${provider}`);
  return svc;
}

export function getOAuthConfig(provider: GitProvider): OAuthConfig {
  const cfg = oauthConfigs[provider];
  if (!cfg) throw new Error(`Unknown git provider: ${provider}`);
  return cfg;
}

export function isGitProvider(key: string): key is GitProvider {
  return key === 'github' || key === 'gitlab' || key === 'bitbucket';
}
