'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CustomerAvatar } from '../../components/customer-avatar';
import { StatusPill } from '../../components/status-pill';
import { InvoicesTable } from '../../components/invoices-table';
import { ActivityTimeline } from '../../components/activity-timeline';
import { formatCurrency } from '../../utils';
import { useCustomer, useInvoicesForCustomer, useTimelineForCustomer } from '../../api/queries';

interface CustomerDetailViewProps {
  customerId: string;
}

export function CustomerDetailView({ customerId }: CustomerDetailViewProps) {
  const { data: customer, isPending } = useCustomer(customerId);
  const { data: customerInvoices = [] } = useInvoicesForCustomer(customerId);
  const { data: timeline = [] } = useTimelineForCustomer(customerId);

  if (isPending) {
    return <p className='text-muted-foreground text-sm'>Loading customer…</p>;
  }

  if (!customer) {
    notFound();
  }

  return (
    <div className='space-y-8'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='flex items-start gap-4'>
          <CustomerAvatar name={customer.name} avatarUrl={customer.avatarUrl} className='size-12' />
          <div>
            <h2 className='text-xl font-semibold sm:text-2xl'>{customer.name}</h2>
            <p className='text-muted-foreground text-sm sm:text-base'>{customer.company}</p>
            <p className='text-muted-foreground text-sm'>{customer.email}</p>
            <div className='mt-2'>
              <StatusPill status={customer.status} />
            </div>
          </div>
        </div>
        <div className='text-right'>
          <p className='text-muted-foreground text-sm'>Outstanding balance</p>
          <p className='text-2xl font-semibold tabular-nums'>
            {formatCurrency(customer.balanceCents)}
          </p>
          {customer.daysOverdue > 0 ? (
            <p className='text-muted-foreground text-sm'>{customer.daysOverdue} days overdue</p>
          ) : null}
        </div>
      </div>

      <section>
        <h3 className='mb-4 text-lg font-medium'>Invoices</h3>
        <InvoicesTable invoices={customerInvoices} />
      </section>

      <section>
        <h3 className='mb-4 text-lg font-medium'>Activity</h3>
        <ActivityTimeline events={timeline} />
      </section>

      <Button asChild variant='outline'>
        <Link href='/inbox'>View in inbox</Link>
      </Button>
    </div>
  );
}
