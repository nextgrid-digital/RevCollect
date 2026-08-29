import { MOCK_TENANT_ID } from '@/features/revcollect/api/types';
import { listProviderTenantKeys } from '@/lib/integrations/integration-secret-store';

/** Tenant ids for scheduled Chase. No Next request APIs — safe for eve tools. */
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

export async function getChaseWorkspaceTenantId(): Promise<string> {
  const ids = await listChaseTenantIds();
  return ids[0] ?? MOCK_TENANT_ID;
}
