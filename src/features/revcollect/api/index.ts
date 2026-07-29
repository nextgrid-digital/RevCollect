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
      // Keep Xero/fs/token code out of the client bundle.
      if (typeof window === 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- server-only lazy load
        const { getXeroRevCollectService } =
          require('./xero-service') as typeof import('./xero-service');
        service = getXeroRevCollectService();
      } else {
        service = getHttpXeroRevCollectService();
      }
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
