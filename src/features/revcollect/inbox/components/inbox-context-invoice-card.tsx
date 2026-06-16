'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrency, getDaysOverdueFromDueDate } from '../../utils';
import type { Invoice } from '../../types';

interface InboxContextInvoiceCardProps {
  invoice: Invoice;
  isAttached?: boolean;
  onAttach?: () => void;
}

const overduePillClasses = {
  severe: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
  moderate: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
  mild: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300'
} as const;

function getOverduePillClass(daysOverdue: number): string {
  if (daysOverdue >= 45) {
    return overduePillClasses.severe;
  }
  if (daysOverdue >= 30) {
    return overduePillClasses.moderate;
  }
  return overduePillClasses.mild;
}

export function InboxContextInvoiceCard({
  invoice,
  isAttached = false,
  onAttach
}: InboxContextInvoiceCardProps) {
  const daysOverdue = getDaysOverdueFromDueDate(invoice.dueDate);
  const showOverdue = daysOverdue > 0 && invoice.status !== 'current';

  return (
    <div className='w-full shrink-0 rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800'>
      <div className='flex items-center justify-between gap-2'>
        <div className='flex min-w-0 flex-1 items-center gap-1.5'>
          <span className='shrink-0 text-sm font-semibold'>{invoice.number}</span>
          {showOverdue ? (
            <span
              className={cn(
                'inline-flex shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                getOverduePillClass(daysOverdue)
              )}
            >
              {daysOverdue}d
            </span>
          ) : null}
        </div>
        <div className='flex shrink-0 items-center gap-2'>
          <span
            className={cn(
              'text-sm font-semibold tabular-nums',
              showOverdue ? 'text-rose-700 dark:text-rose-400' : undefined
            )}
          >
            {formatCurrency(invoice.amountCents)}
          </span>
          {onAttach !== undefined ? (
            isAttached ? (
              <span
                className='text-emerald-600 flex size-7 items-center justify-center dark:text-emerald-400'
                aria-label={`${invoice.number} attached`}
                title='Attached'
              >
                <Icons.check className='size-4' />
              </span>
            ) : onAttach ? (
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='text-muted-foreground hover:text-foreground size-7'
                onClick={onAttach}
                aria-label={`Attach ${invoice.number}`}
                title='Attach invoice'
              >
                <Icons.add className='size-4' />
              </Button>
            ) : null
          ) : null}
        </div>
      </div>
    </div>
  );
}
