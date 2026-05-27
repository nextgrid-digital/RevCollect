import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CustomerAvatar } from './customer-avatar';
import { InvoiceCard } from './invoice-card';
import { StatusPill } from './status-pill';
import { formatCurrency } from '../utils';
import type { Customer } from '../types';
import { getInvoicesForCustomer } from '../mock-data';

interface CustomerContextPanelProps {
  customer: Customer;
}

export function CustomerContextPanel({ customer }: CustomerContextPanelProps) {
  const customerInvoices = getInvoicesForCustomer(customer.id).slice(0, 3);

  return (
    <div className='flex h-full flex-col'>
      <div className='flex items-start gap-3 p-4'>
        <CustomerAvatar name={customer.name} avatarUrl={customer.avatarUrl} className='size-10' />
        <div className='min-w-0 flex-1'>
          <p className='truncate font-semibold'>{customer.name}</p>
          <p className='text-muted-foreground truncate text-sm'>{customer.company}</p>
          <div className='mt-2'>
            <StatusPill status={customer.status} />
          </div>
        </div>
      </div>

      <Separator />

      <div className='space-y-3 p-4'>
        <div>
          <p className='text-muted-foreground text-xs uppercase tracking-wide'>Balance</p>
          <p className='text-xl font-semibold tabular-nums'>
            {formatCurrency(customer.balanceCents)}
          </p>
        </div>
        {customer.daysOverdue > 0 ? (
          <div>
            <p className='text-muted-foreground text-xs uppercase tracking-wide'>Days overdue</p>
            <p className='text-destructive text-lg font-semibold'>{customer.daysOverdue}</p>
          </div>
        ) : null}
      </div>

      <Separator />

      <div className='flex-1 space-y-2 overflow-auto p-4'>
        <p className='text-sm font-medium'>Open invoices</p>
        {customerInvoices.length === 0 ? (
          <p className='text-muted-foreground text-sm'>No open invoices.</p>
        ) : (
          customerInvoices.map((invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} />
          ))
        )}
      </div>

      <div className='border-t p-4'>
        <Button asChild className='w-full' variant='outline' size='sm'>
          <Link href={`/customers/${customer.id}`}>View customer</Link>
        </Button>
      </div>
    </div>
  );
}
