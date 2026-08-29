import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/supabase/get-auth-user';
import { ingestXeroAr } from '@/lib/canonical/ingest-xero';
import { XeroNotConnectedError } from '@/lib/integrations/xero-api';
import { getXeroConnection } from '@/lib/integrations/xero-connection-store';
import { getIntegrationTenantId } from '@/lib/integrations/tenant';

export const runtime = 'nodejs';
export const maxDuration = 60;

function disconnectedResponse() {
  return NextResponse.json(
    { error: 'Xero is not connected', code: 'xero_disconnected' as const },
    { status: 409 }
  );
}

function expiredResponse() {
  return NextResponse.json(
    { error: 'Xero session expired. Reconnect Xero.', code: 'xero_expired' as const },
    { status: 409 }
  );
}

export async function POST() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = await getIntegrationTenantId();
  const connection = await getXeroConnection(tenantId);
  if (!connection) {
    return disconnectedResponse();
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
      if (error.code === 'xero_expired') {
        return expiredResponse();
      }
      return disconnectedResponse();
    }
    console.error('[xero/resync] failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Xero resync failed' },
      { status: 500 }
    );
  }
}
