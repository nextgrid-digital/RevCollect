import type { EncryptedPayload } from './token-crypto';
import { decryptSecret, encryptSecret } from './token-crypto';
import {
  deleteIntegrationSecret,
  readIntegrationSecret,
  writeIntegrationSecret
} from './integration-secret-store';

export interface ZohoConnectionRecord {
  organizationId: string;
  organisationName: string;
  refreshToken: EncryptedPayload;
  connectedAt: string;
  apiBase?: string;
}

export async function getZohoConnection(appTenantId: string): Promise<ZohoConnectionRecord | null> {
  return readIntegrationSecret<ZohoConnectionRecord>('zoho', appTenantId);
}

export async function saveZohoConnection(
  appTenantId: string,
  input: {
    organizationId: string;
    organisationName: string;
    refreshToken: string;
    apiBase?: string;
  }
): Promise<ZohoConnectionRecord> {
  const record: ZohoConnectionRecord = {
    organizationId: input.organizationId,
    organisationName: input.organisationName,
    refreshToken: encryptSecret(input.refreshToken),
    connectedAt: new Date().toISOString(),
    apiBase: input.apiBase
  };
  await writeIntegrationSecret('zoho', appTenantId, record);
  return record;
}

export async function getZohoRefreshToken(appTenantId: string): Promise<string | null> {
  const connection = await getZohoConnection(appTenantId);
  if (!connection) return null;
  return decryptSecret(connection.refreshToken);
}

export async function updateZohoRefreshToken(
  appTenantId: string,
  refreshToken: string
): Promise<void> {
  const connection = await getZohoConnection(appTenantId);
  if (!connection) throw new Error('Zoho connection not found');
  await writeIntegrationSecret('zoho', appTenantId, {
    ...connection,
    refreshToken: encryptSecret(refreshToken)
  });
}

export async function deleteZohoConnection(appTenantId: string): Promise<void> {
  await deleteIntegrationSecret('zoho', appTenantId);
}
