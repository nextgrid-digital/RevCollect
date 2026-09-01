import { parseJsonBody } from '@/lib/json/parse-json-body';
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

export interface XeroContactPerson {
  FirstName?: string;
  LastName?: string;
  EmailAddress?: string;
  IncludeInEmails?: boolean;
}

export interface XeroContact {
  ContactID: string;
  Name?: string;
  EmailAddress?: string;
  IsCustomer?: boolean;
  ContactStatus?: string;
  Phones?: XeroPhone[];
  ContactPersons?: XeroContactPerson[];
}

export interface XeroInvoiceContact {
  ContactID?: string;
  Name?: string;
}

export interface XeroValidationError {
  Message?: string;
}

export interface XeroInvoice {
  InvoiceID?: string;
  InvoiceNumber?: string;
  Type?: string;
  Status?: string;
  DueDateString?: string;
  DueDate?: string;
  DateString?: string;
  Date?: string;
  FullyPaidDateString?: string;
  FullyPaidDate?: string;
  AmountDue?: number;
  AmountPaid?: number;
  Total?: number;
  Contact?: XeroInvoiceContact;
  HasErrors?: boolean;
  ValidationErrors?: XeroValidationError[];
}

export interface XeroPaymentInvoice {
  InvoiceID?: string;
  InvoiceNumber?: string;
  Contact?: XeroInvoiceContact;
}

export interface XeroPayment {
  PaymentID?: string;
  Date?: string;
  Amount?: number;
  Status?: string;
  PaymentType?: string;
  Invoice?: XeroPaymentInvoice;
}

export interface XeroCreditNote {
  CreditNoteID?: string;
  CreditNoteNumber?: string;
  Type?: string;
  Status?: string;
  DateString?: string;
  Date?: string;
  RemainingCredit?: number;
  Total?: number;
  Contact?: XeroInvoiceContact;
}

export interface XeroBankTransaction {
  BankTransactionID?: string;
  Type?: string;
  Status?: string;
  Date?: string;
  Total?: number;
  Contact?: XeroInvoiceContact;
}

interface XeroContactsResponse {
  Contacts?: XeroContact[];
}

interface XeroInvoicesResponse {
  Invoices?: XeroInvoice[];
  Message?: string;
  Elements?: Array<{
    ValidationErrors?: XeroValidationError[];
  }>;
}

interface XeroPaymentsResponse {
  Payments?: XeroPayment[];
}

interface XeroCreditNotesResponse {
  CreditNotes?: XeroCreditNote[];
}

interface XeroBankTransactionsResponse {
  BankTransactions?: XeroBankTransaction[];
}

interface ArCacheEntry {
  expiresAt: number;
  contacts: XeroContact[];
  invoices: XeroInvoice[];
  payments: XeroPayment[];
  creditNotes: XeroCreditNote[];
  bankReceives: XeroBankTransaction[];
}

const XERO_PAGE_SIZE = 100;
const XERO_MAX_PAGES = 100;

const arCache = new Map<string, ArCacheEntry>();
const refreshInFlight = new Map<string, Promise<XeroAccessContext>>();

export type XeroConnectionErrorCode = 'xero_expired' | 'xero_disconnected';

export class XeroNotConnectedError extends Error {
  readonly code: XeroConnectionErrorCode;

  constructor(
    message = 'Xero is not connected',
    code: XeroConnectionErrorCode = 'xero_disconnected'
  ) {
    super(message);
    this.name = 'XeroNotConnectedError';
    this.code = code;
  }
}

async function refreshXeroAccessContext(appTenantId: string): Promise<XeroAccessContext> {
  const config = getXeroOAuthConfig();
  if (!config) {
    throw new Error('Xero OAuth is not configured');
  }

  const connection = await getXeroConnection(appTenantId);
  if (!connection) {
    throw new XeroNotConnectedError();
  }

  let refreshToken: string | null = null;
  try {
    refreshToken = await getXeroRefreshToken(appTenantId);
  } catch (error) {
    console.error('[xero] could not decrypt refresh token:', error);
    throw new XeroNotConnectedError('Xero session expired. Reconnect Xero.', 'xero_expired');
  }
  if (!refreshToken) {
    throw new XeroNotConnectedError('Xero session expired. Reconnect Xero.', 'xero_expired');
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
      throw new XeroNotConnectedError('Xero session expired. Reconnect Xero.', 'xero_expired');
    }
    throw error;
  }
}

export async function getXeroAccessContext(appTenantId?: string): Promise<XeroAccessContext> {
  const tenantId = appTenantId ?? (await getIntegrationTenantId());
  const inFlight = refreshInFlight.get(tenantId);
  if (inFlight) return inFlight;

  const promise = refreshXeroAccessContext(tenantId).finally(() => {
    refreshInFlight.delete(tenantId);
  });
  refreshInFlight.set(tenantId, promise);
  return promise;
}

