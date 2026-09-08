import { NextResponse } from 'next/server';
import { createBillingPortalUrl, StripeBillingNotConfiguredError } from '@/lib/billing/checkout';
import { getAuthUserId } from '@/lib/supabase/get-auth-user';

export const runtime = 'nodejs';

export async function POST() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = await createBillingPortalUrl();
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof StripeBillingNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    const message = error instanceof Error ? error.message : 'Portal failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
