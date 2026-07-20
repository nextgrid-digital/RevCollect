import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import type { EncryptedPayload } from './token-crypto';
import { decryptSecret, encryptSecret } from './token-crypto';

export interface XeroConnectionRecord {
  tenantId: string;
  organisationName: string;
  refreshToken: EncryptedPayload;
  connectedAt: string;
}

type XeroConnectionStoreFile = Record<string, XeroConnectionRecord>;

const STORE_DIR = path.join(process.cwd(), '.data', 'integrations');
const STORE_PATH = path.join(STORE_DIR, 'xero-connections.json');

async function readStore(): Promise<XeroConnectionStoreFile> {
  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    return JSON.parse(raw) as XeroConnectionStoreFile;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

async function writeStore(store: XeroConnectionStoreFile): Promise<void> {
  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

export async function getXeroConnection(tenantId: string): Promise<XeroConnectionRecord | null> {
  const store = await readStore();
  return store[tenantId] ?? null;
}

export async function saveXeroConnection(
  tenantId: string,
  input: { xeroTenantId: string; organisationName: string; refreshToken: string }
): Promise<XeroConnectionRecord> {
  const record: XeroConnectionRecord = {
    tenantId: input.xeroTenantId,
    organisationName: input.organisationName,
    refreshToken: encryptSecret(input.refreshToken),
    connectedAt: new Date().toISOString()
  };

  const store = await readStore();
  store[tenantId] = record;
  await writeStore(store);

  return record;
}

export async function getXeroRefreshToken(tenantId: string): Promise<string | null> {
  const connection = await getXeroConnection(tenantId);
  if (!connection) return null;
  return decryptSecret(connection.refreshToken);
}
