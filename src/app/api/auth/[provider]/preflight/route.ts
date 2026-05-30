import { NextResponse } from 'next/server';
import { isGitProvider, getOAuthConfig } from '@/lib/integrations';
import { getClientCredentials } from '@/lib/integrations/credential-store';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;

  if (!isGitProvider(provider)) {
    return NextResponse.json({ configured: false, error: 'Unknown provider' });
  }

  const cfg = getOAuthConfig(provider);
  const creds = getClientCredentials(provider, cfg);

  if (!creds) {
    return NextResponse.json({
      configured: false,
      provider,
      error: `${provider} OAuth credentials not configured`,
      help: {
        github: {
          step1: 'Go to https://github.com/settings/developers',
          step2: 'Click "New OAuth App"',
          step3: 'Set Homepage URL to http://localhost:3000',
          step4: `Set Authorization callback URL to http://localhost:3000/api/auth/github/callback`,
          step5: 'Copy Client ID and Client Secret',
        },
        gitlab: {
          step1: 'Go to https://gitlab.com/-/user_settings/applications',
          step2: 'Click "New application"',
          step3: `Set Redirect URI to http://localhost:3000/api/auth/gitlab/callback`,
          step4: 'Check scopes: api, read_user, read_repository',
          step5: 'Copy Application ID and Secret',
        },
        bitbucket: {
          step1: 'Go to Bitbucket → Workspace settings → OAuth consumers',
          step2: `Set Callback URL to http://localhost:3000/api/auth/bitbucket/callback`,
          step3: 'Copy Key and Secret',
        },
      }[provider],
    });
  }

  return NextResponse.json({ configured: true, provider });
}
