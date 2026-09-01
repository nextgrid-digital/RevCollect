import type { Customer, Invoice } from '@/features/revcollect/types';
import { invoiceAmountDueCents } from '@/features/revcollect/lib/invoice-open';
import { formatCurrencyWhole } from '@/features/revcollect/utils';

export function templateFollowUpDraft(input: {
  customer: Customer;
  invoices: Invoice[];
  greeting?: string;
  signoff?: string;
  promisedDate?: string;
}): string {
  const { customer, invoices, greeting, signoff, promisedDate } = input;
  const invoiceList = invoices
    .map(
      (invoice) =>
        `${invoice.number} (${formatCurrencyWhole(invoiceAmountDueCents(invoice))}, due ${invoice.dueDate})`
    )
    .join(', ');
  const hello = greeting?.trim() || `Hi ${customer.name}`;
  const close = signoff?.trim() || 'Thank you';
  const totals = `${invoiceList || 'your open invoice(s)'} totaling ${formatCurrencyWhole(customer.balanceCents)}`;

  if (promisedDate) {
    return [
      `${hello},`,
      '',
      `We had your note that payment would arrive by ${promisedDate}. That date has passed, and the balance is still open.`,
      `Open invoices: ${totals}.`,
      'Please let us know if you need anything to process payment.',
      '',
      close
    ].join('\n');
  }

  const overdue =
    customer.daysOverdue > 0 ? `${customer.daysOverdue} days past due` : 'currently outstanding';

  return [
    `${hello},`,
    '',
    `Following up on ${totals}, ${overdue}.`,
    'Please let us know if you need anything to process payment.',
    '',
    close
  ].join('\n');
}

export function templatePaymentVerificationDraft(input: {
  customer: Customer;
  invoices: Invoice[];
  greeting?: string;
  signoff?: string;
}): string {
  const { customer, invoices, greeting, signoff } = input;
  const hello = greeting?.trim() || `Hi ${customer.name}`;
  const close = signoff?.trim() || 'Thank you';
  const invoiceList = invoices.map((invoice) => invoice.number).join(', ');

  return [
    `${hello},`,
    '',
    'Thank you — we saw your note that payment was sent.',
    `To match it against ${invoiceList || 'the open invoice(s)'}, please share a payment reference or remittance advice when you can.`,
    '',
    close
  ].join('\n');
}
