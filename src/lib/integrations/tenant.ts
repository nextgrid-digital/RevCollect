import { MOCK_TENANT_ID } from '@/features/revcollect/api/types';

/** Resolves tenant for integration routes until Clerk org mapping is wired. */
export function getIntegrationTenantId(): string {
  return MOCK_TENANT_ID;
}
