import Link from 'next/link';
import { StatusPill } from './status-pill';
import { formatCurrency, formatDate } from '../utils';
import type { Invoice } from '../types';
import { getCustomerById } from '../mock-data';

interface InvoiceCardProps {
  invoice: Invoice;
  showCustomer?: boolean;
}

export function InvoiceCard({ invoice, showCustomer = false }: InvoiceCardProps) {
  const customer = showCustomer ? getCustomerById(invoice.customerId) : undefined;

  return (
    <div className='flex items-center justify-between gap-4 rounded-lg border p-3'>
      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <span className='font-medium'>{invoice.number}</span>
          <StatusPill status={invoice.status} />
        </div>
        {showCustomer && customer ? (
          <Link
            href={`/customers/${customer.id}`}
            className='text-muted-foreground hover:text-foreground mt-1 block text-sm underline-offset-4 hover:underline'
          >
            {customer.company}
          </Link>
        ) : null}
        <p className='text-muted-foreground mt-1 text-xs'>Due {formatDate(invoice.dueDate)}</p>
      </div>
      <p className='shrink-0 text-sm font-semibold tabular-nums'>
        {formatCurrency(invoice.amountCents)}
      </p>
    </div>
  );
}
