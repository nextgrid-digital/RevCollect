import type { AuditReport } from './types';
import { formatDays, formatMoney, formatTrend } from './narrative';

const FOREST = '#0f3e17';
const SAGE = '#b1dbb8';
const KEYLIME = '#e1f4df';
const CREAM = '#fffefc';
const CHARCOAL = '#222222';
const RULE = '#efeeeb';

export const auditPdfTheme = {
  forest: FOREST,
  sage: SAGE,
  keylime: KEYLIME,
  cream: CREAM,
  charcoal: CHARCOAL,
  rule: RULE
};

export function formatPreparedDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function buildPage1Intro(report: AuditReport): string {
  const months = report.headline.monthSpan;
  return `We analyzed ${report.headline.invoiceCount} invoices across ${months} months of your billing history. You already know what is outstanding. This report shows you the thing your accounting system cannot: how your customers actually pay you, and what that behavior costs.`;
}

export function buildCoverClosing(report: AuditReport): string {
  const stated = Math.round(report.headline.vwAvgTerms);
  const reality = Math.round(report.headline.vwAvgDaysToPay);
  const extra = Math.round(report.headline.extraCreditDays);
  return `You invoice on ${stated}-day terms. Your customers pay, on average, at ${reality} days. Those ${extra} extra days mean roughly ${formatMoney(report.headline.cashLocked)} of your own cash is always sitting in other people's bank accounts, interest-free, permanently.`;
}

export function buildCoverTeaser(): string {
  return 'The sections below show where it sits, which customers hold it, and the ten moves that release most of it. The detailed record behind every number follows.';
}

export function buildTermsGapCopy(report: AuditReport): string {
  const extra = Math.round(report.headline.extraCreditDays);
  return `Every invoice you issue quietly grants an extra ${extra} days of credit you never agreed to. On ${formatMoney(report.headline.averageMonthlyBilling)} of monthly billing, that gap is the ${formatMoney(report.headline.cashLocked)} figure on the cover. It is not a metric problem; it is a working capital problem.`;
}

export function buildTermsRealityTitle(report: AuditReport): string {
  const stated = Math.round(report.headline.vwAvgTerms);
  const reality = Math.round(report.headline.vwAvgDaysToPay);
  return `Net ${stated} on paper. Net ${reality} in reality.`;
}

export function buildAgingNinetyCallout(report: AuditReport): string {
  return `${formatMoney(report.headline.aging['90+'])} of your money is more than 90 days old. Collectability decays sharply with age; industry experience puts recovery odds past six months near a coin flip. Every one of these invoices needs a named action this week: a final notice, a structured plan, or a conscious write-off decision. Silence is the one option that costs money.`;
}

export function buildInterestCopy(report: AuditReport): string {
  return `If your credit line prices at 12%, financing the ${formatMoney(report.headline.cashLocked)} gap costs roughly ${formatMoney(report.headline.interestCostAnnual)} annually. That is the price currently being paid for inconsistent follow-up, before counting the hours spent chasing or the invoices that age into losses.`;
}

export function buildInterestHeadline(report: AuditReport): string {
  return `What the slow collection costs in interest alone: about ${formatMoney(report.headline.interestCostAnnual)} a year.`;
}

export function buildPriorityIntro(report: AuditReport): string {
  const topOpenSum = report.priority.reduce((s, p) => s + p.openValue, 0);
  return `Ranked by impact: open value weighted by age and payment history. A $100 invoice at 100 days will never outrank a $30,000 invoice at 45 days here, because this list optimizes your cash, not a ratio. If you focus on everything, you focus on nothing; these ten hold ${formatMoney(topOpenSum)} of the ${formatMoney(report.headline.openAr)} open.`;
}

export function buildWhyOrderCopy(report: AuditReport): string {
  const top = report.priority[0];
  const deteriorating = report.priority.find((p) => /deteriorat/i.test(p.recommendedFirstMove));
  const chronic = report.priority.find(
    (p) => p.avgDaysLate != null && p.avgDaysLate >= 50 && p.rank !== top?.rank
  );

  const parts: string[] = [];
  if (top) {
    parts.push(
      `${top.customer} tops the list on sheer weight, and their history says one structured conversation resolves it: they have honored payment plans before.`
    );
  }
  if (deteriorating) {
    parts.push(
      `${deteriorating.customer} ranks despite moderate value because deterioration caught early is cheap and caught late is a write-off.`
    );
  }
  if (chronic) {
    parts.push(
      `${chronic.customer} ranks on chronicity: ${Math.round(chronic.avgDaysLate ?? 0)} days of average lateness is a standing policy of theirs, and it changes only when your process does.`
    );
  }
  if (parts.length === 0) {
    return 'Impact is open value multiplied by value-weighted age. Heavy open balances outrank thin old invoices so follow-up energy goes where cash actually sits.';
  }
  return parts.join(' ');
}

export function buildFixReleaseCopy(report: AuditReport): string {
  return `Businesses that run these three habits typically collect 10 to 15 days faster within two cycles. On your book, that is roughly ${formatMoney(report.fixReleaseLow)} to ${formatMoney(report.fixReleaseHigh)} released back into your account, once, permanently.`;
}

export function buildModelPayersCopy(report: AuditReport): string {
  if (report.modelPayers.length === 0) {
    return 'None flagged as fully reliable on this book. Gentle touches still protect relationships while you tighten the rest.';
  }
  return `${report.modelPayers.join(', ')}. Pay within a week of terms, every time. Gentle touches only.`;
}

