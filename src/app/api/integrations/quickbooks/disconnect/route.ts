import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/supabase/get-auth-user';
import { disconnectQuickBooks } from '@/lib/integrations/disconnect-integration';
import { getIntegrationTenantId } from '@/lib/integrations/tenant';

export const runtime = 'nodejs';

export async function POST() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = await getIntegrationTenantId();
  await disconnectQuickBooks(tenantId);
  return NextResponse.json({ ok: true });
}
