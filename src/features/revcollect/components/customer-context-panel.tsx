import type { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { CustomerAvatar } from './customer-avatar';
import { InvoiceCard } from './invoice-card';
import { StatusPill } from './status-pill';
import { formatCurrency } from '../utils';
import type { Customer } from '../types';
import { getInvoicesForCustomer } from '../mock-data';

type CustomerContextPanelLayout = 'default' | 'floating';

interface CustomerContextPanelProps {
  customer: Customer;
  threadSubject?: string;
  threadSummary?: string;
  layout?: CustomerContextPanelLayout;
}

function SectionLabel({ children, floating }: { children: ReactNode; floating?: boolean }) {
  return (
    <p
      className={cn(
        floating
          ? 'text-muted-foreground px-3 pt-3 pb-1 text-sm font-medium'
          : 'text-muted-foreground text-xs uppercase tracking-wide'
      )}
    >
      {children}
    </p>
  );
}

function FloatingRailRow({
  icon: Icon,
  label,
  value,
  valueClassName
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: ReactNode;
  value?: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className='hover:bg-muted/60 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm'>
      {Icon ? <Icon className='text-muted-foreground size-4 shrink-0 opacity-70' /> : null}
      <span className='text-muted-foreground min-w-0 flex-1 truncate'>{label}</span>
      {value != null ? (
        <span className={cn('shrink-0 text-right font-medium tabular-nums', valueClassName)}>
          {value}
        </span>
      ) : null}
    </div>
  );
}

export function CustomerContextPanelFloatingHeader({ customer }: { customer: Customer }) {
  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-3'>
        <CustomerAvatar
          name={customer.name}
          avatarUrl={customer.avatarUrl}
          className='size-10 shrink-0'
        />
        <div className='min-w-0 flex-1'>
          <p className='truncate text-sm font-semibold'>{customer.name}</p>
          <p className='text-muted-foreground truncate text-sm'>{customer.company}</p>
        </div>
      </div>
      <Button asChild className='w-full rounded-full' variant='outline' size='sm'>
        <Link href={`/customers/${customer.id}`} className='gap-1.5'>
          View customer
          <Icons.externalLink className='size-3.5' />
        </Link>
      </Button>
    </div>
  );
}

export function CustomerContextPanelFloatingBody({ customer }: { customer: Customer }) {
  const customerInvoices = getInvoicesForCustomer(customer.id).slice(0, 2);

  return (
    <div className='flex max-h-[min(70vh,28rem)] min-h-0 flex-col'>
      <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2'>
        <SectionLabel floating>Open invoices</SectionLabel>
        {customerInvoices.length === 0 ? (
          <p className='text-muted-foreground px-3 py-2 text-sm'>No open invoices.</p>
        ) : (
          customerInvoices.map((invoice) => (
            <FloatingRailRow
              key={invoice.id}
              icon={Icons.post}
              label={invoice.number}
              value={formatCurrency(invoice.amountCents)}
            />
          ))
        )}

        <FloatingRailRow
          icon={Icons.aging}
          label='Balance'
          value={formatCurrency(customer.balanceCents)}
        />
        <div className='flex items-center justify-between gap-2 px-3 py-2'>
          <span className='text-muted-foreground text-sm'>Status</span>
          <StatusPill status={customer.status} />
        </div>
      </div>
    </div>
  );
}

function CustomerContextPanelFloating({ customer }: { customer: Customer }) {
  return (
    <div className='flex min-h-0 flex-col'>
      <CustomerContextPanelFloatingHeader customer={customer} />
      <CustomerContextPanelFloatingBody customer={customer} />
    </div>
  );
}

export function CustomerContextPanel({
  customer,
  threadSubject,
  threadSummary,
  layout = 'default'
}: CustomerContextPanelProps) {
  if (layout === 'floating') {
    return <CustomerContextPanelFloating customer={customer} />;
  }

  const showThreadSummary = Boolean(threadSubject && threadSummary);
  const customerInvoices = getInvoicesForCustomer(customer.id).slice(0, 3);

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <div className='flex items-start gap-3 p-4'>
        <CustomerAvatar name={customer.name} avatarUrl={customer.avatarUrl} className='size-10' />
        <div className='min-w-0 flex-1'>
          <p className='truncate font-semibold'>{customer.name}</p>
          <p className='text-muted-foreground truncate text-sm'>{customer.email}</p>
          <p className='text-muted-foreground truncate text-sm'>{customer.company}</p>
          <div className='mt-2'>
            <StatusPill status={customer.status} />
          </div>
        </div>
      </div>

      {showThreadSummary ? (
        <>
          <div className='px-4 py-3'>
            <p className='text-muted-foreground mb-1 text-xs font-medium'>Summary</p>
            {threadSubject ? (
              <p className='truncate text-xs font-semibold'>{threadSubject}</p>
            ) : null}
            <p className='text-muted-foreground mt-1 line-clamp-3 text-xs leading-relaxed'>
              {threadSummary}
            </p>
          </div>
          <Separator />
        </>
      ) : null}

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
          customerInvoices.map((invoice) => <InvoiceCard key={invoice.id} invoice={invoice} />)
        )}
      </div>

      <div className='bg-background sticky bottom-0 border-t p-4'>
        <Button asChild className='w-full' variant='outline' size='sm'>
          <Link href={`/customers/${customer.id}`}>View customer</Link>
        </Button>
      </div>
    </div>
  );
}
