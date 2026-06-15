import { cn } from '@/lib/utils';
import { formatCompactCurrency, formatCurrencyWhole } from '../../utils';

interface InboxContextMetricsGridProps {
  outstandingCents: number;
  avgDsoDays: number;
  followUpsSent: number;
  lifetimeValueCents: number;
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
  className
}: InboxContextMetricsGridProps) {
  const accentValueClass = 'text-rose-700 dark:text-rose-400';

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl bg-white px-3 py-1 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800',
        className
      )}
    >
      <table className='w-full border-collapse'>
        <tbody>
          <MetricRow
            label='Outstanding'
            value={formatCurrencyWhole(outstandingCents)}
            valueClassName={accentValueClass}
          />
          <MetricRow label='Avg DSO' value={`${avgDsoDays}d`} valueClassName={accentValueClass} />
          <MetricRow label='Follow-ups' value={String(followUpsSent)} />
          <MetricRow label='Lifetime' value={formatCompactCurrency(lifetimeValueCents)} />
        </tbody>
      </table>
    </div>
  );
}
