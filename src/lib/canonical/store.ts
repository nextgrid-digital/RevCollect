import { hasSupabaseAdminEnv } from '@/lib/supabase/admin';
import { fileCanonicalStore } from './file-store';
import { postgresCanonicalStore, postgresStoreAvailable } from './postgres-store';
import type { CanonicalStore } from './types';

let resolved: CanonicalStore | null = null;
let resolveInFlight: Promise<CanonicalStore> | null = null;

async function resolveStore(): Promise<CanonicalStore> {
  if (!hasSupabaseAdminEnv()) {
    return fileCanonicalStore;
  }
  const available = await postgresStoreAvailable();
  return available ? postgresCanonicalStore : fileCanonicalStore;
}

export async function getCanonicalStore(): Promise<CanonicalStore> {
  if (resolved) return resolved;
  if (!resolveInFlight) {
    resolveInFlight = resolveStore().then((store) => {
      resolved = store;
      return store;
    });
  }
  return resolveInFlight;
}

export function resetCanonicalStoreCache(): void {
  resolved = null;
  resolveInFlight = null;
}

/** Copy AR snapshot when the target tenant has no customers/invoices yet. */
export async function copyCanonicalIfEmpty(
  fromTenantId: string,
  toTenantId: string
): Promise<void> {
  if (fromTenantId === toTenantId) return;
  const store = await getCanonicalStore();
  const [source, target] = await Promise.all([store.read(fromTenantId), store.read(toTenantId)]);
  const targetEmpty =
    target.customers.length === 0 && target.invoices.length === 0 && !target.ingestedAt;
  if (!targetEmpty) return;
  if (source.customers.length === 0 && source.invoices.length === 0 && !source.ingestedAt) {
    return;
  }
  await store.write(toTenantId, source);
}
