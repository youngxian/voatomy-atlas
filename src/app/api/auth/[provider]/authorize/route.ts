import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { isGitProvider, getOAuthConfig } from '@/lib/integrations';
import { getClientCredentials } from '@/lib/integrations/credential-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;

  if (!isGitProvider(provider)) {
    return NextResponse.redirect(new URL('/integrations?error=unknown_provider', request.nextUrl.origin));
  }

  const cfg = getOAuthConfig(provider);
  const creds = getClientCredentials(provider, cfg);

  if (!creds) {
    return NextResponse.redirect(
      new URL(`/integrations?error=${encodeURIComponent(`${provider} not configured`)}`, request.nextUrl.origin),
    );
  }

  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${request.nextUrl.origin}/api/auth/${provider}/callback`;

  const params_ = new URLSearchParams({
    client_id: creds.clientId,
    redirect_uri: redirectUri,
    state,
  });

  if (provider === 'github') {
    params_.set('scope', cfg.scopes.join(' '));
  } else if (provider === 'gitlab') {
    params_.set('response_type', 'code');
    params_.set('scope', cfg.scopes.join(' '));
  } else if (provider === 'bitbucket') {
    params_.set('response_type', 'code');
  }

  const authUrl = `${cfg.authorizeUrl}?${params_.toString()}`;

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(`oauth_state_${provider}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });

  return response;
}
