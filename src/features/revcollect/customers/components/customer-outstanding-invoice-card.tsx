'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate, getDaysOverdueFromDueDate } from '../../utils';
import type { Invoice } from '../../types';

interface CustomerOutstandingInvoiceCardProps {
  invoice: Invoice;
  followUpHref: string;
}

function getStatusDotClass(invoice: Invoice, daysOverdue: number): string {
  if (invoice.status === 'in_dispute') {
    return 'bg-amber-500';
  }

  if (daysOverdue >= 45 || invoice.status === 'overdue') {
    return 'bg-red-500';
  }

  if (daysOverdue > 0 || invoice.status === 'due_soon' || invoice.status === 'promised') {
    return 'bg-amber-500';
  }

  return 'bg-emerald-500';
}

export function CustomerOutstandingInvoiceCard({
  invoice,
  followUpHref
}: CustomerOutstandingInvoiceCardProps) {
  const daysOverdue = getDaysOverdueFromDueDate(invoice.dueDate);
  const showOverdue = daysOverdue > 0 && invoice.status !== 'current';

  return (
    <div className='bg-card flex flex-col gap-3 rounded-2xl px-4 py-3 shadow-sm ring-1 ring-border/60 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex min-w-0 flex-1 items-start gap-3'>
        <span
          className={cn(
            'mt-1.5 size-2 shrink-0 rounded-full',
            getStatusDotClass(invoice, daysOverdue)
          )}
          aria-hidden
        />
        <div className='min-w-0'>
          <p className='text-sm font-semibold'>{invoice.number}</p>
          <p className='text-muted-foreground text-xs'>
            Due: {formatDate(invoice.dueDate)}
            {showOverdue ? ` · ${daysOverdue} days overdue` : null}
          </p>
        </div>
      </div>
      <div className='flex shrink-0 items-center justify-between gap-3 sm:justify-end'>
        <span
          className={cn(
            'text-sm font-semibold tabular-nums',
            showOverdue ? 'text-red-700 dark:text-red-400' : undefined
          )}
        >
          {formatCurrency(invoice.amountCents)}
        </span>
        <Button asChild variant='outline' size='sm' className='h-8 text-xs'>
          <Link href={followUpHref}>Follow up</Link>
        </Button>
      </div>
    </div>
  );
}
