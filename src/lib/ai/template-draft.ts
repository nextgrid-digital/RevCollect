import type { Customer, Invoice } from '@/features/revcollect/types';
import { invoiceAmountDueCents } from '@/features/revcollect/lib/invoice-open';
import { formatCurrencyWhole } from '@/features/revcollect/utils';

export function templateFollowUpDraft(input: {
  customer: Customer;
  invoices: Invoice[];
  greeting?: string;
  signoff?: string;
}): string {
  const { customer, invoices, greeting, signoff } = input;
  const invoiceList = invoices
    .map(
      (invoice) =>
        `${invoice.number} (${formatCurrencyWhole(invoiceAmountDueCents(invoice))}, due ${invoice.dueDate})`
    )
    .join(', ');
  const hello = greeting?.trim() || `Hi ${customer.name}`;
  const close = signoff?.trim() || 'Thank you';
  const overdue =
    customer.daysOverdue > 0 ? `${customer.daysOverdue} days past due` : 'currently outstanding';

  return [
    `${hello},`,
    '',
    `Following up on ${invoiceList || 'your open invoice(s)'} totaling ${formatCurrencyWhole(customer.balanceCents)}, ${overdue}.`,
    'Please let us know if you need anything to process payment.',
    '',
    close
  ].join('\n');
}
