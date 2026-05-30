import { NextResponse } from 'next/server';
import { isGitProvider, getGitService } from '@/lib/integrations';
import { getTokens, hasTokens } from '@/lib/integrations/token-store';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (!isGitProvider(provider)) {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
  }

  const connected = await hasTokens(provider);
  if (!connected) {
    return NextResponse.json({ connected: false, user: null });
  }

  const tokens = await getTokens(provider);
  if (!tokens) {
    return NextResponse.json({ connected: false, user: null });
  }

  try {
    const service = getGitService(provider);
    const user = await service.getUser(tokens.access_token);
    return NextResponse.json({ connected: true, user });
  } catch {
    return NextResponse.json({ connected: true, user: null });
  }
}
