'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CustomerAvatar } from '../../components/customer-avatar';
import { StatusPill } from '../../components/status-pill';
import { InvoiceCard } from '../../components/invoice-card';
import { ActivityTimeline } from '../../components/activity-timeline';
import { formatCurrency } from '../../utils';
import {
  getCustomerById,
  getInvoicesForCustomer,
  getTimelineForCustomer
} from '../../mock-data';

interface CustomerDetailViewProps {
  customerId: string;
}

export function CustomerDetailView({ customerId }: CustomerDetailViewProps) {
  const customer = getCustomerById(customerId);

  if (!customer) {
    notFound();
  }

  const customerInvoices = getInvoicesForCustomer(customerId);
  const timeline = getTimelineForCustomer(customerId);

  return (
    <div className='space-y-8'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='flex items-start gap-4'>
          <CustomerAvatar
            name={customer.name}
            avatarUrl={customer.avatarUrl}
            className='size-12'
          />
          <div>
            <h2 className='text-xl font-semibold sm:text-2xl'>{customer.name}</h2>
            <p className='text-muted-foreground text-sm sm:text-base'>{customer.company}</p>
            <p className='text-muted-foreground text-sm'>{customer.email}</p>
            <div className='mt-2'>
              <StatusPill status={customer.status} />
            </div>
          </div>
        </div>
        <div className='mt-3 w-full text-left sm:mt-0 sm:w-auto sm:text-right'>
          <p className='text-muted-foreground text-sm'>Outstanding balance</p>
          <p className='text-2xl font-semibold tabular-nums'>
            {formatCurrency(customer.balanceCents)}
          </p>
        </div>
      </div>

      <div className='grid gap-8 lg:grid-cols-2'>
        <section>
          <h3 className='mb-4 text-lg font-medium'>Invoices</h3>
          <div className='space-y-2'>
            {customerInvoices.length === 0 ? (
              <p className='text-muted-foreground text-sm'>No invoices on file.</p>
            ) : (
              customerInvoices.map((invoice) => (
                <InvoiceCard key={invoice.id} invoice={invoice} />
              ))
            )}
          </div>
        </section>

        <section>
          <h3 className='mb-4 text-lg font-medium'>Activity</h3>
          <ActivityTimeline events={timeline} />
        </section>
      </div>

      <Button asChild variant='outline'>
        <Link href='/inbox'>Back to inbox</Link>
      </Button>
    </div>
  );
}
