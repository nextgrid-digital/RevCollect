import { MOCK_TENANT_ID } from '@/features/revcollect/api/types';
import { copyCanonicalFile } from '@/lib/canonical/file-store';
import { getAuthUserId } from '@/lib/supabase/get-auth-user';
import {
  copyIntegrationSecret,
  listProviderTenantKeys
} from '@/lib/integrations/integration-secret-store';

/**
 * Workspace tenant for integration tokens and the canonical AR store.
 * When a user is signed in, their auth.uid() is the tenant id (until org mapping exists).
 * Existing MOCK_TENANT_ID connections are copied onto that user on first resolve.
 */
export async function getIntegrationTenantId(): Promise<string> {
  const userId = await getAuthUserId();
  if (userId) {
    await migrateLegacyWorkspace(userId);
    return userId;
  }

  const keys = await listProviderTenantKeys('xero');
  const preferred = keys.filter((id) => id !== MOCK_TENANT_ID);
  return preferred[0] ?? keys[0] ?? MOCK_TENANT_ID;
}

async function migrateLegacyWorkspace(userId: string): Promise<void> {
  if (userId === MOCK_TENANT_ID) return;
  await Promise.all([
    copyIntegrationSecret('xero', MOCK_TENANT_ID, userId),
    copyIntegrationSecret('gmail', MOCK_TENANT_ID, userId),
    copyCanonicalFile(MOCK_TENANT_ID, userId)
  ]);
}

export async function listChaseTenantIds(): Promise<string[]> {
  const keys = await listProviderTenantKeys('xero');
  if (keys.length === 0) {
    return [MOCK_TENANT_ID];
  }
  const unique = new Set(keys);
  if (unique.has(MOCK_TENANT_ID) && unique.size > 1) {
    unique.delete(MOCK_TENANT_ID);
  }
  return [...unique];
}
