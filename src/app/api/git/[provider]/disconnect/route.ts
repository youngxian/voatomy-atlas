import { NextResponse } from 'next/server';
import { isGitProvider } from '@/lib/integrations';
import { clearTokens } from '@/lib/integrations/token-store';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (!isGitProvider(provider)) {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
  }

  await clearTokens(provider);
  return NextResponse.json({ disconnected: true });
}
