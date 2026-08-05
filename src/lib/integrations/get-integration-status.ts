import type { IntegrationStatus } from '@/features/revcollect/types';
import { getGmailConnection } from './gmail-connection-store';
import { getIntegrationTenantId } from './tenant';
import { getXeroConnection } from './xero-connection-store';

const DISCONNECTED = {
  gmail: { connected: false, label: 'Gmail', detail: 'Not connected' },
  xero: { connected: false, label: 'Xero', detail: 'Not connected' },
  stripe: { connected: false, label: 'Stripe', detail: 'Not connected' }
} as const satisfies IntegrationStatus;

export async function getIntegrationStatus(): Promise<IntegrationStatus> {
  const tenantId = getIntegrationTenantId();
  const [gmailConnection, xeroConnection] = await Promise.all([
    getGmailConnection(tenantId),
    getXeroConnection(tenantId)
  ]);

  return {
    gmail: gmailConnection
      ? {
          connected: true,
          label: 'Gmail',
          detail: gmailConnection.email
        }
      : DISCONNECTED.gmail,
    xero: xeroConnection
      ? {
          connected: true,
          label: 'Xero',
          detail: xeroConnection.organisationName
        }
      : DISCONNECTED.xero,
    stripe: DISCONNECTED.stripe
  };
}
