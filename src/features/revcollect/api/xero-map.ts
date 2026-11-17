import type { XeroContact, XeroCreditNote, XeroInvoice } from '@/lib/integrations/xero-api';
import {
  buildAgingChartBuckets,
  buildAgingCustomerRows,
  buildAgingReportSummary,
  filterInvoicesForReport
} from '../aging/lib/aging-report';
import {
  averageCollectionDays,
  creditRemainingCents,
  invoiceAmountDueCents,
  isOpenCanonicalInvoice
} from '../lib/invoice-open';
import { dominantOpenCurrency, invoiceCurrencyCode } from '../lib/invoice-currency';
import type {
  AgingBucket,
  AgingBucketSummary,
  AgingChartBucketRow,
  AgingCustomerBreakdownRow,
  AgingReportFilters,
  AgingReportSummary,
  CollectionStatus,
  Customer,
  CustomerInboxContext,
  InboxMessage,
  Invoice
} from '../types';
import { deriveCustomerStatus } from '../lib/collection-decision';
import { agingBucketFromDays as toAgingBucket } from '../lib/live-aging';
import { formatCurrencyWhole, getDaysOverdueFromDueDate } from '../utils';
import type { CustomerStatusSummary } from './types';

export { toAgingBucket };

const AGING_BUCKET_LABELS: Record<AgingBucket, string> = {
  current: 'Current',
  '1-30': '1–30 days',
  '31-60': '31–60 days',
  '61-90': '61–90 days',
  '90+': '90+ days'
};

const OPEN_INVOICE_STATUSES = new Set(['AUTHORISED', 'SUBMITTED']);

