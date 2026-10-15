import { getIntegrationTenantId } from './tenant';
import {
  deleteZohoConnection,
  getZohoConnection,
  getZohoRefreshToken,
  updateZohoRefreshToken
} from './zoho-connection-store';
import { accountsUrlFromApiBase } from './zoho-regions';
import {
  getZohoOAuthConfig,
  isZohoInvalidGrantError,
  isZohoRateLimitError,
  refreshZohoAccessToken
} from './zoho-oauth';

export type ZohoConnectionErrorCode = 'zoho_disconnected' | 'zoho_expired' | 'zoho_rate_limited';

export class ZohoNotConnectedError extends Error {
  readonly code: ZohoConnectionErrorCode;

  constructor(
    message = 'Zoho Books is not connected',
    code: ZohoConnectionErrorCode = 'zoho_disconnected'
  ) {
    super(message);
    this.name = 'ZohoNotConnectedError';
    this.code = code;
  }
}

type ZohoAccess = {
  accessToken: string;
  organizationId: string;
  apiBase: string;
};

/** In-memory access tokens — Zoho rate-limits refresh if called on every request. */
const accessCache = new Map<string, ZohoAccess & { expiresAt: number }>();
const refreshInFlight = new Map<string, Promise<ZohoAccess>>();
/** Refresh a bit before Zoho's expiry (tokens are typically ~1 hour). */
const ACCESS_SKEW_MS = 60_000;

export interface ZohoContact {
  contact_id: string;
  contact_name?: string;
  email?: string;
  company_name?: string;
  contact_persons?: Array<{ email?: string; is_primary_contact?: boolean }>;
}

export interface ZohoInvoice {
  invoice_id: string;
  invoice_number?: string;
  customer_id?: string;
  total?: number;
  balance?: number;
  due_date?: string;
  date?: string;
  status?: string;
}

export interface ZohoPayment {
  payment_id: string;
  customer_id?: string;
  amount?: number;
  date?: string;
  invoices?: Array<{ invoice_id?: string }>;
}

const ZOHO_PAGE_SIZE = 200;
const ZOHO_MAX_PAGES = 50;
const SKIP_INVOICE_STATUSES = new Set(['draft', 'void', 'cancelled']);

async function getAccess(appTenantId: string): Promise<ZohoAccess> {
  const cached = accessCache.get(appTenantId);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      accessToken: cached.accessToken,
      organizationId: cached.organizationId,
      apiBase: cached.apiBase
    };
  }

  const existing = refreshInFlight.get(appTenantId);
  if (existing) return existing;

  const pending = (async (): Promise<ZohoAccess> => {
    const config = getZohoOAuthConfig();
    if (!config) throw new Error('Zoho OAuth is not configured');
    const connection = await getZohoConnection(appTenantId);
    if (!connection) throw new ZohoNotConnectedError();
    let refreshToken: string | null = null;
    try {
      refreshToken = await getZohoRefreshToken(appTenantId);
    } catch {
      throw new ZohoNotConnectedError('Zoho session expired. Reconnect.', 'zoho_expired');
    }
    if (!refreshToken) {
      throw new ZohoNotConnectedError('Zoho session expired. Reconnect.', 'zoho_expired');
    }
    try {
      const accountsUrl =
        connection.accountsUrl ??
        accountsUrlFromApiBase(connection.apiBase) ??
        config.accountsUrl;
      const tokens = await refreshZohoAccessToken(config, refreshToken, accountsUrl);
      if (tokens.refreshToken !== refreshToken) {
        await updateZohoRefreshToken(appTenantId, tokens.refreshToken);
      }
      const access: ZohoAccess = {
        accessToken: tokens.accessToken,
        organizationId: connection.organizationId,
        apiBase: connection.apiBase ?? config.apiBase
      };
      accessCache.set(appTenantId, {
        ...access,
        expiresAt: Date.now() + Math.max(tokens.expiresIn * 1000 - ACCESS_SKEW_MS, 60_000)
      });
      return access;
    } catch (error) {
      if (isZohoInvalidGrantError(error)) {
        accessCache.delete(appTenantId);
        await deleteZohoConnection(appTenantId);
        throw new ZohoNotConnectedError('Zoho session expired. Reconnect.', 'zoho_expired');
      }
      if (isZohoRateLimitError(error)) {
        throw new ZohoNotConnectedError(
          'Zoho rate-limited token refresh. Wait a minute, then resync once.',
          'zoho_rate_limited'
        );
      }
      throw error;
    } finally {
      refreshInFlight.delete(appTenantId);
    }
  })();

  refreshInFlight.set(appTenantId, pending);
  return pending;
}

