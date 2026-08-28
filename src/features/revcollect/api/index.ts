import type { RevCollectService } from './service';
import { getMockRevCollectService } from './mock-service';
import { getHttpXeroRevCollectService } from './http-xero-service';

export type DataSource = 'mock' | 'xero' | 'supabase';

function resolveDataSource(): DataSource {
  const source = process.env.NEXT_PUBLIC_REV_COLLECT_DATA_SOURCE;
  if (source === 'supabase') return 'supabase';
  if (source === 'xero') return 'xero';
  if (source === 'mock') return 'mock';
  return 'xero';
}

let service: RevCollectService | undefined;

export function getRevCollectService(): RevCollectService {
  if (service) return service;

  const source = resolveDataSource();
  switch (source) {
    case 'mock':
      service = getMockRevCollectService();
      return service;
    case 'xero':
      // Client components (and their SSR) must use the HTTP BFF. `typeof window`
      // is undefined during Client Component SSR, so a window check would pull
      // xero-service → next/headers into the client graph and fail the build.
      // Route handlers import getXeroRevCollectService() directly.
      service = getHttpXeroRevCollectService();
      return service;
    case 'supabase':
      throw new Error(
        'Supabase data source is not implemented yet. Set NEXT_PUBLIC_REV_COLLECT_DATA_SOURCE=xero or mock.'
      );
    default: {
      const _exhaustive: never = source;
      throw new Error(`Unknown data source: ${String(_exhaustive)}`);
    }
  }
}

export function getRevCollectDataSource(): DataSource {
  return resolveDataSource();
}

export { MOCK_TENANT_ID, RETENTION_EMAIL_BODY_MONTHS, RETENTION_POST_CANCEL_DAYS } from './types';
export type {
  DataAccessEvent,
  DataAccessAction,
  DeletionRequestResult,
  InboxSelectionData,
  TenantDataExport,
  TenantId
} from './types';
