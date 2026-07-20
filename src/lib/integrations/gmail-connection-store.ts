import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import type { EncryptedPayload } from './token-crypto';
import { decryptSecret, encryptSecret } from './token-crypto';

export interface GmailConnectionRecord {
  email: string;
  refreshToken: EncryptedPayload;
  connectedAt: string;
}

type GmailConnectionStoreFile = Record<string, GmailConnectionRecord>;

const STORE_DIR = path.join(process.cwd(), '.data', 'integrations');
const STORE_PATH = path.join(STORE_DIR, 'gmail-connections.json');

async function readStore(): Promise<GmailConnectionStoreFile> {
  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    return JSON.parse(raw) as GmailConnectionStoreFile;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

async function writeStore(store: GmailConnectionStoreFile): Promise<void> {
  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

export async function getGmailConnection(tenantId: string): Promise<GmailConnectionRecord | null> {
  const store = await readStore();
  return store[tenantId] ?? null;
}

export async function saveGmailConnection(
  tenantId: string,
  input: { email: string; refreshToken: string }
): Promise<GmailConnectionRecord> {
  const record: GmailConnectionRecord = {
    email: input.email,
    refreshToken: encryptSecret(input.refreshToken),
    connectedAt: new Date().toISOString()
  };

  const store = await readStore();
  store[tenantId] = record;
  await writeStore(store);

  return record;
}

export async function getGmailRefreshToken(tenantId: string): Promise<string | null> {
  const connection = await getGmailConnection(tenantId);
  if (!connection) return null;
  return decryptSecret(connection.refreshToken);
}
