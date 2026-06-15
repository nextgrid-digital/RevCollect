import type { RevCollectService } from './service';
import { getMockRevCollectService } from './mock-service';

export type DataSource = 'mock' | 'supabase';

function resolveDataSource(): DataSource {
  const source = process.env.NEXT_PUBLIC_REV_COLLECT_DATA_SOURCE;
  if (source === 'supabase') return 'supabase';
  return 'mock';
}

let service: RevCollectService | undefined;

export function getRevCollectService(): RevCollectService {
  if (service) return service;

  const source = resolveDataSource();
  switch (source) {
    case 'mock':
      service = getMockRevCollectService();
      return service;
    case 'supabase':
      throw new Error(
        'Supabase data source is not implemented yet. Set NEXT_PUBLIC_REV_COLLECT_DATA_SOURCE=mock or omit it.'
      );
    default: {
      const _exhaustive: never = source;
      throw new Error(`Unknown data source: ${String(_exhaustive)}`);
    }
  }
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
