import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/supabase/get-auth-user';
import { listAriTenantIds } from '@/lib/integrations/tenant';
import { runOvernightAri } from '@/lib/ari/run-overnight';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantIds = await listAriTenantIds();
  const results = [];
  for (const tenantId of tenantIds) {
    results.push(await runOvernightAri(tenantId, { forceHour: true }));
  }
  return NextResponse.json({ ok: true, results });
}
