import { invoiceAmountDueCents, isOpenCanonicalInvoice } from './invoice-open';
import type { Customer, Invoice } from '../types';

export const SMALL_BALANCE_CENTS = 1_000;
export const CONCENTRATION_SHARE = 0.25;

export function isSmallOpenBalance(cents: number): boolean {
  return cents > 0 && cents < SMALL_BALANCE_CENTS;
}

export function chaseBalanceCents(customerId: string, invoices: Invoice[]): number {
  let total = 0;
  for (const invoice of invoices) {
    if (invoice.customerId !== customerId || !isOpenCanonicalInvoice(invoice)) continue;
    const due = invoiceAmountDueCents(invoice);
    if (due < SMALL_BALANCE_CENTS) continue;
    total += due;
  }
  return total;
}

export function concentrationLine(customers: Customer[]): string | null {
  const open = customers.filter((customer) => customer.balanceCents > 0);
  const total = open.reduce((sum, customer) => sum + customer.balanceCents, 0);
  if (total <= 0) return null;
  let top = open[0];
  for (const customer of open) {
    if (customer.balanceCents > top.balanceCents) top = customer;
  }
  if (top.balanceCents / total <= CONCENTRATION_SHARE) return null;
  const percent = Math.round((top.balanceCents / total) * 100);
  return `${top.company} is ${percent}% of open AR.`;
}
