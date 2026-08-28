import { calendarDaysBetween, formatCurrency, formatDate } from '../../utils';
import type { Invoice } from '../../types';

interface CustomerPaidInvoiceCardProps {
  invoice: Invoice;
}

export function CustomerPaidInvoiceCard({ invoice }: CustomerPaidInvoiceCardProps) {
  const paidOn = invoice.paidAt ? invoice.paidAt.slice(0, 10) : undefined;
  const daysVsDue = paidOn ? calendarDaysBetween(invoice.dueDate, paidOn) : 0;
  const timingLabel = !paidOn
    ? 'Paid'
    : daysVsDue === 0
      ? 'Paid on due date'
      : daysVsDue < 0
        ? `Paid ${Math.abs(daysVsDue)} day${Math.abs(daysVsDue) === 1 ? '' : 's'} early`
        : `Paid ${daysVsDue} day${daysVsDue === 1 ? '' : 's'} after due`;

  return (
    <div className='bg-card flex flex-col gap-3 rounded-2xl px-4 py-3 shadow-sm ring-1 ring-border/60 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex min-w-0 flex-1 items-start gap-3'>
        <span className='mt-1.5 size-2 shrink-0 rounded-full bg-emerald-500' aria-hidden />
        <div className='min-w-0'>
          <p className='text-sm font-semibold'>{invoice.number}</p>
          <p className='text-muted-foreground text-xs'>
            {paidOn ? `Paid: ${formatDate(paidOn)}` : 'Paid'}
            {` · ${timingLabel}`}
          </p>
        </div>
      </div>
      <span className='text-sm font-semibold tabular-nums'>
        {formatCurrency(invoice.amountCents)}
      </span>
    </div>
  );
}
