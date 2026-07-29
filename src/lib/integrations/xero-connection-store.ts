import type { EncryptedPayload } from './token-crypto';
import { decryptSecret, encryptSecret } from './token-crypto';
import {
  deleteIntegrationSecret,
  readIntegrationSecret,
  writeIntegrationSecret
} from './integration-secret-store';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

export interface XeroConnectionRecord {
  tenantId: string;
  organisationName: string;
  refreshToken: EncryptedPayload;
  connectedAt: string;
}

const LEGACY_STORE_PATH = path.join(
  process.cwd(),
  '.data',
  'integrations',
  'xero-connections.json'
);

async function readLegacyStore(): Promise<Record<string, XeroConnectionRecord>> {
  try {
    const raw = await readFile(LEGACY_STORE_PATH, 'utf8');
    return JSON.parse(raw) as Record<string, XeroConnectionRecord>;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

async function migrateLegacyRecord(
  appTenantId: string,
  record: XeroConnectionRecord
): Promise<void> {
  await writeIntegrationSecret('xero', appTenantId, record);

  const legacy = await readLegacyStore();
  if (!legacy[appTenantId]) return;

  delete legacy[appTenantId];
  await mkdir(path.dirname(LEGACY_STORE_PATH), { recursive: true });
  await writeFile(LEGACY_STORE_PATH, JSON.stringify(legacy, null, 2), 'utf8');
}

export async function getXeroConnection(appTenantId: string): Promise<XeroConnectionRecord | null> {
  const record = await readIntegrationSecret<XeroConnectionRecord>('xero', appTenantId);
  if (record) return record;

  const legacy = await readLegacyStore();
  const legacyRecord = legacy[appTenantId];
  if (!legacyRecord) return null;

  await migrateLegacyRecord(appTenantId, legacyRecord);
  return legacyRecord;
}

export async function saveXeroConnection(
  appTenantId: string,
  input: { xeroTenantId: string; organisationName: string; refreshToken: string }
): Promise<XeroConnectionRecord> {
  const record: XeroConnectionRecord = {
    tenantId: input.xeroTenantId,
    organisationName: input.organisationName,
    refreshToken: encryptSecret(input.refreshToken),
    connectedAt: new Date().toISOString()
  };

  await writeIntegrationSecret('xero', appTenantId, record);
  return record;
}

export async function getXeroRefreshToken(appTenantId: string): Promise<string | null> {
  const connection = await getXeroConnection(appTenantId);
  if (!connection) return null;
  return decryptSecret(connection.refreshToken);
}

export async function updateXeroRefreshToken(
  appTenantId: string,
  refreshToken: string
): Promise<void> {
  const connection = await getXeroConnection(appTenantId);
  if (!connection) {
    throw new Error('Xero connection not found');
  }

  await writeIntegrationSecret('xero', appTenantId, {
    ...connection,
    refreshToken: encryptSecret(refreshToken)
  });
}

export async function deleteXeroConnection(appTenantId: string): Promise<void> {
  await deleteIntegrationSecret('xero', appTenantId);

  const legacy = await readLegacyStore();
  if (!legacy[appTenantId]) return;

  delete legacy[appTenantId];
  await writeFile(LEGACY_STORE_PATH, JSON.stringify(legacy, null, 2), 'utf8');
}
