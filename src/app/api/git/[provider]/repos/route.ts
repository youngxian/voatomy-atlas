import { NextRequest, NextResponse } from 'next/server';
import { isGitProvider, getGitService } from '@/lib/integrations';
import { getTokens } from '@/lib/integrations/token-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (!isGitProvider(provider)) {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
  }

  const tokens = await getTokens(provider);
  if (!tokens) {
    return NextResponse.json({ error: 'Not connected' }, { status: 401 });
  }

  const page = Number(request.nextUrl.searchParams.get('page')) || 1;
  const per_page = Number(request.nextUrl.searchParams.get('per_page')) || 30;

  try {
    const service = getGitService(provider);
    const repos = await service.listRepositories(tokens.access_token, { page, per_page });
    return NextResponse.json(repos);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
