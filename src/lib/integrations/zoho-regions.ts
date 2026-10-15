/**
 * Zoho Books data centers. One Server-based client (Multi-DC enabled) can
 * authorize against any of these hosts — pick the DC where the org lives.
 */
export type ZohoDataCenterId = 'us' | 'in' | 'eu' | 'au' | 'jp' | 'ca' | 'sa';

export interface ZohoDataCenter {
  id: ZohoDataCenterId;
  label: string;
  accountsUrl: string;
  apiBase: string;
}

export const ZOHO_DATA_CENTERS: readonly ZohoDataCenter[] = [
  {
    id: 'us',
    label: 'United States (zoho.com)',
    accountsUrl: 'https://accounts.zoho.com',
    apiBase: 'https://www.zohoapis.com/books/v3'
  },
  {
    id: 'in',
    label: 'India (zoho.in)',
    accountsUrl: 'https://accounts.zoho.in',
    apiBase: 'https://www.zohoapis.in/books/v3'
  },
  {
    id: 'eu',
    label: 'Europe (zoho.eu)',
    accountsUrl: 'https://accounts.zoho.eu',
    apiBase: 'https://www.zohoapis.eu/books/v3'
  },
  {
    id: 'au',
    label: 'Australia (zoho.com.au)',
    accountsUrl: 'https://accounts.zoho.com.au',
    apiBase: 'https://www.zohoapis.com.au/books/v3'
  },
  {
    id: 'jp',
    label: 'Japan (zoho.jp)',
    accountsUrl: 'https://accounts.zoho.jp',
    apiBase: 'https://www.zohoapis.jp/books/v3'
  },
  {
    id: 'ca',
    label: 'Canada (zohocloud.ca)',
    accountsUrl: 'https://accounts.zohocloud.ca',
    apiBase: 'https://www.zohoapis.ca/books/v3'
  },
  {
    id: 'sa',
    label: 'Saudi Arabia (zoho.sa)',
    accountsUrl: 'https://accounts.zoho.sa',
    apiBase: 'https://www.zohoapis.sa/books/v3'
  }
] as const;

export function getZohoDataCenter(id: string | null | undefined): ZohoDataCenter | null {
  if (!id) return null;
  return ZOHO_DATA_CENTERS.find((dc) => dc.id === id) ?? null;
}

export function resolveZohoDataCenterId(
  accountsUrl: string | null | undefined
): ZohoDataCenterId | null {
  if (!accountsUrl) return null;
  const normalized = accountsUrl.replace(/\/$/, '').toLowerCase();
  const match = ZOHO_DATA_CENTERS.find(
    (dc) => normalized === dc.accountsUrl || normalized.startsWith(dc.accountsUrl)
  );
  return match?.id ?? null;
}

/** Default DC from env (ZOHO_ACCOUNTS_URL or NEXT_PUBLIC_ZOHO_DEFAULT_DC). */
export function defaultZohoDataCenterIdFromEnv(): ZohoDataCenterId {
  const explicit = (process.env.NEXT_PUBLIC_ZOHO_DEFAULT_DC ?? '').trim().toLowerCase();
  const fromExplicit = getZohoDataCenter(explicit);
  if (fromExplicit) return fromExplicit.id;

  const accounts = (process.env.ZOHO_ACCOUNTS_URL ?? '').trim().toLowerCase();
  const fromEnv = resolveZohoDataCenterId(accounts);
  if (fromEnv) return fromEnv;
  return 'us';
}

/** Client-safe default (only NEXT_PUBLIC_*). */
export function defaultZohoDataCenterIdForClient(): ZohoDataCenterId {
  const explicit = (process.env.NEXT_PUBLIC_ZOHO_DEFAULT_DC ?? '').trim().toLowerCase();
  return getZohoDataCenter(explicit)?.id ?? 'us';
}

export function accountsUrlFromApiBase(apiBase: string | null | undefined): string | null {
  if (!apiBase) return null;
  const normalized = apiBase.replace(/\/$/, '').toLowerCase();
  const match = ZOHO_DATA_CENTERS.find((dc) => {
    const base = dc.apiBase.toLowerCase();
    const hostOnly = base.replace(/\/books\/v3$/, '');
    return normalized === base || normalized.startsWith(hostOnly);
  });
  return match?.accountsUrl ?? null;
}
