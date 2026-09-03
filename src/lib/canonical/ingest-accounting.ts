import { getCanonicalStore } from './store';
import { ingestXeroAr } from './ingest-xero';
import { ingestQuickBooksAr } from './ingest-quickbooks';
import { ingestZohoAr } from './ingest-zoho';
import { getXeroConnection } from '@/lib/integrations/xero-connection-store';
import { getQuickBooksConnection } from '@/lib/integrations/quickbooks-connection-store';
import { getZohoConnection } from '@/lib/integrations/zoho-connection-store';
import { XeroNotConnectedError } from '@/lib/integrations/xero-api';
import type { BooksProvider } from '@/lib/integrations/books-provider';
import { INGEST_STALE_MS, type CanonicalSnapshot } from './types';

export async function getConnectedBooksProvider(tenantId: string): Promise<BooksProvider | null> {
  if (await getXeroConnection(tenantId)) return 'xero';
  if (await getQuickBooksConnection(tenantId)) return 'quickbooks';
  if (await getZohoConnection(tenantId)) return 'zoho';
  return null;
}

export async function ingestConnectedBooks(tenantId: string): Promise<CanonicalSnapshot> {
  const provider = await getConnectedBooksProvider(tenantId);
  if (provider === 'quickbooks') return ingestQuickBooksAr(tenantId);
  if (provider === 'zoho') return ingestZohoAr(tenantId);
  return ingestXeroAr(tenantId);
}

export const fetchOpenAr = ingestConnectedBooks;

export async function ensureAccountingIngest(
  tenantId: string,
  force = false
): Promise<CanonicalSnapshot> {
  const store = await getCanonicalStore();
  const current = await store.read(tenantId);
  const provider = await getConnectedBooksProvider(tenantId);
  if (!provider) return current;

  const stale =
    !current.ingestedAt || Date.now() - new Date(current.ingestedAt).getTime() > INGEST_STALE_MS;
  const empty = current.customers.length === 0 && current.invoices.length === 0;
  const missingHistory = current.invoices.some(
    (invoice) => invoice.amountDueCents === undefined && invoice.xeroStatus !== 'CREDIT'
  );
  if (!force && !empty && !stale && !missingHistory) return current;

  try {
    return await ingestConnectedBooks(tenantId);
  } catch (error) {
    if (error instanceof XeroNotConnectedError) return current;
    throw error;
  }
}

const backgroundIngestInFlight = new Map<string, Promise<boolean>>();

export function isAccountingSnapshotStale(ingestedAt: string | null): boolean {
  return !ingestedAt || Date.now() - new Date(ingestedAt).getTime() > INGEST_STALE_MS;
}

export function scheduleBackgroundAccountingIngest(
  tenantId: string,
  ingestedAt: string | null
): Promise<boolean> {
  if (!isAccountingSnapshotStale(ingestedAt)) return Promise.resolve(false);

  const existing = backgroundIngestInFlight.get(tenantId);
  if (existing) return existing;

  const promise = (async () => {
    const provider = await getConnectedBooksProvider(tenantId);
    if (!provider) return false;
    await ingestConnectedBooks(tenantId);
    return true;
  })()
    .catch((error) => {
      if (error instanceof XeroNotConnectedError) return false;
      console.error('[ingest-accounting] background ingest failed:', error);
      return false;
    })
    .finally(() => {
      backgroundIngestInFlight.delete(tenantId);
    });

  backgroundIngestInFlight.set(tenantId, promise);
  return promise;
}
