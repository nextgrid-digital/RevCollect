import type { Customer, Invoice } from '@/features/revcollect/types';
import {
  clearXeroArCache,
  fetchXeroAccountsReceivable,
  XeroNotConnectedError,
  type XeroBankTransaction,
  type XeroInvoice,
  type XeroPayment
} from '@/lib/integrations/xero-api';
import { getXeroConnection } from '@/lib/integrations/xero-connection-store';
import {
  buildSyntheticInboxFromInvoices,
  mapXeroCreditNotes,
  mapXeroCustomers,
  mapXeroInvoices,
  parseXeroDate
} from '@/features/revcollect/api/xero-map';
import { restoreCollectionOverrides } from '@/features/revcollect/lib/collection-decision';
import { extractSituation } from '@/features/revcollect/extract/extract-situation';
import { emptyIntelligence } from './defaults';
import { recomputePatternsForSnapshot } from './patterns';
import { getCanonicalStore } from './store';
import { overlayInboxWithSentEmails } from './sent-emails';
import { INGEST_STALE_MS, type CanonicalPayment, type CanonicalSnapshot } from './types';

function toCents(amount: number | undefined): number {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return 0;
  return Math.round(amount * 100);
}

function paymentDedupeKey(customerId: string, amountCents: number, paidAt: string): string {
  return `${customerId}|${amountCents}|${paidAt.slice(0, 10)}`;
}

function paymentsFromXeroPayments(
  rawPayments: XeroPayment[],
  invoices: Invoice[]
): CanonicalPayment[] {
  const invoiceById = new Map(invoices.map((invoice) => [invoice.id, invoice]));
  const payments: CanonicalPayment[] = [];
  for (const payment of rawPayments) {
    const amountCents = toCents(payment.Amount);
    const invoiceId = payment.Invoice?.InvoiceID;
    const customerId =
      payment.Invoice?.Contact?.ContactID ??
      (invoiceId ? invoiceById.get(invoiceId)?.customerId : undefined);
    if (!payment.PaymentID || !invoiceId || !customerId || amountCents <= 0) continue;
    const paidAt = parseXeroDate(payment.Date);
    payments.push({
      id: payment.PaymentID,
      customerId,
      invoiceId,
      amountCents,
      paidAt: `${paidAt}T00:00:00.000Z`,
      externalId: payment.PaymentID
    });
  }
  return payments;
}

function fallbackPaymentsFromInvoices(rawInvoices: XeroInvoice[]): CanonicalPayment[] {
  const payments: CanonicalPayment[] = [];
  for (const invoice of rawInvoices) {
    const paidCents = toCents(invoice.AmountPaid);
    if (paidCents <= 0 || !invoice.InvoiceID || !invoice.Contact?.ContactID) continue;
    const paidAt = parseXeroDate(
      invoice.FullyPaidDateString ?? invoice.FullyPaidDate ?? invoice.DateString ?? invoice.Date
    );
    payments.push({
      id: invoice.InvoiceID,
      customerId: invoice.Contact.ContactID,
      invoiceId: invoice.InvoiceID,
      amountCents: paidCents,
      paidAt: `${paidAt}T00:00:00.000Z`,
      externalId: invoice.InvoiceID
    });
  }
  return payments;
}

function unappliedBankReceives(
  transactions: XeroBankTransaction[],
  existing: CanonicalPayment[]
): CanonicalPayment[] {
  const seen = new Set(
    existing.map((payment) =>
      paymentDedupeKey(payment.customerId, payment.amountCents, payment.paidAt)
    )
  );
  const extras: CanonicalPayment[] = [];
  for (const transaction of transactions) {
    const customerId = transaction.Contact?.ContactID;
    const amountCents = toCents(transaction.Total);
    if (!transaction.BankTransactionID || !customerId || amountCents <= 0) continue;
    const paidAt = parseXeroDate(transaction.Date);
    const key = paymentDedupeKey(customerId, amountCents, `${paidAt}T00:00:00.000Z`);
    if (seen.has(key)) continue;
    seen.add(key);
    extras.push({
      id: transaction.BankTransactionID,
      customerId,
      amountCents,
      paidAt: `${paidAt}T00:00:00.000Z`,
      externalId: transaction.BankTransactionID
    });
  }
  return extras;
}

