import type {
  AgingChartBucketRow,
  AgingCustomerBreakdownRow,
  AgingReportBucket,
  AgingReportFilters,
  AgingReportPeriod,
  AgingReportSort,
  AgingReportSummary,
  AgingRiskLevel,
  Customer,
  Invoice
} from '../../types';
import { invoiceAmountDueCents, isOpenCanonicalInvoice } from '../../lib/invoice-open';
import { dominantOpenCurrency, invoiceCurrencyCode } from '../../lib/invoice-currency';
import { agingBucketFromDays } from '../../lib/live-aging';
import { relationshipBadgeLabel } from '../../lib/relationship-policy';

export const AGING_REPORT_AS_OF_DATE = new Date().toISOString().slice(0, 10);

const CHART_BUCKET_ORDER: AgingReportBucket[] = ['current', '1-30', '31-60', '61-90', '90+'];

const CHART_BUCKET_LABELS: Record<AgingReportBucket, string> = {
  current: 'Current',
  '1-30': '1–30 days',
  '31-60': '31–60 days',
  '61-90': '61–90 days',
  '90+': '90+ days'
};

export function daysPastDue(dueDate: string, asOfDate: string = AGING_REPORT_AS_OF_DATE): number {
  const due = new Date(`${dueDate}T00:00:00`);
  const asOf = new Date(`${asOfDate}T00:00:00`);
  const diffMs = asOf.getTime() - due.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function toReportChartBucket(daysPastDueValue: number): AgingReportBucket {
  return agingBucketFromDays(daysPastDueValue);
}

export function toTableBucketColumns(
  invoice: Invoice,
  asOfDate: string = AGING_REPORT_AS_OF_DATE
): {
  currentCents: number;
  days1to30Cents: number;
  days31to60Cents: number;
  days61to90Cents: number;
  days90PlusCents: number;
} {
  const amount = invoiceAmountDueCents(invoice);
  const bucket = toReportChartBucket(daysPastDue(invoice.dueDate, asOfDate));
  return {
    currentCents: bucket === 'current' ? amount : 0,
    days1to30Cents: bucket === '1-30' ? amount : 0,
    days31to60Cents: bucket === '31-60' ? amount : 0,
    days61to90Cents: bucket === '61-90' ? amount : 0,
    days90PlusCents: bucket === '90+' ? amount : 0
  };
}

function isInPeriod(dueDate: string, period: AgingReportPeriod, asOfDate: string): boolean {
  if (period === 'all_time') return true;

  const due = new Date(`${dueDate}T00:00:00`);
  const asOf = new Date(`${asOfDate}T00:00:00`);

  if (period === 'this_month') {
    return due.getFullYear() === asOf.getFullYear() && due.getMonth() === asOf.getMonth();
  }

  const lastMonth = new Date(asOf.getFullYear(), asOf.getMonth() - 1, 1);
  return due.getFullYear() === lastMonth.getFullYear() && due.getMonth() === lastMonth.getMonth();
}

export function filterInvoicesForReport(
  invoices: Invoice[],
  filters: AgingReportFilters,
  asOfDate: string = AGING_REPORT_AS_OF_DATE
): Invoice[] {
  return invoices.filter((invoice) => {
    if (!isOpenCanonicalInvoice(invoice)) return false;
    if (filters.customerId && invoice.customerId !== filters.customerId) return false;
    return isInPeriod(invoice.dueDate, filters.period, asOfDate);
  });
}

export function buildAgingChartBuckets(
  invoices: Invoice[],
  asOfDate: string = AGING_REPORT_AS_OF_DATE
): AgingChartBucketRow[] {
  const totals = new Map<AgingReportBucket, { invoiceCount: number; totalCents: number }>();

  for (const bucket of CHART_BUCKET_ORDER) {
    totals.set(bucket, { invoiceCount: 0, totalCents: 0 });
  }

  const { code } = dominantOpenCurrency(invoices);
  for (const invoice of invoices) {
    if (invoiceCurrencyCode(invoice) !== code) continue;
    const bucket = toReportChartBucket(daysPastDue(invoice.dueDate, asOfDate));
    const entry = totals.get(bucket)!;
    entry.invoiceCount += 1;
    entry.totalCents += invoiceAmountDueCents(invoice);
  }

  return CHART_BUCKET_ORDER.map((bucket) => {
    const entry = totals.get(bucket)!;
    return {
      bucket,
      label: CHART_BUCKET_LABELS[bucket],
      invoiceCount: entry.invoiceCount,
      totalCents: entry.totalCents
    };
  });
}

export function deriveCustomerRisk(
  _row: Pick<
    AgingCustomerBreakdownRow,
    | 'currentCents'
    | 'days1to30Cents'
    | 'days31to60Cents'
    | 'days61to90Cents'
    | 'days90PlusCents'
    | 'totalCents'
  >,
  customer: Customer
): AgingRiskLevel {
  // Prefer live days overdue (aligned with Customers Healthy/Watch/High).
  const days = customer.daysOverdue;
  if (days <= 7) return 'low';
  if (days <= 15) return 'medium';
  return 'high';
}

function sortCustomerRows(
  rows: AgingCustomerBreakdownRow[],
  sort: AgingReportSort
): AgingCustomerBreakdownRow[] {
  const sorted = [...rows];

  switch (sort) {
    case 'amount_desc':
      return sorted.sort((a, b) => b.totalCents - a.totalCents);
    case 'amount_asc':
      return sorted.sort((a, b) => a.totalCents - b.totalCents);
    case 'customer_asc':
      return sorted.sort((a, b) => a.company.localeCompare(b.company));
    default: {
      const _exhaustive: never = sort;
      return _exhaustive;
    }
  }
}

export function buildAgingCustomerRows(
  invoices: Invoice[],
  customers: Customer[],
  filters: AgingReportFilters,
  asOfDate: string = AGING_REPORT_AS_OF_DATE
): AgingCustomerBreakdownRow[] {
  const filtered = filterInvoicesForReport(invoices, filters, asOfDate);
  const { code } = dominantOpenCurrency(filtered);
  const counted = filtered.filter((invoice) => invoiceCurrencyCode(invoice) === code);
  const customerById = new Map(customers.map((customer) => [customer.id, customer]));

  const grouped = new Map<
    string,
    Omit<AgingCustomerBreakdownRow, 'risk' | 'company'> & { company?: string }
  >();

  for (const invoice of counted) {
    const customer = customerById.get(invoice.customerId);
    if (!customer) continue;

    const columns = toTableBucketColumns(invoice, asOfDate);
    const existing = grouped.get(invoice.customerId) ?? {
      customerId: invoice.customerId,
      company: customer.company,
      invoiceCount: 0,
      currentCents: 0,
      days1to30Cents: 0,
      days31to60Cents: 0,
      days61to90Cents: 0,
      days90PlusCents: 0,
      totalCents: 0
    };

    existing.invoiceCount += 1;
    existing.currentCents += columns.currentCents;
    existing.days1to30Cents += columns.days1to30Cents;
    existing.days31to60Cents += columns.days31to60Cents;
    existing.days61to90Cents += columns.days61to90Cents;
    existing.days90PlusCents += columns.days90PlusCents;
    existing.totalCents += invoiceAmountDueCents(invoice);

    grouped.set(invoice.customerId, existing);
  }

  const rows: AgingCustomerBreakdownRow[] = Array.from(grouped.values()).map((row) => {
    const customer = customerById.get(row.customerId)!;
    const base = {
      customerId: row.customerId,
      company: row.company ?? customer.company,
      invoiceCount: row.invoiceCount,
      currentCents: row.currentCents,
      days1to30Cents: row.days1to30Cents,
      days31to60Cents: row.days31to60Cents,
      days61to90Cents: row.days61to90Cents,
      days90PlusCents: row.days90PlusCents,
      totalCents: row.totalCents
    };
    return {
      ...base,
      risk: deriveCustomerRisk(base, customer),
      relationshipLabel: relationshipBadgeLabel(customer)
    };
  });

  return sortCustomerRows(rows, filters.sort);
}

export function buildAgingReportSummary(
  invoices: Invoice[],
  filters: AgingReportFilters,
  asOfDate: string = AGING_REPORT_AS_OF_DATE
): AgingReportSummary {
  const filtered = filterInvoicesForReport(invoices, filters, asOfDate);
  const { code, mixed } = dominantOpenCurrency(filtered);
  const counted = filtered.filter((invoice) => invoiceCurrencyCode(invoice) === code);

  let totalArCents = 0;
  let currentCents = 0;
  let weightedDsoSum = 0;

  for (const invoice of counted) {
    totalArCents += invoiceAmountDueCents(invoice);
    const pastDue = daysPastDue(invoice.dueDate, asOfDate);
    if (pastDue <= 0) {
      currentCents += invoiceAmountDueCents(invoice);
    }
    weightedDsoSum += pastDue * invoiceAmountDueCents(invoice);
  }

  const overdueCents = totalArCents - currentCents;
  const weightedAvgDsoDays = totalArCents > 0 ? Math.round(weightedDsoSum / totalArCents) : 0;

  return {
    totalArCents,
    currentCents,
    overdueCents,
    weightedAvgDsoDays,
    totalArDeltaPct: 0,
    currentDeltaPct: 0,
    overdueDeltaPct: 0,
    dsoDeltaDays: 0,
    currency: code,
    mixedCurrency: mixed
  };
}
