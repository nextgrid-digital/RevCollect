import { getIntegrationTenantId } from './tenant';
import {
  deleteXeroConnection,
  getXeroConnection,
  getXeroRefreshToken,
  updateXeroRefreshToken
} from './xero-connection-store';
import { getXeroOAuthConfig, isXeroInvalidGrantError, refreshXeroAccessToken } from './xero-oauth';

const XERO_ACCOUNTING_BASE = 'https://api.xero.com/api.xro/2.0';
const CACHE_TTL_MS = 60_000;

export interface XeroAccessContext {
  accessToken: string;
  xeroTenantId: string;
  organisationName: string;
}

export interface XeroPhone {
  PhoneType?: string;
  PhoneNumber?: string;
  PhoneAreaCode?: string;
  PhoneCountryCode?: string;
}

export interface XeroContact {
  ContactID: string;
  Name?: string;
  EmailAddress?: string;
  IsCustomer?: boolean;
  ContactStatus?: string;
  Phones?: XeroPhone[];
}

export interface XeroInvoiceContact {
  ContactID?: string;
  Name?: string;
}

export interface XeroInvoice {
  InvoiceID: string;
  InvoiceNumber?: string;
  Type?: string;
  Status?: string;
  DueDateString?: string;
  DueDate?: string;
  DateString?: string;
  AmountDue?: number;
  Total?: number;
  Contact?: XeroInvoiceContact;
}

interface XeroContactsResponse {
  Contacts?: XeroContact[];
}

interface XeroInvoicesResponse {
  Invoices?: XeroInvoice[];
}

interface ArCacheEntry {
  expiresAt: number;
  contacts: XeroContact[];
  invoices: XeroInvoice[];
}

const arCache = new Map<string, ArCacheEntry>();
const refreshInFlight = new Map<string, Promise<XeroAccessContext>>();

export class XeroNotConnectedError extends Error {
  constructor(message = 'Xero is not connected') {
    super(message);
    this.name = 'XeroNotConnectedError';
  }
}

async function refreshXeroAccessContext(appTenantId: string): Promise<XeroAccessContext> {
  const config = getXeroOAuthConfig();
  if (!config) {
    throw new Error('Xero OAuth is not configured');
  }

  const connection = await getXeroConnection(appTenantId);
  const refreshToken = await getXeroRefreshToken(appTenantId);
  if (!connection || !refreshToken) {
    throw new XeroNotConnectedError();
  }

  try {
    const tokens = await refreshXeroAccessToken(config, refreshToken);
    if (tokens.refreshToken !== refreshToken) {
      await updateXeroRefreshToken(appTenantId, tokens.refreshToken);
    }

    return {
      accessToken: tokens.accessToken,
      xeroTenantId: connection.tenantId,
      organisationName: connection.organisationName
    };
  } catch (error) {
    if (isXeroInvalidGrantError(error)) {
      await deleteXeroConnection(appTenantId);
      clearXeroArCache();
      throw new XeroNotConnectedError('Xero session expired — reconnect Xero');
    }
    throw error;
  }
}

export async function getXeroAccessContext(
  appTenantId: string = getIntegrationTenantId()
): Promise<XeroAccessContext> {
  const inFlight = refreshInFlight.get(appTenantId);
  if (inFlight) return inFlight;

  const promise = refreshXeroAccessContext(appTenantId).finally(() => {
    refreshInFlight.delete(appTenantId);
  });
  refreshInFlight.set(appTenantId, promise);
  return promise;
}

async function xeroGet<T>(
  context: XeroAccessContext,
  path: string,
  query?: Record<string, string>
): Promise<T> {
  const url = new URL(`${XERO_ACCOUNTING_BASE}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${context.accessToken}`,
      'Xero-Tenant-Id': context.xeroTenantId,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Xero API ${path} failed: ${response.status} ${detail}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchXeroContacts(context: XeroAccessContext): Promise<XeroContact[]> {
  const data = await xeroGet<XeroContactsResponse>(context, '/Contacts', {
    where: 'ContactStatus=="ACTIVE"'
  });
  return data.Contacts ?? [];
}

export async function fetchXeroInvoices(context: XeroAccessContext): Promise<XeroInvoice[]> {
  const data = await xeroGet<XeroInvoicesResponse>(context, '/Invoices', {
    where: 'Type=="ACCREC"'
  });
  return (data.Invoices ?? []).filter((invoice) => {
    const status = invoice.Status ?? '';
    return status !== 'DELETED' && status !== 'VOIDED' && status !== 'DRAFT';
  });
}

export async function fetchXeroAccountsReceivable(appTenantId?: string): Promise<{
  context: XeroAccessContext;
  contacts: XeroContact[];
  invoices: XeroInvoice[];
}> {
  const context = await getXeroAccessContext(appTenantId);
  const cacheKey = context.xeroTenantId;
  const cached = arCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { context, contacts: cached.contacts, invoices: cached.invoices };
  }

  const [contacts, invoices] = await Promise.all([
    fetchXeroContacts(context),
    fetchXeroInvoices(context)
  ]);

  arCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    contacts,
    invoices
  });

  return { context, contacts, invoices };
}

export function clearXeroArCache(): void {
  arCache.clear();
}
