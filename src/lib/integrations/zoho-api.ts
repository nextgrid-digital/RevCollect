import { getIntegrationTenantId } from './tenant';
import {
  deleteZohoConnection,
  getZohoConnection,
  getZohoRefreshToken,
  updateZohoRefreshToken
} from './zoho-connection-store';
import { getZohoOAuthConfig, isZohoInvalidGrantError, refreshZohoAccessToken } from './zoho-oauth';
import { XeroNotConnectedError } from './xero-api';

export class ZohoNotConnectedError extends XeroNotConnectedError {
  constructor(
    message = 'Zoho Books is not connected',
    code: 'xero_expired' | 'xero_disconnected' = 'xero_disconnected'
  ) {
    super(message, code);
    this.name = 'ZohoNotConnectedError';
  }
}

export interface ZohoContact {
  contact_id: string;
  contact_name?: string;
  email?: string;
  company_name?: string;
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

async function getAccess(appTenantId: string): Promise<{
  accessToken: string;
  organizationId: string;
  apiBase: string;
}> {
  const config = getZohoOAuthConfig();
  if (!config) throw new Error('Zoho OAuth is not configured');
  const connection = await getZohoConnection(appTenantId);
  if (!connection) throw new ZohoNotConnectedError();
  let refreshToken: string | null = null;
  try {
    refreshToken = await getZohoRefreshToken(appTenantId);
  } catch {
    throw new ZohoNotConnectedError('Zoho session expired. Reconnect.', 'xero_expired');
  }
  if (!refreshToken) {
    throw new ZohoNotConnectedError('Zoho session expired. Reconnect.', 'xero_expired');
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
      throw new ZohoNotConnectedError('Zoho session expired. Reconnect.', 'xero_expired');
    }
    throw error;
  }
}

async function zohoGet<T>(access: Awaited<ReturnType<typeof getAccess>>, path: string): Promise<T> {
  const url = new URL(`${access.apiBase}${path}`);
  url.searchParams.set('organization_id', access.organizationId);
  const response = await fetch(url, {
    headers: { Authorization: `Zoho-oauthtoken ${access.accessToken}` }
  });
  if (!response.ok) {
    throw new Error(`Zoho request failed: ${response.status} ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchZohoAccountsReceivable(appTenantId?: string): Promise<{
  contacts: ZohoContact[];
  invoices: ZohoInvoice[];
  payments: ZohoPayment[];
}> {
  const tenantId = appTenantId ?? (await getIntegrationTenantId());
  const access = await getAccess(tenantId);
  const [contactsPayload, invoicesPayload, paymentsPayload] = await Promise.all([
    zohoGet<{ contacts?: ZohoContact[] }>(access, '/contacts'),
    zohoGet<{ invoices?: ZohoInvoice[] }>(access, '/invoices?status=unpaid'),
    zohoGet<{ customerpayments?: ZohoPayment[] }>(access, '/customerpayments')
  ]);
  return {
    contacts: contactsPayload.contacts ?? [],
    invoices: invoicesPayload.invoices ?? [],
    payments: paymentsPayload.customerpayments ?? []
  };
}
