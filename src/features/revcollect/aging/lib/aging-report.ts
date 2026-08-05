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

export const AGING_REPORT_AS_OF_DATE = new Date().toISOString().slice(0, 10);

const CHART_BUCKET_ORDER: AgingReportBucket[] = ['current', '1-15', '16-30', '31-60', '60+'];

const CHART_BUCKET_LABELS: Record<AgingReportBucket, string> = {
  current: 'Current',
  '1-15': '1–15 days',
  '16-30': '16–30 days',
  '31-60': '31–60 days',
  '60+': '60+ days'
};

export function daysPastDue(dueDate: string, asOfDate: string = AGING_REPORT_AS_OF_DATE): number {
  const due = new Date(`${dueDate}T00:00:00`);
  const asOf = new Date(`${asOfDate}T00:00:00`);
  const diffMs = asOf.getTime() - due.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function toReportChartBucket(daysPastDueValue: number): AgingReportBucket {
  if (daysPastDueValue <= 0) return 'current';
  if (daysPastDueValue <= 15) return '1-15';
  if (daysPastDueValue <= 30) return '16-30';
  if (daysPastDueValue <= 60) return '31-60';
  return '60+';
}

export function toTableBucketColumns(invoice: Invoice): {
  currentCents: number;
  days1to30Cents: number;
  days31to60Cents: number;
  days60PlusCents: number;
} {
  const amount = invoice.amountCents;

  switch (invoice.agingBucket) {
    case 'current':
      return { currentCents: amount, days1to30Cents: 0, days31to60Cents: 0, days60PlusCents: 0 };
    case '1-30':
      return { currentCents: 0, days1to30Cents: amount, days31to60Cents: 0, days60PlusCents: 0 };
    case '31-60':
      return { currentCents: 0, days1to30Cents: 0, days31to60Cents: amount, days60PlusCents: 0 };
    case '61-90':
    case '90+':
      return { currentCents: 0, days1to30Cents: 0, days31to60Cents: 0, days60PlusCents: amount };
    default: {
      const _exhaustive: never = invoice.agingBucket;
      return _exhaustive;
    }
  }
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

  for (const invoice of invoices) {
    const bucket = toReportChartBucket(daysPastDue(invoice.dueDate, asOfDate));
    const entry = totals.get(bucket)!;
    entry.invoiceCount += 1;
    entry.totalCents += invoice.amountCents;
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
  row: Pick<
    AgingCustomerBreakdownRow,
    'currentCents' | 'days1to30Cents' | 'days31to60Cents' | 'days60PlusCents' | 'totalCents'
  >,
  customer: Customer
): AgingRiskLevel {
  if (customer.status === 'overdue' || customer.status === 'in_dispute') {
    return 'high';
  }

  if (row.totalCents === 0) return 'low';

  const overdueShare =
    (row.days1to30Cents + row.days31to60Cents + row.days60PlusCents) / row.totalCents;

  if (row.days60PlusCents > 0 || row.days31to60Cents >= row.totalCents * 0.5) {
    return 'high';
  }

  if (row.currentCents === row.totalCents) {
    return 'low';
  }

  if (overdueShare >= 0.5 || customer.status === 'due_soon') {
    return 'medium';
  }

  return row.days31to60Cents > 0 || row.days1to30Cents > 0 ? 'medium' : 'low';
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
  const customerById = new Map(customers.map((customer) => [customer.id, customer]));

  const grouped = new Map<
    string,
    Omit<AgingCustomerBreakdownRow, 'risk' | 'company'> & { company?: string }
  >();

  for (const invoice of filtered) {
    const customer = customerById.get(invoice.customerId);
    if (!customer) continue;

    const columns = toTableBucketColumns(invoice);
    const existing = grouped.get(invoice.customerId) ?? {
      customerId: invoice.customerId,
      company: customer.company,
      invoiceCount: 0,
      currentCents: 0,
      days1to30Cents: 0,
      days31to60Cents: 0,
      days60PlusCents: 0,
      totalCents: 0
    };

    existing.invoiceCount += 1;
    existing.currentCents += columns.currentCents;
    existing.days1to30Cents += columns.days1to30Cents;
    existing.days31to60Cents += columns.days31to60Cents;
    existing.days60PlusCents += columns.days60PlusCents;
    existing.totalCents += invoice.amountCents;

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
      days60PlusCents: row.days60PlusCents,
      totalCents: row.totalCents
    };
    return { ...base, risk: deriveCustomerRisk(base, customer) };
  });

  return sortCustomerRows(rows, filters.sort);
}

export function buildAgingReportSummary(
  invoices: Invoice[],
  filters: AgingReportFilters,
  asOfDate: string = AGING_REPORT_AS_OF_DATE
): AgingReportSummary {
  const filtered = filterInvoicesForReport(invoices, filters, asOfDate);

  let totalArCents = 0;
  let currentCents = 0;
  let weightedDsoSum = 0;

  for (const invoice of filtered) {
    totalArCents += invoice.amountCents;
    const pastDue = daysPastDue(invoice.dueDate, asOfDate);
    if (pastDue <= 0) {
      currentCents += invoice.amountCents;
    }
    weightedDsoSum += pastDue * invoice.amountCents;
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
    dsoDeltaDays: 0
  };
}
