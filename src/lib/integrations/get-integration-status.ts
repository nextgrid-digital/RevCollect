import type { IntegrationStatus } from '@/features/revcollect/types';
import { getCanonicalStore } from '@/lib/canonical/store';
import { createAdminClient, hasSupabaseAdminEnv } from '@/lib/supabase/admin';
import { getGmailConnection } from './gmail-connection-store';
import { getQuickBooksConnection } from './quickbooks-connection-store';
import { getIntegrationTenantId } from './tenant';
import { getXeroConnection } from './xero-connection-store';
import { getZohoConnection } from './zoho-connection-store';

export const DISCONNECTED_INTEGRATION_STATUS = {
  gmail: { connected: false, label: 'Gmail', detail: 'Not connected' },
  xero: { connected: false, label: 'Xero', detail: 'Not connected' },
  quickbooks: { connected: false, label: 'QuickBooks', detail: 'Not connected' },
  zoho: { connected: false, label: 'Zoho Books', detail: 'Not connected' }
} as const satisfies IntegrationStatus;

async function getBooksLastSyncAt(tenantId: string): Promise<string | null> {
  try {
    const snapshot = await (await getCanonicalStore()).read(tenantId);
    // A completed sync sets ingestedAt even when the ledger has no open AR.
    // Ignoring that timestamp left the header pill on "Waiting for sync".
    if (snapshot.ingestedAt) return snapshot.ingestedAt;
  } catch {
    // Store read failed — try tenants.last_synced_at as a fallback.
  }

  if (!hasSupabaseAdminEnv()) return null;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('tenants')
      .select('last_synced_at')
      .eq('id', tenantId)
      .maybeSingle();
    if (!error) {
      const stamped = (data as { last_synced_at?: string | null } | null)?.last_synced_at;
      if (stamped) return stamped;
    }

    // Rows can exist from an ingest that never wrote last_synced_at.
    // Without this, the header stays on "Waiting for sync" beside a full customer list.
    const { data: newest, error: newestError } = await supabase
      .from('customers')
      .select('created_at')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (newestError) return null;
    return (newest as { created_at?: string | null } | null)?.created_at ?? null;
  } catch {
    return null;
  }
}

export async function getIntegrationStatus(): Promise<IntegrationStatus> {
  const tenantId = await getIntegrationTenantId();
  const [gmailConnection, xeroConnection, quickbooksConnection, zohoConnection] = await Promise.all(
    [
      getGmailConnection(tenantId),
      getXeroConnection(tenantId),
      getQuickBooksConnection(tenantId),
      getZohoConnection(tenantId)
    ]
  );

  const booksConnected = Boolean(xeroConnection || quickbooksConnection || zohoConnection);
  const lastSyncAt = booksConnected ? await getBooksLastSyncAt(tenantId) : null;

  return {
    gmail: gmailConnection
      ? {
          connected: true,
          label: 'Gmail',
          detail: gmailConnection.email
        }
      : DISCONNECTED_INTEGRATION_STATUS.gmail,
    xero: xeroConnection
      ? {
          connected: true,
          label: 'Xero',
          detail: xeroConnection.organisationName,
          lastSyncAt
        }
      : DISCONNECTED_INTEGRATION_STATUS.xero,
    quickbooks: quickbooksConnection
      ? {
          connected: true,
          label: 'QuickBooks',
          detail: quickbooksConnection.organisationName,
          lastSyncAt
        }
      : DISCONNECTED_INTEGRATION_STATUS.quickbooks,
    zoho: zohoConnection
      ? {
          connected: true,
          label: 'Zoho Books',
          detail: zohoConnection.organisationName,
          lastSyncAt
        }
      : DISCONNECTED_INTEGRATION_STATUS.zoho
  };
}
