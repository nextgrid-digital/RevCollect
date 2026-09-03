import type { EncryptedPayload } from './token-crypto';
import { decryptSecret, encryptSecret } from './token-crypto';
import {
  deleteIntegrationSecret,
  readIntegrationSecret,
  writeIntegrationSecret
} from './integration-secret-store';

export interface QuickBooksConnectionRecord {
  realmId: string;
  organisationName: string;
  refreshToken: EncryptedPayload;
  connectedAt: string;
}

export async function getQuickBooksConnection(
  appTenantId: string
): Promise<QuickBooksConnectionRecord | null> {
  return readIntegrationSecret<QuickBooksConnectionRecord>('quickbooks', appTenantId);
}

export async function saveQuickBooksConnection(
  appTenantId: string,
  input: { realmId: string; organisationName: string; refreshToken: string }
): Promise<QuickBooksConnectionRecord> {
  const record: QuickBooksConnectionRecord = {
    realmId: input.realmId,
    organisationName: input.organisationName,
    refreshToken: encryptSecret(input.refreshToken),
    connectedAt: new Date().toISOString()
  };
  await writeIntegrationSecret('quickbooks', appTenantId, record);
  return record;
}

export async function getQuickBooksRefreshToken(appTenantId: string): Promise<string | null> {
  const connection = await getQuickBooksConnection(appTenantId);
  if (!connection) return null;
  return decryptSecret(connection.refreshToken);
}

export async function updateQuickBooksRefreshToken(
  appTenantId: string,
  refreshToken: string
): Promise<void> {
  const connection = await getQuickBooksConnection(appTenantId);
  if (!connection) throw new Error('QuickBooks connection not found');
  await writeIntegrationSecret('quickbooks', appTenantId, {
    ...connection,
    refreshToken: encryptSecret(refreshToken)
  });
}

export async function deleteQuickBooksConnection(appTenantId: string): Promise<void> {
  await deleteIntegrationSecret('quickbooks', appTenantId);
}
