import { after } from 'next/server';
import { NextResponse, type NextRequest } from 'next/server';
import {
  extractQuickBooksWebhookRealmIds,
  getQuickBooksWebhookVerifierToken,
  processQuickBooksWebhookRealms,
  verifyQuickBooksWebhookSignature
} from '@/lib/integrations/quickbooks-webhooks';

export const runtime = 'nodejs';

/** Health / Intuit connectivity check. */
export async function GET() {
  const configured = Boolean(getQuickBooksWebhookVerifierToken());
  return NextResponse.json({
    ok: true,
    service: 'quickbooks-webhooks',
    verifierConfigured: configured
  });
}

/**
 * Intuit QBO webhooks — verify signature, return 200 quickly, ingest AR async.
 * Configure at developer.intuit.com → app → Webhooks (Development + Production).
 * Endpoint: https://app.revcollect.ai/api/webhooks/quickbooks
 */
export async function POST(request: NextRequest) {
  const verifier = getQuickBooksWebhookVerifierToken();
  if (!verifier) {
    return NextResponse.json(
      { error: 'INTUIT_WEBHOOK_VERIFIER_TOKEN is not set' },
      { status: 503 }
    );
  }

  const signature = request.headers.get('intuit-signature');
  const rawBody = await request.text();

  if (!verifyQuickBooksWebhookSignature(rawBody, signature, verifier)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: unknown = null;
  try {
    payload = rawBody.trim() ? JSON.parse(rawBody) : null;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const realmIds = extractQuickBooksWebhookRealmIds(payload);

  after(() => {
    void processQuickBooksWebhookRealms(realmIds);
  });

  return NextResponse.json({ received: true, realms: realmIds.length });
}
