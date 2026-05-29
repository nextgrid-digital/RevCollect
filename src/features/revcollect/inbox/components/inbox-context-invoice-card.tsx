import { cn } from '@/lib/utils';
import { formatCurrency, formatDate, getDaysOverdueFromDueDate } from '../../utils';
import type { Invoice } from '../../types';

interface InboxContextInvoiceCardProps {
  invoice: Invoice;
}

function getOverdueBadgeClass(daysOverdue: number): string {
  if (daysOverdue >= 45) {
    return 'bg-red-600 text-white';
  }
  if (daysOverdue >= 30) {
    return 'bg-amber-500 text-white';
  }
  return 'bg-amber-500/90 text-white';
}

export function InboxContextInvoiceCard({ invoice }: InboxContextInvoiceCardProps) {
  const daysOverdue = getDaysOverdueFromDueDate(invoice.dueDate);
  const showOverdue = daysOverdue > 0 && invoice.status !== 'current';

  return (
    <div className='w-full shrink-0 rounded-xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800'>
      <div className='flex items-start justify-between gap-2'>
        <span className='text-sm font-semibold'>{invoice.number}</span>
        <span
          className={cn(
            'shrink-0 text-sm font-semibold tabular-nums',
            showOverdue ? 'text-rose-700 dark:text-rose-400' : undefined
          )}
        >
          {formatCurrency(invoice.amountCents)}
        </span>
      </div>
      <div className='mt-1.5 flex flex-wrap items-center gap-1.5'>
        {showOverdue ? (
          <span
            className={cn(
              'rounded-md px-1.5 py-0.5 text-[10px] font-medium',
              getOverdueBadgeClass(daysOverdue)
            )}
          >
            {daysOverdue}d overdue
          </span>
        ) : null}
        <span className='text-muted-foreground text-[11px]'>
          Due: {formatDate(invoice.dueDate)}
        </span>
      </div>
    </div>
  );
}
