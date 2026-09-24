import { getIntegrationTenantId } from './tenant';
import {
  deleteZohoConnection,
  getZohoConnection,
  getZohoRefreshToken,
  updateZohoRefreshToken
} from './zoho-connection-store';
import { getZohoOAuthConfig, isZohoInvalidGrantError, refreshZohoAccessToken } from './zoho-oauth';

export type ZohoConnectionErrorCode = 'zoho_disconnected' | 'zoho_expired';

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

type ZohoAccess = {
  accessToken: string;
  organizationId: string;
  apiBase: string;
};

async function getAccess(appTenantId: string): Promise<ZohoAccess> {
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
    const tokens = await refreshZohoAccessToken(config, refreshToken);
    if (tokens.refreshToken !== refreshToken) {
      await updateZohoRefreshToken(appTenantId, tokens.refreshToken);
    }
    return {
      accessToken: tokens.accessToken,
      organizationId: connection.organizationId,
      apiBase: connection.apiBase ?? config.apiBase
    };
  } catch (error) {
    if (isZohoInvalidGrantError(error)) {
      await deleteZohoConnection(appTenantId);
      throw new ZohoNotConnectedError('Zoho session expired. Reconnect.', 'zoho_expired');
    }
    throw error;
  }
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
