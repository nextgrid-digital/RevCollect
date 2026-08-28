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
