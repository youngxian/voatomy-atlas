import { NextRequest, NextResponse } from 'next/server';
import { isGitProvider, getOAuthConfig } from '@/lib/integrations';
import { storeTokens } from '@/lib/integrations/token-store';
import { getClientCredentials } from '@/lib/integrations/credential-store';
import type { OAuthTokens } from '@/lib/integrations/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;

  if (!isGitProvider(provider)) {
    return NextResponse.redirect(new URL('/integrations?error=unknown_provider', request.nextUrl.origin));
  }

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const storedState = request.cookies.get(`oauth_state_${provider}`)?.value;

  if (!code) {
    const error = request.nextUrl.searchParams.get('error_description') || request.nextUrl.searchParams.get('error') || 'no_code';
    return NextResponse.redirect(new URL(`/integrations?error=${encodeURIComponent(error)}`, request.nextUrl.origin));
  }

  if (!state || state !== storedState) {
    return NextResponse.redirect(new URL('/integrations?error=state_mismatch', request.nextUrl.origin));
  }

  const cfg = getOAuthConfig(provider);
  const creds = getClientCredentials(provider, cfg);

  if (!creds) {
    return NextResponse.redirect(new URL('/integrations?error=not_configured', request.nextUrl.origin));
  }

  try {
    const tokens = await exchangeCode(
      provider,
      cfg.tokenUrl,
      creds.clientId,
      creds.clientSecret,
      code,
      `${request.nextUrl.origin}/api/auth/${provider}/callback`,
    );
    await storeTokens(provider, tokens);

    const response = NextResponse.redirect(new URL(`/integrations/${provider}?connected=true`, request.nextUrl.origin));
    response.cookies.delete(`oauth_state_${provider}`);
    return response;
  } catch (err) {
    console.error(`[oauth/${provider}] Token exchange failed:`, err);
    return NextResponse.redirect(new URL(`/integrations?error=token_exchange_failed&provider=${provider}`, request.nextUrl.origin));
  }
}

async function exchangeCode(
  provider: string,
  tokenUrl: string,
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string,
): Promise<OAuthTokens> {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
  });

  if (provider === 'gitlab') {
    body.set('grant_type', 'authorization_code');
  } else if (provider === 'bitbucket') {
    body.set('grant_type', 'authorization_code');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json',
  };

  if (provider === 'bitbucket') {
    headers.Authorization = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    body.delete('client_id');
    body.delete('client_secret');
  }

  const res = await fetch(tokenUrl, { method: 'POST', headers, body: body.toString() });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_type: data.token_type ?? 'bearer',
    expires_in: data.expires_in,
    scope: data.scope,
    created_at: data.created_at ?? Math.floor(Date.now() / 1000),
  };
}
