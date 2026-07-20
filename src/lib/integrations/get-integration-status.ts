import { integrationStatus as mockIntegrationStatus } from '@/features/revcollect/mock-data';
import type { IntegrationStatus } from '@/features/revcollect/types';
import { getGmailConnection } from './gmail-connection-store';
import { getIntegrationTenantId } from './tenant';
import { getXeroConnection } from './xero-connection-store';

export async function getIntegrationStatus(): Promise<IntegrationStatus> {
  const tenantId = getIntegrationTenantId();
  const [gmailConnection, xeroConnection] = await Promise.all([
    getGmailConnection(tenantId),
    getXeroConnection(tenantId)
  ]);

  return {
    ...mockIntegrationStatus,
    gmail: gmailConnection
      ? {
          connected: true,
          label: 'Gmail',
          detail: gmailConnection.email
        }
      : mockIntegrationStatus.gmail,
    xero: xeroConnection
      ? {
          connected: true,
          label: 'Xero',
          detail: xeroConnection.organisationName
        }
      : mockIntegrationStatus.xero
  };
}
