import type { XeroContact, XeroInvoice } from '@/lib/integrations/xero-api';
import {
  buildAgingChartBuckets,
  buildAgingCustomerRows,
  buildAgingReportSummary,
  filterInvoicesForReport
} from '../aging/lib/aging-report';
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
import { getDaysOverdueFromDueDate } from '../utils';
import type { CustomerStatusSummary } from './types';

const AGING_BUCKET_LABELS: Record<AgingBucket, string> = {
  current: 'Current',
  '1-30': '1–30 days',
  '31-60': '31–60 days',
  '61-90': '61–90 days',
  '90+': '90+ days'
};

const OPEN_INVOICE_STATUSES = new Set(['AUTHORISED', 'SUBMITTED']);

export function toAgingBucket(daysOverdue: number): AgingBucket {
  if (daysOverdue <= 0) return 'current';
  if (daysOverdue <= 30) return '1-30';
  if (daysOverdue <= 60) return '31-60';
  if (daysOverdue <= 90) return '61-90';
  return '90+';
}

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
  // PAID with zero due should not appear in AR dashboard.
  if (status === 'PAID') return amountDue > 0.0001;
  return amountDue > 0.0001;
}

export function mapXeroInvoice(invoice: XeroInvoice): Invoice | null {
  const customerId = invoice.Contact?.ContactID;
  if (!customerId || !invoice.InvoiceID) return null;

  const dueDate = parseXeroDate(invoice.DueDateString ?? invoice.DueDate);
  const daysOverdue = getDaysOverdueFromDueDate(dueDate);
  const amountCents = toCents(invoice.AmountDue ?? invoice.Total);
  const status = mapInvoiceStatus(invoice.Status, daysOverdue, amountCents);

  return {
    id: invoice.InvoiceID,
    customerId,
    number: invoice.InvoiceNumber ?? invoice.InvoiceID.slice(0, 8),
    amountCents,
    dueDate,
    status,
    agingBucket: toAgingBucket(daysOverdue)
  };
}

function mapInvoiceStatus(
  xeroStatus: string | undefined,
  daysOverdue: number,
  amountCents: number
): CollectionStatus {
  if (amountCents <= 0 || xeroStatus === 'PAID') return 'current';
  if (daysOverdue > 0) return 'overdue';
  return 'due_soon';
}

export function mapXeroInvoices(rawInvoices: XeroInvoice[]): Invoice[] {
  return rawInvoices
    .filter(isOpenReceivableInvoice)
    .map(mapXeroInvoice)
    .filter((invoice): invoice is Invoice => invoice !== null);
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
    if (contact.IsCustomer === false) continue;

    const openInvoices = invoicesByCustomer.get(contact.ContactID) ?? [];
    const balanceCents = openInvoices.reduce((sum, invoice) => sum + invoice.amountCents, 0);
    if (contact.IsCustomer !== true && balanceCents <= 0) {
      continue;
    }

    const daysOverdue = openInvoices.reduce(
      (max, invoice) => Math.max(max, getDaysOverdueFromDueDate(invoice.dueDate)),
      0
    );

    seen.add(contact.ContactID);
    customers.push({
      id: contact.ContactID,
      name: contact.Name ?? 'Unnamed contact',
      email: contact.EmailAddress?.trim() || 'no-email@xero.local',
      phone: phoneFromContact(contact),
      company: contact.Name ?? 'Unnamed contact',
      status: deriveCustomerStatus(balanceCents, daysOverdue),
      balanceCents,
      daysOverdue
    });
  }

  for (const [customerId, customerInvoices] of invoicesByCustomer) {
    if (seen.has(customerId)) continue;
    const balanceCents = customerInvoices.reduce((sum, invoice) => sum + invoice.amountCents, 0);
    if (balanceCents <= 0) continue;
    const daysOverdue = customerInvoices.reduce(
      (max, invoice) => Math.max(max, getDaysOverdueFromDueDate(invoice.dueDate)),
      0
    );
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

function deriveCustomerStatus(balanceCents: number, daysOverdue: number): CollectionStatus {
  if (balanceCents <= 0) return 'current';
  if (daysOverdue > 0) return 'overdue';
  return 'due_soon';
}

export function buildAgingBucketsFromInvoices(invoices: Invoice[]): AgingBucketSummary[] {
  const buckets: AgingBucket[] = ['current', '1-30', '31-60', '61-90', '90+'];
  return buckets.map((bucket) => {
    const bucketInvoices = invoices.filter((invoice) => invoice.agingBucket === bucket);
    return {
      bucket,
      label: AGING_BUCKET_LABELS[bucket],
      invoiceCount: bucketInvoices.length,
      totalCents: bucketInvoices.reduce((sum, invoice) => sum + invoice.amountCents, 0)
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
      promised: 0
    } satisfies CustomerStatusSummary
  );
}

export function buildCustomerContextFromInvoices(
  customer: Customer,
  invoices: Invoice[]
): CustomerInboxContext {
  const open = invoices.filter((invoice) => invoice.customerId === customer.id);
  const overdueCount = open.filter(
    (invoice) => getDaysOverdueFromDueDate(invoice.dueDate) > 0
  ).length;

  return {
    avgDsoDays: customer.daysOverdue,
    lifetimeValueCents: open.reduce((sum, invoice) => sum + invoice.amountCents, 0),
    followUpsSent: 0,
    paymentTerms: 'From Xero',
    source: 'Xero',
    aiInsight:
      overdueCount > 0
        ? `${overdueCount} overdue invoice${overdueCount === 1 ? '' : 's'} · ${formatInsightBalance(customer.balanceCents)} outstanding`
        : customer.balanceCents > 0
          ? `${formatInsightBalance(customer.balanceCents)} outstanding · nothing overdue yet`
          : 'No open receivables for this customer',
    deepAnalysis: undefined
  };
}

function formatInsightBalance(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(cents / 100);
}

export function buildSyntheticInboxFromInvoices(
  invoices: Invoice[],
  customers: Customer[]
): InboxMessage[] {
  const customerById = new Map(customers.map((customer) => [customer.id, customer]));

  return invoices
    .filter((invoice) => getDaysOverdueFromDueDate(invoice.dueDate) > 0)
    .toSorted((a, b) => getDaysOverdueFromDueDate(b.dueDate) - getDaysOverdueFromDueDate(a.dueDate))
    .map((invoice) => {
      const days = getDaysOverdueFromDueDate(invoice.dueDate);
      const customer = customerById.get(invoice.customerId);
      return {
        id: `xero-inv-${invoice.id}`,
        customerId: invoice.customerId,
        subject: `Invoice ${invoice.number} overdue`,
        preview: `${customer?.name ?? 'Customer'} · ${days} day${days === 1 ? '' : 's'} past due`,
        receivedAt: new Date().toISOString(),
        unread: true,
        channel: 'email' as const,
        suggestedAction: 'Draft follow-up',
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
