import { NextRequest, NextResponse } from 'next/server';
import { isGitProvider, getGitService } from '@/lib/integrations';

const WEBHOOK_SECRETS: Record<string, string | undefined> = {
  github: process.env.GITHUB_WEBHOOK_SECRET,
  gitlab: process.env.GITLAB_WEBHOOK_SECRET,
  bitbucket: process.env.BITBUCKET_WEBHOOK_SECRET,
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;

  if (!isGitProvider(provider)) {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
  }

  const secret = WEBHOOK_SECRETS[provider];
  if (!secret) {
    console.error(`[webhook/${provider}] No webhook secret configured`);
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const rawBody = await request.text();
  const service = getGitService(provider);

  // Verify signature
  const sigHeader = getSignatureHeader(provider, request);
  if (sigHeader) {
    const valid = service.verifyWebhookSignature(rawBody, sigHeader, secret);
    if (!valid) {
      console.warn(`[webhook/${provider}] Invalid signature`);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  // Parse the event
  const requestHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => { requestHeaders[key] = value; });

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const event = service.parseWebhookEvent(requestHeaders, body);
  console.log(`[webhook/${provider}] Received ${event.type} event from ${event.repository.full_name}`);

  // Forward to atlas-service for processing (commit/PR → ticket linking)
  const atlasBase = process.env.NEXT_PUBLIC_ATLAS_SERVICE_URL ?? 'http://localhost:8082';
  const internalSecret = process.env.ATLAS_INTERNAL_SECRET;
  const forwardHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (internalSecret) {
    forwardHeaders['Authorization'] = `Bearer ${internalSecret}`;
  }
  try {
    await fetch(`${atlasBase}/internal/v1/webhooks/git/ingest`, {
      method: 'POST',
      headers: forwardHeaders,
      body: JSON.stringify({
        provider,
        event_type: event.type,
        action: event.action,
        repository: event.repository,
        sender: event.sender,
        ref: event.ref,
        sha: event.sha,
        commits: event.commits,
        pull_request: event.pull_request,
        pipeline: event.pipeline,
        delivery_id: event.delivery_id,
        received_at: event.timestamp,
        raw_headers: requestHeaders,
      }),
    });
  } catch (err) {
    console.error(`[webhook/${provider}] Failed to forward to atlas-service:`, err);
  }

  return NextResponse.json({ received: true, type: event.type });
}

function getSignatureHeader(provider: string, request: NextRequest): string | null {
  switch (provider) {
    case 'github':
      return request.headers.get('x-hub-signature-256');
    case 'gitlab':
      return request.headers.get('x-gitlab-token');
    case 'bitbucket':
      return request.headers.get('x-hub-signature');
    default:
      return null;
  }
}
