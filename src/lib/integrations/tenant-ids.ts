import { MOCK_TENANT_ID } from '@/features/revcollect/api/types';
import { listProviderTenantKeys } from '@/lib/integrations/integration-secret-store';

/** Tenant ids for scheduled ARI. No Next request APIs — safe for eve tools. */
export async function listAriTenantIds(): Promise<string[]> {
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

export async function getAriWorkspaceTenantId(): Promise<string> {
  const ids = await listAriTenantIds();
  return ids[0] ?? MOCK_TENANT_ID;
}
