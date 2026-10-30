import type { Customer, Invoice } from '@/features/revcollect/types';
import { isOpenCanonicalInvoice } from '@/features/revcollect/lib/invoice-open';

const LOOKBACK_MS = 365 * 24 * 60 * 60 * 1000;

function invoiceAnchorMs(invoice: Invoice): number | null {
  const raw = invoice.issueDate ?? invoice.dueDate;
  if (!raw) return null;
  const ms = Date.parse(raw.length <= 10 ? `${raw.slice(0, 10)}T00:00:00.000Z` : raw);
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Start of Gmail history for an open-AR customer.
 * Oldest open invoice date, and never more than 365 days ago.
 * Null when the customer has no open invoice to anchor the window.
 */
export function openArMailSince(
  customer: Customer,
  invoices: Invoice[],
  nowMs: number = Date.now()
): string | null {
  if (customer.balanceCents <= 0) return null;
  let oldest: number | null = null;
  for (const invoice of invoices) {
    if (invoice.customerId !== customer.id || !isOpenCanonicalInvoice(invoice)) continue;
    const anchor = invoiceAnchorMs(invoice);
    if (anchor === null) continue;
    if (oldest === null || anchor < oldest) oldest = anchor;
  }
  if (oldest === null) return null;
  return new Date(Math.max(oldest, nowMs - LOOKBACK_MS)).toISOString();
}

/** Emails that belong to exactly one customer with an open balance. */
export function uniqueOpenCustomerEmails(customers: Customer[]): Set<string> {
  const counts = new Map<string, number>();
  for (const customer of customers) {
    if (customer.balanceCents <= 0) continue;
    const email = customer.email.trim().toLowerCase();
    if (!email.includes('@')) continue;
    counts.set(email, (counts.get(email) ?? 0) + 1);
  }
  const unique = new Set<string>();
  for (const [email, count] of counts) {
    if (count === 1) unique.add(email);
  }
  return unique;
}
