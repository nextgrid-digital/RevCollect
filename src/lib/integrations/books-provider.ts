export type BooksProvider = 'xero' | 'quickbooks' | 'zoho';

export const BOOKS_PROVIDERS: BooksProvider[] = ['xero', 'quickbooks', 'zoho'];

export const BOOKS_PROVIDER_LABELS: Record<BooksProvider, string> = {
  xero: 'Xero',
  quickbooks: 'QuickBooks',
  zoho: 'Zoho Books'
};

export function connectedBooksFromStatus(status: {
  xero: { connected: boolean };
  quickbooks: { connected: boolean };
  zoho: { connected: boolean };
}): BooksProvider | null {
  if (status.xero.connected) return 'xero';
  if (status.quickbooks.connected) return 'quickbooks';
  if (status.zoho.connected) return 'zoho';
  return null;
}
