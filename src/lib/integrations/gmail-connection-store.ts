import type { EncryptedPayload } from './token-crypto';
import { decryptSecret, encryptSecret } from './token-crypto';
import {
  deleteIntegrationSecret,
  readIntegrationSecret,
  writeIntegrationSecret
} from './integration-secret-store';
import { readFile } from 'fs/promises';
import path from 'path';

export interface GmailConnectionRecord {
  email: string;
  refreshToken: EncryptedPayload;
  connectedAt: string;
}

const LEGACY_STORE_PATH = path.join(
  process.cwd(),
  '.data',
  'integrations',
  'gmail-connections.json'
);

async function readLegacyStore(): Promise<Record<string, GmailConnectionRecord>> {
  try {
    const raw = await readFile(LEGACY_STORE_PATH, 'utf8');
    return JSON.parse(raw) as Record<string, GmailConnectionRecord>;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

export async function getGmailConnection(
  appTenantId: string
): Promise<GmailConnectionRecord | null> {
  const record = await readIntegrationSecret<GmailConnectionRecord>('gmail', appTenantId);
  if (record) return record;

  const legacy = await readLegacyStore();
  return legacy[appTenantId] ?? null;
}

export async function saveGmailConnection(
  appTenantId: string,
  input: { email: string; refreshToken: string }
): Promise<GmailConnectionRecord> {
  const record: GmailConnectionRecord = {
    email: input.email,
    refreshToken: encryptSecret(input.refreshToken),
    connectedAt: new Date().toISOString()
  };

  await writeIntegrationSecret('gmail', appTenantId, record);
  return record;
}

export async function getGmailRefreshToken(appTenantId: string): Promise<string | null> {
  const connection = await getGmailConnection(appTenantId);
  if (!connection) return null;
  return decryptSecret(connection.refreshToken);
}

export async function deleteGmailConnection(appTenantId: string): Promise<void> {
  await deleteIntegrationSecret('gmail', appTenantId);
}
