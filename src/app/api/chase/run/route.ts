import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/supabase/get-auth-user';
import { listChaseTenantIds } from '@/lib/integrations/tenant';
import { runOvernightChase } from '@/lib/chase/run-overnight';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantIds = await listChaseTenantIds();
  const results = [];
  for (const tenantId of tenantIds) {
    results.push(await runOvernightChase(tenantId, { forceHour: true }));
  }
  return NextResponse.json({ ok: true, results });
}
