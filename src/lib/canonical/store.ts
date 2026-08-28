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
