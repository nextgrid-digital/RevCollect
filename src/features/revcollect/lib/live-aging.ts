import { deriveCustomerStatus, isCollectionOverrideStatus } from './collection-decision';
import { invoiceAmountDueCents, isOpenCanonicalInvoice } from './invoice-open';
import type { AgingBucket, Customer, Invoice } from '../types';
import { getDaysOverdueFromDueDate } from '../utils';

export function agingBucketFromDays(daysOverdue: number): AgingBucket {
  if (daysOverdue <= 0) return 'current';
  if (daysOverdue <= 30) return '1-30';
  if (daysOverdue <= 60) return '31-60';
  if (daysOverdue <= 90) return '61-90';
  return '90+';
}

/** Recompute invoice agingBucket from dueDate as of today. */
export function withLiveInvoiceAging(invoice: Invoice, asOf: Date = new Date()): Invoice {
  const amountDue = invoiceAmountDueCents(invoice);
  const daysOverdue =
    amountDue > 0 && isOpenCanonicalInvoice(invoice)
      ? getDaysOverdueFromDueDate(invoice.dueDate, asOf)
      : 0;
  const agingBucket = agingBucketFromDays(daysOverdue);
  if (invoice.agingBucket === agingBucket) return invoice;
  return { ...invoice, agingBucket };
}

/** Max open-invoice days overdue for a customer as of today. */
export function liveCustomerDaysOverdue(
  customerId: string,
  invoices: Invoice[],
  asOf: Date = new Date()
): number {
  return invoices
    .filter((invoice) => invoice.customerId === customerId)
    .filter(isOpenCanonicalInvoice)
    .reduce((max, invoice) => Math.max(max, getDaysOverdueFromDueDate(invoice.dueDate, asOf)), 0);
}

/**
 * Refresh denormalized aging fields from due dates so lists/dashboard/agent
 * stay correct between book syncs.
 */
export function withLiveAging<T extends { customers: Customer[]; invoices: Invoice[] }>(
  data: T,
  asOf: Date = new Date()
): T {
  const invoices = data.invoices.map((invoice) => withLiveInvoiceAging(invoice, asOf));
  const customers = data.customers.map((customer) => {
    const daysOverdue = liveCustomerDaysOverdue(customer.id, invoices, asOf);
    const nextStatus = isCollectionOverrideStatus(customer.status)
      ? customer.status
      : deriveCustomerStatus(customer.balanceCents, daysOverdue);
    if (customer.daysOverdue === daysOverdue && customer.status === nextStatus) {
      return customer;
    }
    return { ...customer, daysOverdue, status: nextStatus };
  });
  return { ...data, customers, invoices };
}
