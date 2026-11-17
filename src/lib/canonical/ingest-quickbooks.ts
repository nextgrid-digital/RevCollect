import { mapLedgerCustomers, mapLedgerInvoice } from '@/features/revcollect/api/xero-map';
import { applyOpenArSnapshot } from './apply-open-ar';
import { remapOpenArIds } from './ledger-entity-id';
import { fetchQuickBooksAccountsReceivable } from '@/lib/integrations/quickbooks-api';
import type { CanonicalPayment, CanonicalSnapshot } from './types';

function quickBooksInvoiceEmailedAt(invoice: {
  EmailStatus?: string;
  TxnDate?: string;
  DeliveryInfo?: { DeliveryTime?: string };
}): string | undefined {
  if (invoice.EmailStatus !== 'EmailSent') return undefined;
  if (invoice.DeliveryInfo?.DeliveryTime) return invoice.DeliveryInfo.DeliveryTime;
  if (invoice.TxnDate) return `${invoice.TxnDate}T12:00:00.000Z`;
  return undefined;
}

function toCents(amount: number | undefined): number {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return 0;
  return Math.round(amount * 100);
}

export async function ingestQuickBooksAr(tenantId: string): Promise<CanonicalSnapshot> {
  const {
    customers: rawCustomers,
    invoices: rawInvoices,
    payments: rawPayments
  } = await fetchQuickBooksAccountsReceivable(tenantId);

  const invoices = rawInvoices.flatMap((invoice) => {
    const customerId = invoice.CustomerRef?.value;
    if (!customerId || !invoice.Id) return [];
    const amountDueCents = toCents(invoice.Balance);
    const amountCents = toCents(invoice.TotalAmt ?? invoice.Balance);
    return [
      mapLedgerInvoice({
        id: invoice.Id,
        customerId,
        number: invoice.DocNumber ?? invoice.Id,
        amountCents,
        amountDueCents,
        paidCents: Math.max(0, amountCents - amountDueCents),
        dueDate: invoice.DueDate ?? invoice.TxnDate ?? new Date().toISOString().slice(0, 10),
        issueDate: invoice.TxnDate,
        ledgerEmailedAt: quickBooksInvoiceEmailedAt(invoice),
        billEmail: invoice.BillEmail?.Address,
        ledgerStatus: amountDueCents > 0 ? 'AUTHORISED' : 'PAID',
        currency: invoice.CurrencyRef?.value
      })
    ];
  });

  const contacts = rawCustomers.map((customer) => {
    const displayName = customer.DisplayName?.trim();
    const fullyQualified = (customer as { FullyQualifiedName?: string }).FullyQualifiedName?.trim();
    const companyName = customer.CompanyName?.trim();
    const label =
      fullyQualified && fullyQualified.includes(':')
        ? fullyQualified
        : displayName || fullyQualified || companyName || 'Customer';
    return {
      id: customer.Id,
      name: label,
      email: customer.PrimaryEmailAddr?.Address ?? '',
      company: label
    };
  });
  const customers = mapLedgerCustomers(contacts, invoices);
  const payments: CanonicalPayment[] = rawPayments.flatMap((payment) => {
    const customerId = payment.CustomerRef?.value;
    const amountCents = toCents(payment.TotalAmt);
    if (!payment.Id || !customerId || amountCents <= 0) return [];
    const invoiceId = payment.Line?.flatMap((line) => line.LinkedTxn ?? []).find(
      (txn) => txn.TxnType === 'Invoice'
    )?.TxnId;
    return [
      {
        id: payment.Id,
        customerId,
        invoiceId,
        amountCents,
        paidAt: payment.TxnDate ?? new Date().toISOString().slice(0, 10),
        externalId: payment.Id
      }
    ];
  });

  return applyOpenArSnapshot(tenantId, remapOpenArIds(tenantId, { customers, invoices, payments }));
}
