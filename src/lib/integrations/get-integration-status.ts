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
  zoho: { connected: false, label: 'Zoho Books', detail: 'Not connected' },
  stripe: { connected: false, label: 'Stripe', detail: 'Not connected' }
} as const satisfies IntegrationStatus;

async function getBooksLastSyncAt(tenantId: string): Promise<string | null> {
  if (hasSupabaseAdminEnv()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .maybeSingle();
      if (!error) {
        const lastSyncedAt = (data as { last_synced_at?: string | null } | null)?.last_synced_at;
        if (lastSyncedAt) return lastSyncedAt;
      }
    } catch {
      // Fall through to snapshot ingestedAt.
    }
  }
  try {
    const snapshot = await (await getCanonicalStore()).read(tenantId);
    return snapshot.ingestedAt;
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
      : DISCONNECTED_INTEGRATION_STATUS.zoho,
    stripe: DISCONNECTED_INTEGRATION_STATUS.stripe
  };
}
