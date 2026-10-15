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
    const hasAr = snapshot.customers.length > 0 || snapshot.invoices.length > 0;
    // Do not advertise "Synced" when the AR snapshot is empty — badge and lists stay honest.
    if (!hasAr) return null;
    if (snapshot.ingestedAt) return snapshot.ingestedAt;
  } catch {
    // Store read failed — try tenants.last_synced_at as a fallback.
  }

  if (!hasSupabaseAdminEnv()) return null;
  try {
    const supabase = createAdminClient();
    const { count: customerCount, error: countError } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);
    if (countError || !customerCount) return null;

    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .maybeSingle();
    if (error) return null;
    return (data as { last_synced_at?: string | null } | null)?.last_synced_at ?? null;
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
