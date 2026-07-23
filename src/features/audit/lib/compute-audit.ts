import type {
  AgingBucket,
  AuditHeadline,
  AuditReport,
  BehaviorBand,
  CustomerBehavior,
  EnrichedInvoice,
  InvoiceRecord,
  PriorityItem
} from './types';
import { buildBehaviorRead, buildFirstMove } from './narrative';

const BUCKETS: AgingBucket[] = ['Current', '1-30', '31-60', '61-90', '90+'];
const ANNUAL_CREDIT_RATE = 0.12;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(later: Date, earlier: Date): number {
  const ms = startOfDay(later).getTime() - startOfDay(earlier).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function monthSpanInclusive(min: Date, max: Date): number {
  return (max.getFullYear() - min.getFullYear()) * 12 + (max.getMonth() - min.getMonth()) + 1;
}

export function bucketForAge(age: number): AgingBucket {
  if (age <= 0) return 'Current';
  if (age <= 30) return '1-30';
  if (age <= 60) return '31-60';
  if (age <= 90) return '61-90';
  return '90+';
}

export function enrichInvoices(invoices: InvoiceRecord[], analysisDate: Date): EnrichedInvoice[] {
  const asOf = startOfDay(analysisDate);
  return invoices.map((inv) => {
    if (!inv.isOutstanding) {
      return {
        ...inv,
        daysPastDueNow: null,
        bucket: null,
        openAmount: 0,
        openValueXAge: 0
      };
    }
    const daysPastDueNow = Math.max(0, daysBetween(asOf, inv.dueDate));
    const bucket = bucketForAge(daysPastDueNow);
    const openAmount = inv.amount;
    return {
      ...inv,
      daysPastDueNow,
      bucket,
      openAmount,
      openValueXAge: openAmount * daysPastDueNow
    };
  });
}

function weightedAverage(items: Array<{ weight: number; value: number }>): number | null {
  let w = 0;
  let sum = 0;
  for (const item of items) {
    w += item.weight;
    sum += item.weight * item.value;
  }
  if (w === 0) return null;
  return sum / w;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function lateTrend(paidLates: Array<{ invoiceDate: Date; daysLate: number }>): number | null {
  if (paidLates.length < 2) return null;
  const sorted = [...paidLates].sort((a, b) => a.invoiceDate.getTime() - b.invoiceDate.getTime());
  const mid = Math.floor(sorted.length / 2);
  const first = sorted.slice(0, mid);
  const second = sorted.slice(mid);
  if (first.length === 0 || second.length === 0) return null;
  const avg1 = average(first.map((x) => x.daysLate));
  const avg2 = average(second.map((x) => x.daysLate));
  if (avg1 === null || avg2 === null) return null;
  return avg2 - avg1;
}

export function classifyBehavior(
  avgDaysLate: number | null,
  lateTrendDays: number | null
): { band: BehaviorBand; deteriorating: boolean } {
  const late = avgDaysLate ?? 0;
  const deteriorating = (lateTrendDays ?? 0) >= 8;
  let band: BehaviorBand;
  if (late <= 5) band = 'Reliable';
  else if (late <= 15) band = 'Mildly slow';
  else if (late <= 30) band = 'Chronically slow';
  else band = 'Problem payer';
  return { band, deteriorating };
}

function emptyAging(): Record<AgingBucket, number> {
  return { Current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
}

export function computeHeadline(
  enriched: EnrichedInvoice[],
  invoices: InvoiceRecord[]
): AuditHeadline {
  const paid = invoices.filter((i) => i.isPaid);
  const outstanding = enriched.filter((i) => i.isOutstanding);
  const totalBilled = invoices.reduce((s, i) => s + i.amount, 0);
  const dates = invoices.map((i) => i.invoiceDate);
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
  const months = monthSpanInclusive(minDate, maxDate);
  const averageMonthlyBilling = months > 0 ? totalBilled / months : 0;

  const vwAvgDaysToPay =
    weightedAverage(
      paid
        .filter((i) => i.daysToPay !== null)
        .map((i) => ({ weight: i.amount, value: i.daysToPay as number }))
    ) ?? 0;

  const vwAvgTerms =
    weightedAverage(invoices.map((i) => ({ weight: i.amount, value: i.termsDays }))) ?? 0;

  const extraCreditDays = vwAvgDaysToPay - vwAvgTerms;
  const cashLocked = averageMonthlyBilling * (extraCreditDays / 30);
  const interestCostAnnual = cashLocked * ANNUAL_CREDIT_RATE;

  const aging = emptyAging();
  for (const inv of outstanding) {
    if (inv.bucket) aging[inv.bucket] += inv.openAmount;
  }

  const openAr = outstanding.reduce((s, i) => s + i.openAmount, 0);
  const openCustomerCount = new Set(outstanding.map((i) => i.customer)).size;
  const statedTerms = Math.round(vwAvgTerms);
  const collectAt = Math.round(vwAvgDaysToPay * 10) / 10;

  const headlineSentence = `You collect at ${collectAt} days against ${statedTerms}-day terms. That gap parks roughly $${Math.round(cashLocked).toLocaleString('en-US')} of your cash with customers, permanently.`;

  const withinTermsCount = outstanding.filter((i) => (i.daysPastDueNow ?? 0) <= 0).length;

  return {
    invoiceCount: invoices.length,
    paidCount: paid.length,
    outstandingCount: outstanding.length,
    totalBilled,
    monthSpan: months,
    billingStart: minDate,
    billingEnd: maxDate,
    averageMonthlyBilling,
    openAr,
    openCustomerCount,
    withinTermsCount,
    vwAvgDaysToPay,
    vwAvgTerms,
    extraCreditDays,
    cashLocked,
    interestCostAnnual,
    headlineSentence,
    aging
  };
}

export function computeCustomers(enriched: EnrichedInvoice[]): CustomerBehavior[] {
  const byCustomer = new Map<string, EnrichedInvoice[]>();
  for (const inv of enriched) {
    const list = byCustomer.get(inv.customer) ?? [];
    list.push(inv);
    byCustomer.set(inv.customer, list);
  }

  const customers: CustomerBehavior[] = [];

  for (const [customer, rows] of byCustomer) {
    const paid = rows.filter((r) => r.isPaid && r.daysToPay !== null);
    const paidLates = rows
      .filter((r) => r.isPaid && r.daysLateAtPayment !== null)
      .map((r) => ({
        invoiceDate: r.invoiceDate,
        daysLate: r.daysLateAtPayment as number
      }));
    const outstanding = rows.filter((r) => r.isOutstanding);

    const avgDaysToPay = average(paid.map((r) => r.daysToPay as number));
    const avgDaysLate = average(paidLates.map((r) => r.daysLate));
    const trend = lateTrend(paidLates);
    const { band, deteriorating } = classifyBehavior(avgDaysLate, trend);

    const termsDays =
      Math.round(
        (weightedAverage(rows.map((r) => ({ weight: r.amount, value: r.termsDays }))) ?? 30) * 10
      ) / 10;

    const aging = emptyAging();
    let openValueXAge = 0;
    for (const inv of outstanding) {
      if (inv.bucket) aging[inv.bucket] += inv.openAmount;
      openValueXAge += inv.openValueXAge;
    }
    const openValue = outstanding.reduce((s, i) => s + i.openAmount, 0);
    const valueWeightedAge = openValue > 0 ? openValueXAge / openValue : 0;
    const impactScore = openValue * Math.max(1, valueWeightedAge);

    const customerRow: CustomerBehavior = {
      customer,
      invoiceCount: rows.length,
      lifetimeBilled: rows.reduce((s, i) => s + i.amount, 0),
      avgDaysToPay,
      termsDays: Math.round(termsDays),
      avgDaysLate,
      lateTrendDays: trend,
      behaviorBand: band,
      deteriorating,
      behaviorRead: '',
      openInvoiceCount: outstanding.length,
      openValue,
      aging,
      valueWeightedAge,
      impactScore
    };
    customerRow.behaviorRead = buildBehaviorRead(customerRow);
    customers.push(customerRow);
  }

  return customers.toSorted((a, b) => b.lifetimeBilled - a.lifetimeBilled);
}

export function computePriority(customers: CustomerBehavior[]): PriorityItem[] {
  return customers
    .filter((c) => c.openValue > 0)
    .toSorted((a, b) => b.impactScore - a.impactScore)
    .slice(0, 10)
    .map((c, index) => ({
      rank: index + 1,
      customer: c.customer,
      openValue: c.openValue,
      valueWeightedAge: c.valueWeightedAge,
      impactScore: c.impactScore,
      avgDaysLate: c.avgDaysLate,
      recommendedFirstMove: buildFirstMove(c)
    }));
}

export function computeAuditReport(options: {
  invoices: InvoiceRecord[];
  companyName: string;
  analysisDate: Date;
}): AuditReport {
  const { invoices, companyName, analysisDate } = options;
  if (invoices.length === 0) {
    throw new Error('No invoices to analyze.');
  }

  const enriched = enrichInvoices(invoices, analysisDate);
  const headline = computeHeadline(enriched, invoices);
  const customers = computeCustomers(enriched);
  const priority = computePriority(customers);

  const overdueInvoices = enriched
    .filter((i) => i.isOutstanding && (i.daysPastDueNow ?? 0) > 0)
    .map((i) => ({
      invoiceNumber: i.invoiceNumber,
      customer: i.customer,
      issued: i.invoiceDate,
      due: i.dueDate,
      amount: i.amount,
      daysPastDue: i.daysPastDueNow as number
    }))
    .toSorted((a, b) => b.daysPastDue - a.daysPastDue);

  const modelPayers = customers
    .filter((c) => c.behaviorBand === 'Reliable')
    .slice(0, 4)
    .map((c) => c.customer);

  const creditDonors = customers
    .filter((c) => c.behaviorBand === 'Problem payer')
    .toSorted((a, b) => (b.avgDaysLate ?? 0) - (a.avgDaysLate ?? 0))
    .slice(0, 2);

  const oneToWatch =
    customers
      .filter((c) => c.deteriorating)
      .toSorted((a, b) => (b.lateTrendDays ?? 0) - (a.lateTrendDays ?? 0))[0]?.customer ?? null;

  const fixReleaseLow = headline.averageMonthlyBilling * (10 / 30);
  const fixReleaseHigh = headline.averageMonthlyBilling * (15 / 30);

  return {
    companyName,
    analysisDate,
    headline,
    customers,
    priority,
    overdueInvoices,
    modelPayers,
    creditDonors: creditDonors.map((c) => c.customer),
    oneToWatch,
    fixReleaseLow,
    fixReleaseHigh
  };
}