async function xeroRequest<T>(
  context: XeroAccessContext,
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  options?: {
    query?: Record<string, string>;
    body?: unknown;
  }
): Promise<T> {
  const url = new URL(`${XERO_ACCOUNTING_BASE}${path}`);
  if (options?.query) {
    for (const [key, value] of Object.entries(options.query)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${context.accessToken}`,
      'Xero-Tenant-Id': context.xeroTenantId,
      Accept: 'application/json',
      ...(options?.body ? { 'Content-Type': 'application/json' } : {})
    },
    body: options?.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const detail = await response.text();
    let message = `Xero API ${path} failed: ${response.status}`;
    try {
      const parsed = parseJsonBody<{
        Message?: string;
        Detail?: string;
        Elements?: Array<{ ValidationErrors?: Array<{ Message?: string }> }>;
      }>(detail);
      const validation = parsed.Elements?.flatMap((element) =>
        (element.ValidationErrors ?? []).map((error) => error.Message).filter(Boolean)
      );
      if (validation && validation.length > 0) {
        message = validation.slice(0, 3).join('; ');
      } else if (parsed.Message || parsed.Detail) {
        message = [parsed.Message, parsed.Detail].filter(Boolean).join(': ');
      }
    } catch {
      if (detail.trim()) {
        message = `${message} ${detail.slice(0, 300)}`;
      }
    }
    throw new Error(message);
  }

  const body = await response.text();
  return parseJsonBody<T>(body);
}

async function xeroGet<T>(
  context: XeroAccessContext,
  path: string,
  query?: Record<string, string>
): Promise<T> {
  return xeroRequest<T>(context, 'GET', path, { query });
}

export async function fetchXeroInvoicePdf(
  context: XeroAccessContext,
  invoiceId: string
): Promise<Buffer> {
  const url = new URL(`${XERO_ACCOUNTING_BASE}/Invoices/${encodeURIComponent(invoiceId)}`);
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${context.accessToken}`,
      'Xero-Tenant-Id': context.xeroTenantId,
      Accept: 'application/pdf'
    }
  });

  if (!response.ok) {
    throw new Error(`Could not fetch invoice PDF from Xero (${response.status}).`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function paginateXero<T>(fetchPage: (page: number) => Promise<T[]>): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= XERO_MAX_PAGES; page += 1) {
    const batch = await fetchPage(page);
    items.push(...batch);
    if (batch.length < XERO_PAGE_SIZE) break;
  }
  return items;
}

async function fetchOptionalXeroList<T>(fetchList: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fetchList();
  } catch {
    return [];
  }
}

export async function fetchXeroContacts(context: XeroAccessContext): Promise<XeroContact[]> {
  return paginateXero(async (page) => {
    const data = await xeroGet<XeroContactsResponse>(context, '/Contacts', {
      where: 'ContactStatus=="ACTIVE"',
      page: String(page)
    });
    return data.Contacts ?? [];
  });
}

export async function fetchXeroInvoices(context: XeroAccessContext): Promise<XeroInvoice[]> {
  const invoices = await paginateXero(async (page) => {
    const data = await xeroGet<XeroInvoicesResponse>(context, '/Invoices', {
      where: 'Type=="ACCREC"',
      page: String(page),
      order: 'UpdatedDateUTC DESC'
    });
    return data.Invoices ?? [];
  });

  return invoices.filter((invoice) => {
    const status = invoice.Status ?? '';
    return status !== 'DELETED' && status !== 'VOIDED' && status !== 'DRAFT';
  });
}

export async function fetchXeroPayments(context: XeroAccessContext): Promise<XeroPayment[]> {
  const payments = await paginateXero(async (page) => {
    const data = await xeroGet<XeroPaymentsResponse>(context, '/Payments', {
      where: 'Status=="AUTHORISED"',
      page: String(page),
      order: 'UpdatedDateUTC DESC'
    });
    return data.Payments ?? [];
  });

  return payments.filter((payment) => {
    const type = (payment.PaymentType ?? 'ACCRECPAYMENT').toUpperCase();
    if (type !== 'ACCRECPAYMENT') return false;
    return Boolean(payment.PaymentID && payment.Invoice?.InvoiceID);
  });
}

export async function fetchXeroCreditNotes(context: XeroAccessContext): Promise<XeroCreditNote[]> {
  const notes = await paginateXero(async (page) => {
    const data = await xeroGet<XeroCreditNotesResponse>(context, '/CreditNotes', {
      where: 'Type=="ACCRECCREDIT"',
      page: String(page),
      order: 'UpdatedDateUTC DESC'
    });
    return data.CreditNotes ?? [];
  });

  return notes.filter((note) => {
    const status = note.Status ?? '';
    return status === 'AUTHORISED' || status === 'PAID';
  });
}

export async function fetchXeroBankReceives(
  context: XeroAccessContext
): Promise<XeroBankTransaction[]> {
  const transactions = await paginateXero(async (page) => {
    const data = await xeroGet<XeroBankTransactionsResponse>(context, '/BankTransactions', {
      where: 'Type=="RECEIVE"',
      page: String(page),
      order: 'UpdatedDateUTC DESC'
    });
    return data.BankTransactions ?? [];
  });

  return transactions.filter((transaction) => {
    return (
      transaction.Status === 'AUTHORISED' &&
      Boolean(transaction.BankTransactionID && transaction.Contact?.ContactID)
    );
  });
}

