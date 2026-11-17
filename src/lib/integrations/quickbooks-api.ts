import { getIntegrationTenantId } from './tenant';
import {
  getQuickBooksConnection,
  getQuickBooksRefreshToken,
  markQuickBooksConnectionExpired,
  updateQuickBooksRefreshToken
} from './quickbooks-connection-store';
import {
  getQuickBooksOAuthConfig,
  isQuickBooksInvalidGrantError,
  refreshQuickBooksAccessToken
} from './quickbooks-oauth';
import { captureIntuitTid, withIntuitTid } from './intuit-tid';
import { XeroNotConnectedError } from './xero-api';

export class QuickBooksNotConnectedError extends XeroNotConnectedError {
  constructor(
    message = 'QuickBooks is not connected',
    code: 'xero_expired' | 'xero_disconnected' = 'xero_disconnected'
  ) {
    super(message, code);
    this.name = 'QuickBooksNotConnectedError';
  }
}

function apiBase(environment: 'sandbox' | 'production'): string {
  return environment === 'production'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox-quickbooks.api.intuit.com';
}

interface QboRef {
  value?: string;
  name?: string;
}

export interface QboCustomer {
  Id: string;
  DisplayName?: string;
  PrimaryEmailAddr?: { Address?: string };
  CompanyName?: string;
}

export interface QboInvoice {
  Id: string;
  DocNumber?: string;
  Balance?: number;
  TotalAmt?: number;
  DueDate?: string;
  TxnDate?: string;
  CustomerRef?: QboRef;
  EmailStatus?: string;
  BillEmail?: { Address?: string };
  CurrencyRef?: { value?: string };
  DeliveryInfo?: { DeliveryTime?: string };
}

export interface QboPayment {
  Id: string;
  TotalAmt?: number;
  TxnDate?: string;
  CustomerRef?: QboRef;
  Line?: Array<{ LinkedTxn?: Array<{ TxnId?: string; TxnType?: string }> }>;
}

export interface QboCompanyInfo {
  CompanyName?: string;
}

async function getAccess(appTenantId: string): Promise<{
  accessToken: string;
  realmId: string;
  organisationName: string;
  environment: 'sandbox' | 'production';
}> {
  const config = getQuickBooksOAuthConfig();
  if (!config) throw new Error('QuickBooks OAuth is not configured');
  const connection = await getQuickBooksConnection(appTenantId);
  if (!connection) throw new QuickBooksNotConnectedError();
  if (connection.tokenStatus === 'expired') {
    throw new QuickBooksNotConnectedError(
      'QuickBooks session expired. Reconnect QuickBooks.',
      'xero_expired'
    );
  }
  let refreshToken: string | null = null;
  try {
    refreshToken = await getQuickBooksRefreshToken(appTenantId);
  } catch {
    throw new QuickBooksNotConnectedError('QuickBooks session expired. Reconnect.', 'xero_expired');
  }
  if (!refreshToken) {
    throw new QuickBooksNotConnectedError('QuickBooks session expired. Reconnect.', 'xero_expired');
  }
  try {
    const tokens = await refreshQuickBooksAccessToken(config, refreshToken);
    if (tokens.refreshToken !== refreshToken) {
      await updateQuickBooksRefreshToken(appTenantId, tokens.refreshToken);
    }
    return {
      accessToken: tokens.accessToken,
      realmId: connection.realmId,
      organisationName: connection.organisationName,
      environment: config.environment
    };
  } catch (error) {
    if (isQuickBooksInvalidGrantError(error)) {
      await markQuickBooksConnectionExpired(appTenantId);
      throw new QuickBooksNotConnectedError(
        'QuickBooks credentials changed or the session expired. Reconnect QuickBooks.',
        'xero_expired'
      );
    }
    throw error;
  }
}

async function qboQuery<T>(
  access: Awaited<ReturnType<typeof getAccess>>,
  query: string
): Promise<T[]> {
  const url = new URL(`${apiBase(access.environment)}/v3/company/${access.realmId}/query`);
  url.searchParams.set('query', query);
  url.searchParams.set('minorversion', '75');
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${access.accessToken}`,
      Accept: 'application/json'
    }
  });
  const intuitTid = captureIntuitTid('qbo.query', response);
  if (!response.ok) {
    throw new Error(
      withIntuitTid(
        `QuickBooks query failed: ${response.status} ${await response.text()}`,
        intuitTid
      )
    );
  }
  const payload = (await response.json()) as { QueryResponse?: Record<string, T[] | undefined> };
  const queryResponse = payload.QueryResponse ?? {};
  const firstArray = Object.values(queryResponse).find((value) => Array.isArray(value));
  return (firstArray as T[] | undefined) ?? [];
}

export class InvoicePdfUnavailableError extends Error {
  constructor(message = 'Invoice PDF is not available for this invoice.') {
    super(message);
    this.name = 'InvoicePdfUnavailableError';
  }
}

export async function fetchQuickBooksInvoicePdf(
  appTenantId: string,
  invoiceId: string
): Promise<Buffer> {
  const access = await getAccess(appTenantId);
  const url = new URL(
    `${apiBase(access.environment)}/v3/company/${access.realmId}/invoice/${encodeURIComponent(invoiceId)}/pdf`
  );
  url.searchParams.set('minorversion', '75');
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${access.accessToken}`,
      Accept: 'application/pdf'
    }
  });
  if (!response.ok) {
    throw new InvoicePdfUnavailableError();
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0) throw new InvoicePdfUnavailableError();
  return bytes;
}

export async function fetchQuickBooksCompanyName(appTenantId: string): Promise<string> {
  const access = await getAccess(appTenantId);
  const rows = await qboQuery<QboCompanyInfo>(access, 'select CompanyName from CompanyInfo');
  return rows[0]?.CompanyName ?? access.organisationName;
}

export async function fetchQuickBooksAccountsReceivable(appTenantId?: string): Promise<{
  customers: QboCustomer[];
  invoices: QboInvoice[];
  payments: QboPayment[];
}> {
  const tenantId = appTenantId ?? (await getIntegrationTenantId());
  const access = await getAccess(tenantId);
  const [customers, invoices, payments] = await Promise.all([
    qboQuery<QboCustomer>(access, 'select * from Customer maxresults 1000'),
    qboQuery<QboInvoice>(access, "select * from Invoice where Balance > '0' maxresults 1000"),
    qboQuery<QboPayment>(access, 'select * from Payment maxresults 1000')
  ]);
  return { customers, invoices, payments };
}
