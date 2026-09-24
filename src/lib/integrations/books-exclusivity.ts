import type { BooksProvider } from './books-provider';
import { BOOKS_PROVIDERS } from './books-provider';
import { getQuickBooksConnection } from './quickbooks-connection-store';
import { getXeroConnection } from './xero-connection-store';
import { getZohoConnection } from './zoho-connection-store';
import { disconnectOtherBooks } from './disconnect-integration';

export const BOOKS_ALREADY_CONNECTED = 'books_already_connected';

export interface BooksConnectionHit {
  provider: BooksProvider;
  connectedAt: string;
}

export async function listBooksConnections(tenantId: string): Promise<BooksConnectionHit[]> {
  const [xero, quickbooks, zoho] = await Promise.all([
    getXeroConnection(tenantId),
    getQuickBooksConnection(tenantId),
    getZohoConnection(tenantId)
  ]);
  const hits: BooksConnectionHit[] = [];
  if (xero) hits.push({ provider: 'xero', connectedAt: xero.connectedAt });
  if (quickbooks) hits.push({ provider: 'quickbooks', connectedAt: quickbooks.connectedAt });
  if (zoho) hits.push({ provider: 'zoho', connectedAt: zoho.connectedAt });
  return hits;
}

export function newestBooksProvider(hits: BooksConnectionHit[]): BooksProvider | null {
  if (hits.length === 0) return null;
  return [...hits].sort((left, right) => right.connectedAt.localeCompare(left.connectedAt))[0]
    .provider;
}

export async function reconcileExclusiveBooks(tenantId: string): Promise<BooksProvider | null> {
  const hits = await listBooksConnections(tenantId);
  const keep = newestBooksProvider(hits);
  if (!keep) return null;
  if (hits.length > 1) {
    await disconnectOtherBooks(tenantId, keep);
  }
  return keep;
}

export async function assertCanStartBooksConnect(
  tenantId: string,
  target: BooksProvider
): Promise<{ ok: true } | { ok: false; connected: BooksProvider }> {
  const connected = await reconcileExclusiveBooks(tenantId);
  if (connected && connected !== target) {
    return { ok: false, connected };
  }
  return { ok: true };
}

export function isBooksProvider(value: string): value is BooksProvider {
  return (BOOKS_PROVIDERS as string[]).includes(value);
}
