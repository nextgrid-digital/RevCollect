import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/supabase/get-auth-user';
import { ingestXeroAr } from '@/lib/canonical/ingest-xero';
import { XeroNotConnectedError } from '@/lib/integrations/xero-api';
import { getXeroConnection } from '@/lib/integrations/xero-connection-store';
import { getIntegrationTenantId } from '@/lib/integrations/tenant';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = await getIntegrationTenantId();
  const connection = await getXeroConnection(tenantId);
  if (!connection) {
    return NextResponse.json({ error: 'Xero is not connected' }, { status: 409 });
  }

  try {
    const snapshot = await ingestXeroAr(tenantId);
    return NextResponse.json({
      lastSyncAt: snapshot.ingestedAt,
      customerCount: snapshot.customers.length,
      invoiceCount: snapshot.invoices.length
    });
  } catch (error) {
    if (error instanceof XeroNotConnectedError) {
      return NextResponse.json({ error: 'Xero is not connected' }, { status: 409 });
    }
    console.error('[xero/resync] failed:', error);
    return NextResponse.json({ error: 'Xero resync failed' }, { status: 500 });
  }
}
