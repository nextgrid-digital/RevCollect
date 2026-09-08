import { NextResponse, type NextRequest } from 'next/server';
import { confirmCheckoutSession } from '@/lib/billing/webhooks';
import { getAuthUserId } from '@/lib/supabase/get-auth-user';
import { getIntegrationTenantId } from '@/lib/integrations/tenant';
import { parseJsonBody } from '@/lib/json/parse-json-body';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = parseJsonBody<{ sessionId?: string }>(await request.text());
  const sessionId = body.sessionId?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  }

  try {
    const tenantId = await getIntegrationTenantId();
    await confirmCheckoutSession(sessionId, tenantId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Confirm failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
