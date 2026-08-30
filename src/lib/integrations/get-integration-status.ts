import type { IntegrationStatus } from '@/features/revcollect/types';
import { getCanonicalStore } from '@/lib/canonical/store';
import { createAdminClient, hasSupabaseAdminEnv } from '@/lib/supabase/admin';
import { getGmailConnection } from './gmail-connection-store';
import { getIntegrationTenantId } from './tenant';
import { getXeroConnection } from './xero-connection-store';

export const DISCONNECTED_INTEGRATION_STATUS = {
  gmail: { connected: false, label: 'Gmail', detail: 'Not connected' },
  xero: { connected: false, label: 'Xero', detail: 'Not connected' },
  stripe: { connected: false, label: 'Stripe', detail: 'Not connected' }
} as const satisfies IntegrationStatus;

async function getXeroLastSyncAt(tenantId: string): Promise<string | null> {
  if (!hasSupabaseAdminEnv()) return null;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .maybeSingle();
    if (error) return null;
    const lastSyncedAt = (data as { last_synced_at?: string | null } | null)?.last_synced_at;
    return lastSyncedAt ?? null;
  } catch {
    return null;
  }
}

export async function getIntegrationStatus(): Promise<IntegrationStatus> {
  const tenantId = await getIntegrationTenantId();
  const [gmailConnection, xeroConnection] = await Promise.all([
    getGmailConnection(tenantId),
    getXeroConnection(tenantId)
  ]);

  const lastSyncedAt = xeroConnection ? await getXeroLastSyncAt(tenantId) : null;
  let lastSyncAt = lastSyncedAt;
  if (xeroConnection && !lastSyncAt) {
    try {
      const snapshot = await (await getCanonicalStore()).read(tenantId);
      lastSyncAt = snapshot.ingestedAt;
    } catch {
      lastSyncAt = null;
    }
  }

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
    stripe: DISCONNECTED_INTEGRATION_STATUS.stripe
  };
}