export function clearZohoAccessCache(appTenantId?: string): void {
  if (appTenantId) accessCache.delete(appTenantId);
  else accessCache.clear();
}

async function zohoGet<T>(
  access: ZohoAccess,
  path: string,
  query?: Record<string, string>
): Promise<T> {
  const url = new URL(`${access.apiBase}${path}`);
  url.searchParams.set('organization_id', access.organizationId);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }
  const response = await fetch(url, {
    headers: { Authorization: `Zoho-oauthtoken ${access.accessToken}` }
  });
  if (!response.ok) {
    throw new Error(`Zoho request failed: ${response.status} ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

interface ZohoPageContext {
  has_more_page?: boolean;
}

async function paginateZoho<T>(access: ZohoAccess, path: string, key: string): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= ZOHO_MAX_PAGES; page += 1) {
    const payload = await zohoGet<Record<string, unknown>>(access, path, {
      page: String(page),
      per_page: String(ZOHO_PAGE_SIZE)
    });
    const batch = (payload[key] as T[] | undefined) ?? [];
    items.push(...batch);
    const pageContext = payload.page_context as ZohoPageContext | undefined;
    if (pageContext?.has_more_page === false) break;
    if (batch.length < ZOHO_PAGE_SIZE) break;
  }
  return items;
}

export function zohoContactEmail(contact: ZohoContact): string {
  const primary = contact.email?.trim();
  if (primary) return primary;
  const person =
    contact.contact_persons?.find((item) => item.is_primary_contact && item.email?.trim()) ??
    contact.contact_persons?.find((item) => item.email?.trim());
  return person?.email?.trim() ?? '';
}

export function zohoLedgerStatus(status: string | undefined, amountDueCents: number): string {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'paid' || amountDueCents <= 0) return 'PAID';
  return 'AUTHORISED';
}

export async function fetchZohoAccountsReceivable(appTenantId?: string): Promise<{
  contacts: ZohoContact[];
  invoices: ZohoInvoice[];
  payments: ZohoPayment[];
}> {
  const tenantId = appTenantId ?? (await getIntegrationTenantId());
  const access = await getAccess(tenantId);
  const [contacts, invoices, payments] = await Promise.all([
    paginateZoho<ZohoContact>(access, '/contacts', 'contacts'),
    paginateZoho<ZohoInvoice>(access, '/invoices', 'invoices'),
    paginateZoho<ZohoPayment>(access, '/customerpayments', 'customerpayments')
  ]);
  return {
    contacts,
    invoices: invoices.filter(
      (invoice) => !SKIP_INVOICE_STATUSES.has((invoice.status ?? '').toLowerCase())
    ),
    payments
  };
}

export async function fetchZohoInvoicePdf(appTenantId: string, invoiceId: string): Promise<Buffer> {
  const access = await getAccess(appTenantId);
  const url = new URL(`${access.apiBase}/invoices/${encodeURIComponent(invoiceId)}`);
  url.searchParams.set('organization_id', access.organizationId);
  url.searchParams.set('accept', 'pdf');
  const response = await fetch(url, {
    headers: {
      Authorization: `Zoho-oauthtoken ${access.accessToken}`,
      Accept: 'application/pdf'
    }
  });
  if (!response.ok) {
    throw new Error(`Could not fetch invoice PDF from Zoho Books (${response.status}).`);
  }
  return Buffer.from(await response.arrayBuffer());
}
