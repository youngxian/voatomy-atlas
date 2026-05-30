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

  const owner = request.nextUrl.searchParams.get('owner');
  const repo = request.nextUrl.searchParams.get('repo');
  if (!owner || !repo) {
    return NextResponse.json({ error: 'owner and repo are required' }, { status: 400 });
  }

  try {
    const service = getGitService(provider);
    const hooks = await service.listWebhooks(tokens.access_token, owner, repo);
    return NextResponse.json(hooks);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}

export async function POST(
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

  const body = await request.json();
  const { owner, repo, events } = body;
  if (!owner || !repo || !events) {
    return NextResponse.json({ error: 'owner, repo, and events are required' }, { status: 400 });
  }

  const secret = process.env[`${provider.toUpperCase()}_WEBHOOK_SECRET`] ?? '';
  const webhookUrl = `${request.nextUrl.origin}/api/webhooks/${provider}`;

  try {
    const service = getGitService(provider);
    const hook = await service.createWebhook(tokens.access_token, owner, repo, {
      url: webhookUrl,
      secret,
      events,
    });
    return NextResponse.json(hook);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}

export async function DELETE(
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

  const owner = request.nextUrl.searchParams.get('owner');
  const repo = request.nextUrl.searchParams.get('repo');
  const hookId = request.nextUrl.searchParams.get('hookId');
  if (!owner || !repo || !hookId) {
    return NextResponse.json({ error: 'owner, repo, and hookId are required' }, { status: 400 });
  }

  try {
    const service = getGitService(provider);
    await service.deleteWebhook(tokens.access_token, owner, repo, hookId);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