export async function fetchXeroAccountsReceivable(appTenantId?: string): Promise<{
  context: XeroAccessContext;
  contacts: XeroContact[];
  invoices: XeroInvoice[];
  payments: XeroPayment[];
  creditNotes: XeroCreditNote[];
  bankReceives: XeroBankTransaction[];
}> {
  const context = await getXeroAccessContext(appTenantId ?? (await getIntegrationTenantId()));
  const cacheKey = context.xeroTenantId;
  const cached = arCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      context,
      contacts: cached.contacts,
      invoices: cached.invoices,
      payments: cached.payments,
      creditNotes: cached.creditNotes,
      bankReceives: cached.bankReceives
    };
  }

  const [contacts, invoices, payments, creditNotes, bankReceives] = await Promise.all([
    fetchXeroContacts(context),
    fetchXeroInvoices(context),
    fetchOptionalXeroList(() => fetchXeroPayments(context)),
    fetchOptionalXeroList(() => fetchXeroCreditNotes(context)),
    fetchOptionalXeroList(() => fetchXeroBankReceives(context))
  ]);

  arCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    contacts,
    invoices,
    payments,
    creditNotes,
    bankReceives
  });

  return { context, contacts, invoices, payments, creditNotes, bankReceives };
}

export function clearXeroArCache(): void {
  arCache.clear();
}

export interface CreateXeroContactInput {
  name: string;
  email?: string;
}

export interface CreateXeroInvoiceLineInput {
  description: string;
  quantity: number;
  unitAmount: number;
  accountCode?: string;
}

export interface CreateXeroInvoiceInput {
  contactId?: string;
  contactName?: string;
  contactEmail?: string;
  invoiceNumber?: string;
  reference?: string;
  date: string;
  dueDate: string;
  status?: 'DRAFT' | 'AUTHORISED';
  lineItems: CreateXeroInvoiceLineInput[];
}

function defaultSalesAccountCode(): string {
  return process.env.XERO_SALES_ACCOUNT_CODE?.trim() || '200';
}

export async function findOrCreateXeroContact(
  context: XeroAccessContext,
  input: CreateXeroContactInput
): Promise<XeroContact> {
  const name = input.name.trim();
  if (!name) {
    throw new Error('Contact name is required');
  }

  const escapedName = name.replaceAll('"', '');
  const existing = await xeroGet<XeroContactsResponse>(context, '/Contacts', {
    where: `Name=="${escapedName}"`
  });
  const match = existing.Contacts?.find((contact) => contact.Name?.trim() === name);
  if (match?.ContactID) {
    return match;
  }

  const created = await xeroRequest<XeroContactsResponse>(context, 'POST', '/Contacts', {
    body: {
      Contacts: [
        {
          Name: name,
          EmailAddress: input.email?.trim() || undefined,
          IsCustomer: true
        }
      ]
    }
  });

  const contact = created.Contacts?.[0];
  if (!contact?.ContactID) {
    throw new Error(`Failed to create Xero contact for ${name}`);
  }
  return contact;
}

export async function createXeroSalesInvoices(
  context: XeroAccessContext,
  invoices: CreateXeroInvoiceInput[]
): Promise<XeroInvoice[]> {
  if (invoices.length === 0) return [];

  const accountCode = defaultSalesAccountCode();
  const payloadInvoices = [];

  for (const invoice of invoices) {
    let contactId = invoice.contactId;
    if (!contactId) {
      if (!invoice.contactName) {
        throw new Error('Each invoice needs a contactId or contactName');
      }
      const contact = await findOrCreateXeroContact(context, {
        name: invoice.contactName,
        email: invoice.contactEmail
      });
      contactId = contact.ContactID;
    }

    payloadInvoices.push({
      Type: 'ACCREC',
      Contact: { ContactID: contactId },
      Date: invoice.date,
      DueDate: invoice.dueDate,
      InvoiceNumber: invoice.invoiceNumber || undefined,
      Reference: invoice.reference || undefined,
      Status: invoice.status ?? 'AUTHORISED',
      LineAmountTypes: 'Exclusive',
      LineItems: invoice.lineItems.map((line) => ({
        Description: line.description,
        Quantity: line.quantity,
        UnitAmount: line.unitAmount,
        AccountCode: line.accountCode || accountCode
      }))
    });
  }

  const created = await xeroRequest<XeroInvoicesResponse>(context, 'POST', '/Invoices', {
    body: { Invoices: payloadInvoices }
  });

  clearXeroArCache();

  const createdInvoices = created.Invoices ?? [];
  const firstErrors = createdInvoices
    .flatMap((invoice) => (invoice.ValidationErrors ?? []).map((error) => error.Message))
    .filter((message): message is string => Boolean(message));

  if (createdInvoices.length === 0 && created.Message) {
    throw new Error(created.Message);
  }

  if (
    firstErrors.length > 0 &&
    createdInvoices.every((invoice) => !invoice.InvoiceID || invoice.HasErrors)
  ) {
    throw new Error(firstErrors.slice(0, 3).join('; '));
  }

  return createdInvoices;
}
