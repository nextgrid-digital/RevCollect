import { cn } from '@/lib/utils';
import { formatCurrency, getDaysOverdueFromDueDate } from '../../utils';
import type { Invoice } from '../../types';

interface InboxContextInvoiceCardProps {
  invoice: Invoice;
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

export function InboxContextInvoiceCard({ invoice }: InboxContextInvoiceCardProps) {
  const daysOverdue = getDaysOverdueFromDueDate(invoice.dueDate);
  const showOverdue = daysOverdue > 0 && invoice.status !== 'current';

  return (
    <div className='w-full shrink-0 rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800'>
      <div className='flex items-center justify-between gap-2'>
        <div className='flex min-w-0 items-center gap-1.5'>
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
        <span
          className={cn(
            'shrink-0 text-sm font-semibold tabular-nums',
            showOverdue ? 'text-rose-700 dark:text-rose-400' : undefined
          )}
        >
          {formatCurrency(invoice.amountCents)}
        </span>
      </div>
    </div>
  );
}
