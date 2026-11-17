import { invoiceAmountDueCents, isOpenCanonicalInvoice } from './invoice-open';
import type { Invoice } from '../types';

export function invoiceCurrencyCode(invoice: Invoice): string {
  const code = invoice.currency?.trim().toUpperCase();
  return code && /^[A-Z]{3}$/.test(code) ? code : 'USD';
}

/** Largest open balance wins. Other currencies are left out of that total. */
export function dominantOpenCurrency(invoices: Invoice[]): { code: string; mixed: boolean } {
  const totals = new Map<string, number>();
  for (const invoice of invoices) {
    if (!isOpenCanonicalInvoice(invoice)) continue;
    const code = invoiceCurrencyCode(invoice);
    totals.set(code, (totals.get(code) ?? 0) + invoiceAmountDueCents(invoice));
  }
  if (totals.size === 0) return { code: 'USD', mixed: false };
  let code = 'USD';
  let best = -1;
  for (const [key, value] of totals) {
    if (value > best) {
      best = value;
      code = key;
    }
  }
  return { code, mixed: totals.size > 1 };
}