export function buildCreditDonorsCopy(report: AuditReport): string {
  const donors = report.customers.filter((c) => report.creditDonors.includes(c.customer));
  if (donors.length === 0) {
    return 'No chronic problem payers on this slice. Keep ladders consistent so none emerge.';
  }
  const names = donors
    .map((c) => `${c.customer} (${Math.round(c.avgDaysLate ?? 0)}d late avg)`)
    .join(' and ');
  return `${names} take two extra months of credit on every invoice. Behavior responds to consistent process.`;
}

export function buildOneToWatchCopy(report: AuditReport): string {
  const watch = report.customers.find((c) => c.customer === report.oneToWatch);
  if (!watch || watch.lateTrendDays == null) {
    return 'No sharp deterioration in the recent half of settled invoices. Keep watching trend columns weekly.';
  }
  const days = Math.round(Math.abs(watch.lateTrendDays));
  return `${watch.customer} was among your more reliable payers; recent invoices show a ${days}-day deterioration. A relationship call this week beats three reminders next month.`;
}

export function buildWithinTermsFootnote(report: AuditReport): string {
  const count = report.headline.withinTermsCount;
  return `Plus ${count} invoice${count === 1 ? '' : 's'} currently within terms (not yet due), totaling ${formatMoney(report.headline.aging.Current)}. The full line-by-line record, including these, is in the companion workbook when available.`;
}

export function buildMethodDataCopy(report: AuditReport, dataSource: 'sample' | 'upload'): string {
  const settled = report.headline.paidCount;
  const open = report.headline.outstandingCount;
  const range = `${formatMonthYear(report.headline.billingStart)} and ${formatMonthYear(report.headline.billingEnd)}`;
  const sampleNote =
    dataSource === 'sample'
      ? ' Names and figures in this sample are fictional demonstration data.'
      : ' When run on a live account, the audit refreshes and tracks cash released against this baseline.';
  return `Data. ${report.headline.invoiceCount} invoices issued between ${range}, with payment allocations: issue date, due date, amount, payment date, and status per invoice. ${settled} are settled; ${open} remain open as of the analysis date (${formatPreparedDate(report.analysisDate)}). No sampling; the full record was analyzed.${sampleNote}`;
}

export function buildMethodDaysCopy(report: AuditReport): string {
  return `Days to pay. Payment date minus issue date, per invoice, averaged with value weighting so large invoices count proportionally. Your value-weighted average is ${report.headline.vwAvgDaysToPay.toFixed(1)} days against value-weighted terms of ${report.headline.vwAvgTerms.toFixed(1)} days.`;
}

export function buildMethodCashLockedCopy(report: AuditReport): string {
  const extra = report.headline.extraCreditDays;
  const stated = Math.round(report.headline.vwAvgTerms);
  return `Cash locked. Average monthly billing multiplied by the excess credit days over ${stated}: ${formatMoney(report.headline.averageMonthlyBilling)} × (${extra.toFixed(1)}/30) = ${formatMoney(report.headline.cashLocked)}. This is the additional working capital your business permanently finances because collection runs slower than terms. It is released, once, when the gap closes, and the interest line assumes a 12% cost of funds; substitute your actual rate.`;
}

export function buildMethodBehaviorCopy(): string {
  return 'Behavior and trend. Per customer, average lateness across settled invoices; the trend compares the recent half of their settled invoices against the earlier half, positive meaning slower. Customers with fewer than six settled invoices show no trend.';
}

export function buildMethodImpactCopy(): string {
  return 'Impact ranking. Open value × value-weighted age, adjusted for payment history. The ranking deliberately ignores pure day-counts: optimizing a metric (like DSO) rewards chasing small old invoices; optimizing cash rewards resolving heavy ones. This report optimizes cash.';
}

export function buildMethodStatutoryCopy(): string {
  return 'Statutory note. Late payment rights vary by jurisdiction: many regions provide for statutory interest and fixed compensation on overdue commercial invoices, and contractual late fees generally require advance disclosure in your terms. Confirm the specifics for your jurisdiction with your accountant or counsel; this report is information, not legal advice.';
}

export function buildMethodAboutCopy(dataSource: 'sample' | 'upload'): string {
  if (dataSource === 'sample') {
    return 'About this audit. Produced by RevCollect from invoice history. Names and figures in this sample are fictional demonstration data. When run on a live account, the audit refreshes monthly and tracks cash released against this baseline.';
  }
  return 'About this audit. Produced by RevCollect from your uploaded invoice history. The audit refreshes when you recompute and tracks cash released against this baseline.';
}

export const FIX_HABITS = [
  {
    title: 'Make day 3 inevitable',
    body: "One friendly reminder, three days after due, invoice attached, every invoice, no exceptions. Consistency is what re-sorts you in every customer's payment queue. Your model payers already treat you this way; teach the rest."
  },
  {
    title: 'Work the ten, weekly',
    body: 'Thirty minutes, the impact list above, oldest money first. Account-level conversations for multi-invoice customers, one consolidated ask, never five parallel nags.'
  },
  {
    title: 'Track every promise',
    body: '"Paying Friday" gets written down and checked on Friday. A promise that slips unwatched is free; a promise followed up the next morning is usually kept the second time.'
  }
] as const;

export function termsLabel(days: number): string {
  return `Net ${days}`;
}

export { formatDays, formatMoney, formatTrend };
