import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/supabase/get-auth-user';
import { getConnectedBooksProvider, ingestConnectedBooks } from '@/lib/canonical/ingest-accounting';
import { XeroNotConnectedError } from '@/lib/integrations/xero-api';
import { ZohoNotConnectedError } from '@/lib/integrations/zoho-api';
import { getIntegrationTenantId } from '@/lib/integrations/tenant';
import { assertCanWrite, billingErrorResponse } from '@/lib/billing/entitlements';

export const runtime = 'nodejs';
export const maxDuration = 60;

function disconnectedResponse() {
  return NextResponse.json(
    { error: 'Accounting is not connected', code: 'books_disconnected' as const },
    { status: 409 }
  );
}

function expiredResponse() {
  return NextResponse.json(
    { error: 'Accounting session expired. Reconnect in Settings.', code: 'books_expired' as const },
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
    await assertCanWrite();
    const snapshot = await ingestConnectedBooks(tenantId);
    if (!snapshot.ingestedAt) {
      return NextResponse.json(
        { error: 'Sync completed but no data was written', code: 'books_empty' as const },
        { status: 500 }
      );
    }
    return NextResponse.json({
      lastSyncAt: snapshot.ingestedAt,
      customerCount: snapshot.customers.length,
      invoiceCount: snapshot.invoices.length,
      provider
    });
  } catch (error) {
    const billingResponse = billingErrorResponse(error);
    if (billingResponse) return billingResponse;
    if (error instanceof XeroNotConnectedError) {
      if (error.code === 'xero_expired') {
        return expiredResponse();
      }
      return disconnectedResponse();
    }
    if (error instanceof ZohoNotConnectedError) {
      if (error.code === 'zoho_expired') {
        return expiredResponse();
      }
      if (error.code === 'zoho_rate_limited') {
        return NextResponse.json(
          { error: error.message, code: 'zoho_rate_limited' as const },
          { status: 429 }
        );
      }
      return disconnectedResponse();
    }
    console.error('[books/resync] failed:', error);
    const message = error instanceof Error ? error.message : 'Resync failed';
    if (message === 'Sync returned no customers. Existing books were kept.') {
      return NextResponse.json({ error: message, code: 'books_kept' as const }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