export async function ingestXeroAr(tenantId: string): Promise<CanonicalSnapshot> {
  clearXeroArCache();
  const {
    contacts,
    invoices: rawInvoices,
    payments: rawPayments,
    creditNotes,
    bankReceives
  } = await fetchXeroAccountsReceivable(tenantId);

  const invoices = [...mapXeroInvoices(rawInvoices), ...mapXeroCreditNotes(creditNotes)];
  let customers: Customer[] = mapXeroCustomers(contacts, invoices);
  const fromRegister = paymentsFromXeroPayments(rawPayments, invoices);
  const basePayments =
    fromRegister.length > 0 ? fromRegister : fallbackPaymentsFromInvoices(rawInvoices);
  const payments: CanonicalPayment[] = [
    ...basePayments,
    ...unappliedBankReceives(bankReceives, basePayments)
  ];

  const store = await getCanonicalStore();
  const current = await store.read(tenantId);
  customers = restoreCollectionOverrides(customers, current.customers);
  const inboxMessages = overlayInboxWithSentEmails(
    buildSyntheticInboxFromInvoices(invoices, customers),
    current.sentEmails ?? []
  );
  const previousPaymentIds = new Set(current.payments.map((payment) => payment.id));
  const intelligenceByCustomerId = { ...current.intelligenceByCustomerId };
  for (const customer of customers) {
    intelligenceByCustomerId[customer.id] =
      intelligenceByCustomerId[customer.id] ?? emptyIntelligence();
    customer.relationshipState = intelligenceByCustomerId[customer.id].relationshipState;
  }

  let snapshot: CanonicalSnapshot = {
    ...current,
    customers,
    invoices,
    payments,
    inboxMessages,
    intelligenceByCustomerId,
    ingestedAt: new Date().toISOString()
  };
  snapshot = recomputePatternsForSnapshot(snapshot);
  await store.write(tenantId, snapshot);

  for (const payment of payments) {
    if (previousPaymentIds.has(payment.id)) continue;
    try {
      await extractSituation({
        tenantId,
        customerId: payment.customerId,
        kind: 'payment',
        text: `Payment of ${payment.amountCents} cents received on ${payment.paidAt} for invoice ${payment.invoiceId ?? 'unknown'}.`
      });
    } catch (error) {
      console.error('[ingest-xero] extractSituation failed:', error);
    }
  }

  try {
    return await (await getCanonicalStore()).read(tenantId);
  } catch (error) {
    console.error('[ingest-xero] snapshot re-read failed:', error);
    return snapshot;
  }
}

export async function ensureXeroIngest(
  tenantId: string,
  force = false
): Promise<CanonicalSnapshot> {
  const store = await getCanonicalStore();
  const current = await store.read(tenantId);
  const connection = await getXeroConnection(tenantId);
  if (!connection) return current;

  const stale =
    !current.ingestedAt || Date.now() - new Date(current.ingestedAt).getTime() > INGEST_STALE_MS;
  const empty = current.customers.length === 0 && current.invoices.length === 0;
  const missingHistory = current.invoices.some(
    (invoice) => invoice.amountDueCents === undefined && invoice.xeroStatus !== 'CREDIT'
  );
  if (!force && !empty && !stale && !missingHistory) return current;

  try {
    return await ingestXeroAr(tenantId);
  } catch (error) {
    if (error instanceof XeroNotConnectedError) return current;
    throw error;
  }
}

const backgroundIngestInFlight = new Map<string, Promise<boolean>>();

export function isXeroSnapshotStale(ingestedAt: string | null): boolean {
  return !ingestedAt || Date.now() - new Date(ingestedAt).getTime() > INGEST_STALE_MS;
}

export function scheduleBackgroundXeroIngest(
  tenantId: string,
  ingestedAt: string | null
): Promise<boolean> {
  if (!isXeroSnapshotStale(ingestedAt)) return Promise.resolve(false);

  const existing = backgroundIngestInFlight.get(tenantId);
  if (existing) return existing;

  const promise = (async () => {
    const connection = await getXeroConnection(tenantId);
    if (!connection) return false;
    await ingestXeroAr(tenantId);
    return true;
  })()
    .catch((error) => {
      if (error instanceof XeroNotConnectedError) return false;
      console.error('[ingest-xero] background ingest failed:', error);
      return false;
    })
    .finally(() => {
      backgroundIngestInFlight.delete(tenantId);
    });

  backgroundIngestInFlight.set(tenantId, promise);
  return promise;
}
