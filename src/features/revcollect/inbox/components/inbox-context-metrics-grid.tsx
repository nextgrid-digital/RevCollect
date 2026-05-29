import { cn } from '@/lib/utils';
import { formatCompactCurrency, formatCurrencyWhole } from '../../utils';

interface InboxContextMetricsGridProps {
  outstandingCents: number;
  avgDsoDays: number;
  followUpsSent: number;
  lifetimeValueCents: number;
  className?: string;
}

function MetricCell({
  value,
  label,
  valueClassName
}: {
  value: string;
  label: string;
  valueClassName?: string;
}) {
  return (
    <div className='min-w-0 rounded-xl bg-white px-2.5 py-2.5 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800'>
      <p
        className={cn('truncate text-sm leading-tight font-semibold tabular-nums', valueClassName)}
        title={value}
      >
        {value}
      </p>
      <p className='text-muted-foreground mt-1 text-[11px] leading-none'>{label}</p>
    </div>
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
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      <MetricCell
        value={formatCurrencyWhole(outstandingCents)}
        label='Outstanding'
        valueClassName={accentValueClass}
      />
      <MetricCell value={`${avgDsoDays}d`} label='Avg DSO' valueClassName={accentValueClass} />
      <MetricCell value={String(followUpsSent)} label='Follow-ups' />
      <MetricCell value={formatCompactCurrency(lifetimeValueCents)} label='Lifetime' />
    </div>
  );
}
