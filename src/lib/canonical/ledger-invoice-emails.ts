import type { Customer, Invoice, ThreadEmail } from '@/features/revcollect/types';

function emailedAtIso(invoice: Invoice): string | null {
  const raw = invoice.ledgerEmailedAt;
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

/** Ledger-sent invoice emails, shown in the customer thread even when Gmail never received them. */
export function ledgerInvoiceThreadEmails(
  customers: Customer[],
  invoices: Invoice[]
): ThreadEmail[] {
  const customerById = new Map(customers.map((customer) => [customer.id, customer]));
  const emails: ThreadEmail[] = [];

  for (const invoice of invoices) {
    const sentAt = emailedAtIso(invoice);
    const customer = customerById.get(invoice.customerId);
    if (!sentAt || !customer) continue;
    const to = invoice.billEmail?.trim() || customer.email.trim();
    const when = new Date(sentAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    emails.push({
      id: `ledger-invoice-${invoice.id}`,
      threadId: `xero-customer-${customer.id}`,
      customerId: customer.id,
      author: 'agent',
      from: 'Accounting',
      to: to.includes('@') ? [to] : [],
      subject: `Invoice ${invoice.number}`,
      body: `Your books emailed invoice ${invoice.number} to ${to || 'the customer'} on ${when}. That send came from the ledger, so this is the record of it. The original wording is included below only when a copy also exists in Gmail.`,
      sentAt
    });
  }

  return emails;
}

/** Drop the ledger stub when the same invoice number is already in a real Gmail message. */
export function omitLedgerEmailsAlreadyInGmail(emails: ThreadEmail[]): ThreadEmail[] {
  const gmail = emails.filter((email) => !email.id.startsWith('ledger-invoice-'));
  return emails.filter((email) => {
    if (!email.id.startsWith('ledger-invoice-')) return true;
    const number = email.subject.replace(/^invoice\s+/i, '').trim();
    if (!number) return true;
    return !gmail.some((message) => {
      if (message.customerId !== email.customerId) return false;
      const haystack = `${message.subject}\n${message.body}`;
      return haystack.includes(number);
    });
  });
}
