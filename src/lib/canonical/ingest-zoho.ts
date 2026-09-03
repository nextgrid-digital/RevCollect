import { mapLedgerCustomers, mapLedgerInvoice } from '@/features/revcollect/api/xero-map';
import { applyOpenArSnapshot } from './apply-open-ar';
import { fetchZohoAccountsReceivable } from '@/lib/integrations/zoho-api';
import type { CanonicalPayment, CanonicalSnapshot } from './types';

function toCents(amount: number | undefined): number {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return 0;
  return Math.round(amount * 100);
}

export async function ingestZohoAr(tenantId: string): Promise<CanonicalSnapshot> {
  const {
    contacts: rawContacts,
    invoices: rawInvoices,
    payments: rawPayments
  } = await fetchZohoAccountsReceivable(tenantId);

  const invoices = rawInvoices.flatMap((invoice) => {
    if (!invoice.invoice_id || !invoice.customer_id) return [];
    const amountDueCents = toCents(invoice.balance);
    const amountCents = toCents(invoice.total ?? invoice.balance);
    const unpaid = amountDueCents > 0;
    return [
      mapLedgerInvoice({
        id: invoice.invoice_id,
        customerId: invoice.customer_id,
        number: invoice.invoice_number ?? invoice.invoice_id,
        amountCents,
        amountDueCents,
        paidCents: Math.max(0, amountCents - amountDueCents),
        dueDate: invoice.due_date ?? invoice.date ?? new Date().toISOString().slice(0, 10),
        issueDate: invoice.date,
        ledgerStatus: unpaid ? 'AUTHORISED' : 'PAID'
      })
    ];
  });

  const contacts = rawContacts.map((contact) => ({
    id: contact.contact_id,
    name: contact.contact_name ?? 'Customer',
    email: contact.email ?? '',
    company: contact.company_name ?? contact.contact_name
  }));
  const customers = mapLedgerCustomers(contacts, invoices);
  const payments: CanonicalPayment[] = rawPayments.flatMap((payment) => {
    const amountCents = toCents(payment.amount);
    if (!payment.payment_id || !payment.customer_id || amountCents <= 0) return [];
    return [
      {
        id: payment.payment_id,
        customerId: payment.customer_id,
        invoiceId: payment.invoices?.[0]?.invoice_id,
        amountCents,
        paidAt: `${payment.date ?? new Date().toISOString().slice(0, 10)}T00:00:00.000Z`,
        externalId: payment.payment_id
      }
    ];
  });

  return applyOpenArSnapshot(tenantId, { customers, invoices, payments });
}
