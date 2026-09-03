import { NextResponse } from 'next/server';
import { isCronRequest } from '@/lib/ari/cron-auth';
import { listAriTenantIds } from '@/lib/integrations/tenant';
import { runOvernightAri } from '@/lib/ari/run-overnight';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantIds = await listAriTenantIds();
  const results = [];
  for (const tenantId of tenantIds) {
    results.push(await runOvernightAri(tenantId, { forceHour: true }));
  }
  return NextResponse.json({ ok: true, results });
}
