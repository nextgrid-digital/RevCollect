import { NextResponse, type NextRequest } from 'next/server';
import { parseJsonBody } from '@/lib/json/parse-json-body';
import { StripeBillingNotConfiguredError, startCheckout } from '@/lib/billing/checkout';
import type { CheckoutKind } from '@/lib/billing/pricing';
import { getAuthUserId } from '@/lib/supabase/get-auth-user';

export const runtime = 'nodejs';

function parseKind(value: unknown): CheckoutKind {
  if (value === 'base' || value === 'base_and_agent' || value === 'agent') {
    return value;
  }
  return 'base';
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let kind: CheckoutKind = 'base';
  try {
    const body = parseJsonBody<{ kind?: unknown }>(await request.text());
    kind = parseKind(body.kind);
  } catch {
    kind = 'base';
  }

  try {
    const result = await startCheckout(kind);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof StripeBillingNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    const message = error instanceof Error ? error.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