export function parseXeroDate(value: string | undefined): string {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  const microsoft = /\/Date\((-?\d+)(?:[+-]\d+)?\)\//.exec(value);
  if (microsoft) {
    return new Date(Number(microsoft[1])).toISOString().slice(0, 10);
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
}

function toCents(amount: number | undefined): number {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return 0;
  return Math.round(amount * 100);
}

function emailFromContact(contact: XeroContact): string {
  const primary = contact.EmailAddress?.trim();
  if (primary) return primary;

  const person = contact.ContactPersons?.find((contactPerson) =>
    contactPerson.EmailAddress?.trim()
  );
  return person?.EmailAddress?.trim() || 'no-email@xero.local';
}

function phoneFromContact(contact: XeroContact): string | undefined {
  const phones = contact.Phones ?? [];
  const preferred =
    phones.find((phone) => phone.PhoneType === 'DEFAULT' && phone.PhoneNumber) ??
    phones.find((phone) => phone.PhoneNumber);
  if (!preferred?.PhoneNumber) return undefined;

  const parts = [preferred.PhoneCountryCode, preferred.PhoneAreaCode, preferred.PhoneNumber]
    .filter(Boolean)
    .join(' ');
  return parts || undefined;
}

export function isOpenReceivableInvoice(invoice: XeroInvoice): boolean {
  const status = invoice.Status ?? '';
  if (!OPEN_INVOICE_STATUSES.has(status) && status !== 'PAID') {
    return false;
  }
  const amountDue =
    typeof invoice.AmountDue === 'number' ? invoice.AmountDue : (invoice.Total ?? 0);
  return amountDue > 0.0001;
}

export function mapLedgerInvoice(input: {
  id: string;
  customerId: string;
  number: string;
  amountCents: number;
  amountDueCents: number;
  paidCents: number;
  dueDate: string;
  issueDate?: string;
  paidAt?: string;
  ledgerStatus?: string;
  ledgerEmailedAt?: string;
  billEmail?: string;
  currency?: string;
}): Invoice {
  const daysOverdue = input.amountDueCents > 0 ? getDaysOverdueFromDueDate(input.dueDate) : 0;
  return {
    id: input.id,
    customerId: input.customerId,
    number: input.number,
    amountCents: input.amountCents,
    amountDueCents: input.amountDueCents,
    paidCents: input.paidCents,
    paidAt: input.paidAt,
    issueDate: input.issueDate,
    ledgerEmailedAt: input.ledgerEmailedAt,
    billEmail: input.billEmail,
    dueDate: input.dueDate,
    status: mapInvoiceStatus(
      input.ledgerStatus,
      daysOverdue,
      input.amountDueCents,
      input.paidCents
    ),
    agingBucket: toAgingBucket(daysOverdue),
    xeroStatus: input.ledgerStatus,
    currency: input.currency?.trim().toUpperCase() || undefined
  };
}

export function mapLedgerCustomers(
  contacts: Array<{
    id: string;
    name: string;
    email: string;
    company?: string;
  }>,
  invoices: Invoice[]
): Customer[] {
  const invoicesByCustomer = new Map<string, Invoice[]>();
  for (const invoice of invoices) {
    const list = invoicesByCustomer.get(invoice.customerId) ?? [];
    list.push(invoice);
    invoicesByCustomer.set(invoice.customerId, list);
  }

  const customers: Customer[] = [];
  const seen = new Set<string>();
  for (const contact of contacts) {
    const customerInvoices = invoicesByCustomer.get(contact.id) ?? [];
    if (customerInvoices.length === 0) continue;
    const balanceCents = customerBalanceCents(customerInvoices);
    const daysOverdue = customerInvoices
      .filter(isOpenCanonicalInvoice)
      .reduce((max, invoice) => Math.max(max, getDaysOverdueFromDueDate(invoice.dueDate)), 0);
    seen.add(contact.id);
    customers.push({
      id: contact.id,
      name: contact.name,
      email: contact.email || 'no-email@ledger.local',
      company: contact.company ?? contact.name,
      status: deriveCustomerStatus(balanceCents, daysOverdue),
      balanceCents,
      daysOverdue
    });
  }

  for (const [customerId, customerInvoices] of invoicesByCustomer) {
    if (seen.has(customerId)) continue;
    const balanceCents = customerBalanceCents(customerInvoices);
    const daysOverdue = customerInvoices
      .filter(isOpenCanonicalInvoice)
      .reduce((max, invoice) => Math.max(max, getDaysOverdueFromDueDate(invoice.dueDate)), 0);
    customers.push({
      id: customerId,
      name: 'Customer',
      email: 'no-email@ledger.local',
      company: 'Customer',
      status: deriveCustomerStatus(balanceCents, daysOverdue),
      balanceCents,
      daysOverdue
    });
  }

  return customers.toSorted((a, b) => b.balanceCents - a.balanceCents);
}

export function mapXeroInvoice(invoice: XeroInvoice): Invoice | null {
  const customerId = invoice.Contact?.ContactID;
  if (!customerId || !invoice.InvoiceID) return null;

  const dueDate = parseXeroDate(invoice.DueDateString ?? invoice.DueDate);
  const issueDate = parseXeroDate(invoice.DateString ?? invoice.Date);
  const amountDueCents = toCents(invoice.AmountDue);
  const amountCents = toCents(invoice.Total ?? invoice.AmountDue);
  const paidCents = toCents(invoice.AmountPaid);
  const daysOverdue = amountDueCents > 0 ? getDaysOverdueFromDueDate(dueDate) : 0;
  const paidAtRaw = invoice.FullyPaidDateString ?? invoice.FullyPaidDate;
  const paidAt = invoice.Status === 'PAID' && paidAtRaw ? parseXeroDate(paidAtRaw) : undefined;

  return {
    id: invoice.InvoiceID,
    customerId,
    number: invoice.InvoiceNumber ?? invoice.InvoiceID.slice(0, 8),
    amountCents,
    amountDueCents,
    paidCents,
    paidAt,
    issueDate,
    ledgerEmailedAt: invoice.SentToContact ? `${issueDate}T12:00:00.000Z` : undefined,
    billEmail: invoice.Contact?.EmailAddress,
    dueDate,
    status: mapInvoiceStatus(invoice.Status, daysOverdue, amountDueCents, paidCents),
    agingBucket: toAgingBucket(daysOverdue),
    xeroStatus: invoice.Status,
    currency: invoice.CurrencyCode?.trim().toUpperCase() || undefined
  };
}

function mapInvoiceStatus(
  xeroStatus: string | undefined,
  daysOverdue: number,
  amountDueCents: number,
  paidCents = 0
): CollectionStatus {
  if (xeroStatus === 'PAID' || (amountDueCents <= 0 && paidCents > 0)) return 'paid';
  if (amountDueCents <= 0) return 'current';
  if (daysOverdue > 0) return 'overdue';
  return 'due_soon';
}

export function applyCreditNoteAllocations(
  invoices: Invoice[],
  notes: XeroCreditNote[]
): Invoice[] {
  const allocatedByInvoice = new Map<string, number>();
  for (const note of notes) {
    for (const allocation of note.Allocations ?? []) {
      const invoiceId = allocation.Invoice?.InvoiceID;
      if (!invoiceId) continue;
      allocatedByInvoice.set(
        invoiceId,
        (allocatedByInvoice.get(invoiceId) ?? 0) + toCents(allocation.Amount)
      );
    }
  }

  return invoices.map((invoice) => {
    if (invoice.xeroStatus === 'CREDIT') return invoice;
    const allocated = allocatedByInvoice.get(invoice.id) ?? 0;
    if (allocated <= 0) return invoice;
    const paidCents = (invoice.paidCents ?? 0) + allocated;
    const amountDueCents = Math.max(0, invoice.amountCents - paidCents);
    const daysOverdue = amountDueCents > 0 ? getDaysOverdueFromDueDate(invoice.dueDate) : 0;
    return {
      ...invoice,
      paidCents,
      amountDueCents,
      status: amountDueCents <= 0 ? 'paid' : daysOverdue > 0 ? 'overdue' : 'due_soon',
      agingBucket: toAgingBucket(daysOverdue)
    };
  });
}

export function mapXeroInvoices(rawInvoices: XeroInvoice[]): Invoice[] {
  return rawInvoices.map(mapXeroInvoice).filter((invoice): invoice is Invoice => invoice !== null);
}

export function mapXeroCreditNotes(notes: XeroCreditNote[]): Invoice[] {
  const invoices: Invoice[] = [];
  for (const note of notes) {
    const customerId = note.Contact?.ContactID;
    if (!customerId || !note.CreditNoteID) continue;
    const issueDate = parseXeroDate(note.DateString ?? note.Date);
    const remaining = toCents(note.RemainingCredit);
    const total = toCents(note.Total);
    invoices.push({
      id: note.CreditNoteID,
      customerId,
      number: note.CreditNoteNumber ?? note.CreditNoteID.slice(0, 8),
      amountCents: total,
      amountDueCents: remaining,
      paidCents: Math.max(0, total - remaining),
      issueDate,
      dueDate: issueDate,
      status: 'current',
      agingBucket: 'current',
      xeroStatus: 'CREDIT'
    });
  }
  return invoices;
}

function customerBalanceCents(invoices: Invoice[]): number {
  const { code } = dominantOpenCurrency(invoices);
  let due = 0;
  let credit = 0;
  for (const invoice of invoices) {
    if (invoiceCurrencyCode(invoice) !== code) continue;
    credit += creditRemainingCents(invoice);
    if (isOpenCanonicalInvoice(invoice)) {
      due += invoiceAmountDueCents(invoice);
    }
  }
  return Math.max(0, due - credit);
}

export function mapXeroCustomers(contacts: XeroContact[], invoices: Invoice[]): Customer[] {
  const invoicesByCustomer = new Map<string, Invoice[]>();
  for (const invoice of invoices) {
    const list = invoicesByCustomer.get(invoice.customerId) ?? [];
    list.push(invoice);
    invoicesByCustomer.set(invoice.customerId, list);
  }

  const customers: Customer[] = [];
  const seen = new Set<string>();

  for (const contact of contacts) {
    const customerInvoices = invoicesByCustomer.get(contact.ContactID) ?? [];
    const hasHistory = customerInvoices.length > 0;
    if (contact.IsCustomer === false && !hasHistory) continue;

    const balanceCents = customerBalanceCents(customerInvoices);
    if (contact.IsCustomer !== true && !hasHistory && balanceCents <= 0) {
      continue;
    }

    const daysOverdue = customerInvoices
      .filter(isOpenCanonicalInvoice)
      .reduce((max, invoice) => Math.max(max, getDaysOverdueFromDueDate(invoice.dueDate)), 0);

    seen.add(contact.ContactID);
    customers.push({
      id: contact.ContactID,
      name: contact.Name ?? 'Unnamed contact',
      email: emailFromContact(contact),
      phone: phoneFromContact(contact),
      company: contact.Name ?? 'Unnamed contact',
      status: deriveCustomerStatus(balanceCents, daysOverdue),
      balanceCents,
      daysOverdue
    });
  }

  for (const [customerId, customerInvoices] of invoicesByCustomer) {
    if (seen.has(customerId)) continue;
    const balanceCents = customerBalanceCents(customerInvoices);
    const daysOverdue = customerInvoices
      .filter(isOpenCanonicalInvoice)
      .reduce((max, invoice) => Math.max(max, getDaysOverdueFromDueDate(invoice.dueDate)), 0);
    const contactName =
      contacts.find((contact) => contact.ContactID === customerId)?.Name ?? 'Xero customer';
    customers.push({
      id: customerId,
      name: contactName,
      email: 'no-email@xero.local',
      company: contactName,
      status: deriveCustomerStatus(balanceCents, daysOverdue),
      balanceCents,
      daysOverdue
    });
  }

  return customers.toSorted((a, b) => b.balanceCents - a.balanceCents);
}

export function buildAgingBucketsFromInvoices(invoices: Invoice[]): AgingBucketSummary[] {
  const open = invoices.filter(isOpenCanonicalInvoice);
  const buckets: AgingBucket[] = ['current', '1-30', '31-60', '61-90', '90+'];
  return buckets.map((bucket) => {
    const bucketInvoices = open.filter(
      (invoice) => toAgingBucket(getDaysOverdueFromDueDate(invoice.dueDate)) === bucket
    );
    return {
      bucket,
      label: AGING_BUCKET_LABELS[bucket],
      invoiceCount: bucketInvoices.length,
      totalCents: bucketInvoices.reduce((sum, invoice) => sum + invoiceAmountDueCents(invoice), 0)
    };
  });
}

export function buildCustomerStatusSummary(customers: Customer[]): CustomerStatusSummary {
  return customers.reduce(
    (summary, customer) => {
      summary[customer.status] += 1;
      return summary;
    },
    {
      current: 0,
      due_soon: 0,
      overdue: 0,
      in_dispute: 0,
      promised: 0,
      paid: 0
    } satisfies CustomerStatusSummary
  );
}

export function buildCustomerContextFromInvoices(
  customer: Customer,
  invoices: Invoice[],
  sourceLabel = 'Ledger'
): CustomerInboxContext {
  const currency = dominantOpenCurrency(invoices).code;
  const open = invoices.filter(
    (invoice) => isOpenCanonicalInvoice(invoice) && invoiceCurrencyCode(invoice) === currency
  );
  const billed = invoices.filter(
    (invoice) => invoice.xeroStatus !== 'CREDIT' && invoiceCurrencyCode(invoice) === currency
  );
  const overdueCount = open.filter(
    (invoice) => getDaysOverdueFromDueDate(invoice.dueDate) > 0
  ).length;

  return {
    avgDsoDays: averageCollectionDays(invoices),
    lifetimeValueCents: billed.reduce((sum, invoice) => sum + invoice.amountCents, 0),
    followUpsSent: 0,
    paymentTerms: 'As invoiced',
    source: sourceLabel,
    aiInsight:
      overdueCount > 0
        ? `${overdueCount} overdue invoice${overdueCount === 1 ? '' : 's'} · ${formatInsightBalance(customer.balanceCents, currency)} outstanding`
        : customer.balanceCents > 0
          ? `${formatInsightBalance(customer.balanceCents, currency)} outstanding · nothing overdue yet`
          : 'No open receivables for this customer',
    deepAnalysis: undefined
  };
}

function formatInsightBalance(cents: number, currency: string): string {
  return formatCurrencyWhole(cents, currency);
}

export function buildSyntheticInboxFromInvoices(
  invoices: Invoice[],
  customers: Customer[]
): InboxMessage[] {
  const openByCustomer = new Map<string, Invoice[]>();
  for (const invoice of invoices) {
    if (!isOpenCanonicalInvoice(invoice)) continue;
    const list = openByCustomer.get(invoice.customerId) ?? [];
    list.push(invoice);
    openByCustomer.set(invoice.customerId, list);
  }

  return customers
    .filter((customer) => (openByCustomer.get(customer.id)?.length ?? 0) > 0)
    .toSorted((a, b) => b.balanceCents - a.balanceCents)
    .map((customer) => {
      const customerInvoices = (openByCustomer.get(customer.id) ?? []).toSorted(
        (a, b) => getDaysOverdueFromDueDate(b.dueDate) - getDaysOverdueFromDueDate(a.dueDate)
      );
      const overdueCount = customerInvoices.filter(
        (invoice) => getDaysOverdueFromDueDate(invoice.dueDate) > 0
      ).length;
      const total = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(customer.balanceCents / 100);
      const invoiceLabel =
        customerInvoices.length === 1
          ? `Invoice ${customerInvoices[0].number}`
          : `${customerInvoices.length} invoices`;

      const oldestDue = customerInvoices[0]?.dueDate;
      const latestIssue = customerInvoices.reduce(
        (latest, invoice) => {
          const issue = invoice.issueDate ?? invoice.dueDate;
          return issue > latest ? issue : latest;
        },
        oldestDue ?? new Date().toISOString().slice(0, 10)
      );

      return {
        id: `xero-customer-${customer.id}`,
        customerId: customer.id,
        subject:
          overdueCount > 0
            ? `${customer.name} · ${invoiceLabel} overdue`
            : `${customer.name} · ${invoiceLabel} outstanding`,
        preview: `${total} open · ${customerInvoices.map((invoice) => invoice.number).join(', ')}`,
        // Stamp from ledger dates — not wall-clock "now" (B26).
        receivedAt: `${latestIssue}T12:00:00.000Z`,
        // Overdue alone is not "awaiting reply" — that requires a prior send (B14).
        unread: false,
        channel: 'email' as const,
        suggestedAction: overdueCount > 0 ? 'Draft follow-up' : 'Review invoices',
        agentDraftReady: false
      };
    });
}

export function agingReportSummaryFromInvoices(
  invoices: Invoice[],
  filters: AgingReportFilters
): AgingReportSummary {
  return buildAgingReportSummary(invoices, filters);
}

export function agingChartBucketsFromInvoices(
  invoices: Invoice[],
  filters: AgingReportFilters
): AgingChartBucketRow[] {
  return buildAgingChartBuckets(filterInvoicesForReport(invoices, filters));
}

export function agingCustomerBreakdownFromInvoices(
  invoices: Invoice[],
  customers: Customer[],
  filters: AgingReportFilters
): AgingCustomerBreakdownRow[] {
  return buildAgingCustomerRows(invoices, customers, filters);
}
