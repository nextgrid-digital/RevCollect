import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/supabase/get-auth-user';
import { getConnectedBooksProvider, ingestConnectedBooks } from '@/lib/canonical/ingest-accounting';
import { XeroNotConnectedError } from '@/lib/integrations/xero-api';
import { getIntegrationTenantId } from '@/lib/integrations/tenant';

export const runtime = 'nodejs';
export const maxDuration = 60;

function disconnectedResponse() {
  return NextResponse.json(
    { error: 'Accounting is not connected', code: 'xero_disconnected' as const },
    { status: 409 }
  );
}

function expiredResponse() {
  return NextResponse.json(
    { error: 'Accounting session expired. Reconnect in Settings.', code: 'xero_expired' as const },
    { status: 409 }
  );
}

export async function POST() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = await getIntegrationTenantId();
  const provider = await getConnectedBooksProvider(tenantId);
  if (!provider) {
    return disconnectedResponse();
  }

  try {
    const snapshot = await ingestConnectedBooks(tenantId);
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
    console.error('[books/resync] failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Resync failed' },
      { status: 500 }
    );
  }
}
