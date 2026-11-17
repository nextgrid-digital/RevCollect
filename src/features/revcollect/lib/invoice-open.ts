import { calendarDaysBetween } from '../utils';
import type { Invoice } from '../types';

export function invoiceAmountDueCents(invoice: Invoice): number {
  if (invoice.xeroStatus === 'CREDIT') return 0;
  if (typeof invoice.amountDueCents === 'number') return invoice.amountDueCents;
  return invoice.amountCents;
}

export function isCreditNoteInvoice(invoice: Invoice): boolean {
  return invoice.xeroStatus === 'CREDIT';
}

export function isOpenCanonicalInvoice(invoice: Invoice): boolean {
  if (isCreditNoteInvoice(invoice)) return false;
  return invoiceAmountDueCents(invoice) > 0;
}

export function isPaidCanonicalInvoice(invoice: Invoice): boolean {
  if (isCreditNoteInvoice(invoice)) return false;
  if (invoice.xeroStatus === 'PAID') return true;
  return invoiceAmountDueCents(invoice) <= 0 && (invoice.paidCents ?? 0) > 0;
}

export function creditRemainingCents(invoice: Invoice): number {
  if (!isCreditNoteInvoice(invoice)) return 0;
  return invoice.amountDueCents ?? 0;
}

/** Mean days from issue date to paid date. Zero when no paid invoice has both dates. */
export function averageCollectionDays(invoices: Invoice[]): number {
  let total = 0;
  let count = 0;
  for (const invoice of invoices) {
    if (!isPaidCanonicalInvoice(invoice)) continue;
    const issue = invoice.issueDate?.slice(0, 10);
    const paidOn = invoice.paidAt?.slice(0, 10);
    if (!issue || !paidOn) continue;
    const days = calendarDaysBetween(issue, paidOn);
    if (days < 0) continue;
    total += days;
    count += 1;
  }
  return count === 0 ? 0 : Math.round(total / count);
}
