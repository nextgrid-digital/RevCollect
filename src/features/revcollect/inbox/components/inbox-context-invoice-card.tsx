'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrency, getDaysOverdueFromDueDate } from '../../utils';
import { invoiceAmountDueCents } from '../../lib/invoice-open';
import { invoicePdfPath } from '../../lib/invoice-pdf';
import type { Invoice } from '../../types';

interface InboxContextInvoiceCardProps {
  invoice: Invoice;
  isAttached?: boolean;
  onToggle?: () => void;
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
  onToggle
}: InboxContextInvoiceCardProps) {
  const daysOverdue = getDaysOverdueFromDueDate(invoice.dueDate);
  const showOverdue = daysOverdue > 0;

  return (
    <div className='bg-card w-full min-w-0 shrink-0 rounded-2xl px-3 py-2 shadow-sm ring-1 ring-border/60'>
      <div className='flex min-w-0 items-center gap-1.5'>
        <a
          href={invoicePdfPath(invoice.id)}
          target='_blank'
          rel='noopener noreferrer'
          className='hover:text-foreground/80 min-w-0 truncate text-sm font-semibold underline-offset-2 hover:underline'
          aria-label={`Preview ${invoice.number} PDF`}
          title='Preview invoice PDF'
        >
          {invoice.number}
        </a>
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
        <span
          className={cn(
            'ml-auto shrink-0 text-sm font-semibold tabular-nums',
            showOverdue ? 'text-rose-700 dark:text-rose-400' : undefined
          )}
        >
          {formatCurrency(invoiceAmountDueCents(invoice))}
        </span>
        {onToggle ? (
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className={cn(
              'size-7 shrink-0',
              isAttached
                ? 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={onToggle}
            aria-label={isAttached ? `Detach ${invoice.number}` : `Attach ${invoice.number}`}
            aria-pressed={isAttached}
            title={isAttached ? 'Remove from reply' : 'Attach invoice'}
          >
            {isAttached ? <Icons.check className='size-4' /> : <Icons.add className='size-4' />}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
