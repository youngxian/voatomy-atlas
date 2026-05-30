import { NextRequest, NextResponse } from 'next/server';
import { isGitProvider, getOAuthConfig } from '@/lib/integrations';
import { getClientCredentials } from '@/lib/integrations/credential-store';

/**
 * GET — Check whether credentials exist in environment variables for a provider.
 * POST/DELETE are no longer supported — all credentials come from env vars.
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (!isGitProvider(provider)) {
    return NextResponse.json({ configured: false, error: 'Unknown provider' });
  }

  const cfg = getOAuthConfig(provider);
  const creds = getClientCredentials(provider, cfg);

  return NextResponse.json({
    configured: !!creds,
    provider,
    source: creds ? 'env' : null,
  });
}
