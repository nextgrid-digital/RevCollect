import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { parseJsonBody } from '@/lib/json/parse-json-body';
import { emptySnapshot } from './defaults';
import type { CanonicalSnapshot, CanonicalStore } from './types';

const STORE_DIR = path.join(process.cwd(), '.data', 'canonical');

function snapshotPath(tenantId: string): string {
  return path.join(STORE_DIR, `${tenantId}.json`);
}

async function readSnapshot(tenantId: string): Promise<CanonicalSnapshot> {
  try {
    const raw = await readFile(snapshotPath(tenantId), 'utf8');
    const parsed = parseJsonBody<
      CanonicalSnapshot & {
        chaseRuns?: CanonicalSnapshot['ariRuns'];
      }
    >(raw);
    return {
      ...emptySnapshot(),
      ...parsed,
      ariRuns: parsed.ariRuns ?? parsed.chaseRuns ?? []
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return emptySnapshot();
    }
    console.error('[canonical/file-store] could not read snapshot', tenantId, error);
    return emptySnapshot();
  }
}

async function writeSnapshot(tenantId: string, snapshot: CanonicalSnapshot): Promise<void> {
  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(snapshotPath(tenantId), JSON.stringify(snapshot, null, 2), 'utf8');
}

export async function copyCanonicalFile(fromTenantId: string, toTenantId: string): Promise<void> {
  if (fromTenantId === toTenantId) return;
  const source = await readSnapshot(fromTenantId);
  const target = await readSnapshot(toTenantId);
  const targetEmpty =
    target.customers.length === 0 && target.invoices.length === 0 && !target.ingestedAt;
  if (!targetEmpty) return;
  if (source.customers.length === 0 && source.invoices.length === 0 && !source.ingestedAt) {
    return;
  }
  await writeSnapshot(toTenantId, source);
}

export const fileCanonicalStore: CanonicalStore = {
  read(tenantId) {
    return readSnapshot(tenantId);
  },
  async write(tenantId, snapshot) {
    await writeSnapshot(tenantId, snapshot);
  },
  async replaceAr(tenantId, payload) {
    const current = await readSnapshot(tenantId);
    const next: CanonicalSnapshot = {
      ...current,
      customers: payload.customers,
      invoices: payload.invoices,
      payments: payload.payments,
      inboxMessages: payload.inboxMessages,
      ingestedAt: new Date().toISOString()
    };
    await writeSnapshot(tenantId, next);
    return next;
  }
};
