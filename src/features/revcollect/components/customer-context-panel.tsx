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
          ? 'text-muted-foreground px-2 pt-2 pb-0.5 text-[11px] font-medium'
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
    <div className='hover:bg-muted/60 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs'>
      {Icon ? <Icon className='text-muted-foreground size-3.5 shrink-0 opacity-70' /> : null}
      <span className='text-muted-foreground min-w-0 flex-1 truncate'>{label}</span>
      {value != null ? (
        <span className={cn('shrink-0 text-right font-medium tabular-nums', valueClassName)}>
          {value}
        </span>
      ) : null}
    </div>
  );
}

function CustomerContextPanelFloating({
  customer,
  threadSubject,
  threadSummary
}: {
  customer: Customer;
  threadSubject?: string;
  threadSummary?: string;
}) {
  const showThreadSummary = Boolean(threadSubject && threadSummary);
  const customerInvoices = getInvoicesForCustomer(customer.id).slice(0, 2);

  return (
    <div className='flex max-h-[min(70vh,28rem)] min-h-0 flex-col'>
      <div className='border-border/60 flex shrink-0 items-center justify-between border-b px-3 py-2'>
        <span className='text-xs font-medium'>Customer</span>
        <Icons.settings className='text-muted-foreground size-3.5 opacity-60' />
      </div>

      <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 py-1'>
        <div className='flex items-center gap-2 px-2 py-1.5'>
          <CustomerAvatar
            name={customer.name}
            avatarUrl={customer.avatarUrl}
            className='size-7 shrink-0'
          />
          <div className='min-w-0 flex-1'>
            <p className='truncate text-xs font-semibold'>{customer.name}</p>
            <p className='text-muted-foreground truncate text-[11px]'>{customer.company}</p>
          </div>
          <StatusPill status={customer.status} className='h-5 px-1.5 text-[10px]' />
        </div>

        <FloatingRailRow icon={Icons.user} label={customer.email} />
        <FloatingRailRow
          icon={Icons.aging}
          label='Balance'
          value={formatCurrency(customer.balanceCents)}
        />
        {customer.daysOverdue > 0 ? (
          <FloatingRailRow
            icon={Icons.warning}
            label='Days overdue'
            value={customer.daysOverdue}
            valueClassName='text-destructive'
          />
        ) : null}

        {showThreadSummary ? (
          <>
            <SectionLabel floating>Summary</SectionLabel>
            <div className='px-2 pb-1'>
              {threadSubject ? (
                <p className='truncate text-[11px] font-medium'>{threadSubject}</p>
              ) : null}
              <p className='text-muted-foreground mt-0.5 text-[11px] leading-snug whitespace-pre-wrap break-words'>
                {threadSummary}
              </p>
            </div>
          </>
        ) : null}

        <SectionLabel floating>Open invoices</SectionLabel>
        {customerInvoices.length === 0 ? (
          <p className='text-muted-foreground px-2 py-1 text-[11px]'>No open invoices.</p>
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
      </div>

      <div className='border-border/60 shrink-0 border-t p-2'>
        <Button asChild className='h-7 w-full text-xs' variant='ghost' size='sm'>
          <Link href={`/customers/${customer.id}`} className='gap-1.5'>
            View customer
            <Icons.externalLink className='size-3' />
          </Link>
        </Button>
      </div>
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
    return (
      <CustomerContextPanelFloating
        customer={customer}
        threadSubject={threadSubject}
        threadSummary={threadSummary}
      />
    );
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
