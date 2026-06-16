import { cn } from '@/lib/utils';
import { formatCompactCurrency, formatCurrencyWhole } from '../../utils';

interface InboxContextMetricsGridProps {
  outstandingCents: number;
  avgDsoDays: number;
  followUpsSent: number;
  lifetimeValueCents: number;
  isOverdue?: boolean;
  className?: string;
}

interface MetricRowProps {
  label: string;
  value: string;
  valueClassName?: string;
}

function MetricRow({ label, value, valueClassName }: MetricRowProps) {
  return (
    <tr className='border-border/60 border-b last:border-b-0'>
      <th scope='row' className='text-muted-foreground py-2 pr-3 text-left text-[11px] font-medium'>
        {label}
      </th>
      <td className={cn('py-2 text-right text-sm font-semibold tabular-nums', valueClassName)}>
        {value}
      </td>
    </tr>
  );
}

export function InboxContextMetricsGrid({
  outstandingCents,
  avgDsoDays,
  followUpsSent,
  lifetimeValueCents,
  isOverdue = false,
  className
}: InboxContextMetricsGridProps) {
  const overdueValueClass = 'text-red-700 dark:text-red-400';

  return (
    <div
      className={cn(
        'bg-card overflow-hidden rounded-2xl px-3 py-1 shadow-sm ring-1 ring-border/60',
        className
      )}
    >
      <table className='w-full border-collapse'>
        <tbody>
          <MetricRow
            label='Outstanding'
            value={formatCurrencyWhole(outstandingCents)}
            valueClassName={isOverdue ? overdueValueClass : undefined}
          />
          <MetricRow label='Avg DSO' value={`${avgDsoDays}d`} />
          <MetricRow label='Follow-ups' value={String(followUpsSent)} />
          <MetricRow label='Lifetime' value={formatCompactCurrency(lifetimeValueCents)} />
        </tbody>
      </table>
    </div>
  );
}
