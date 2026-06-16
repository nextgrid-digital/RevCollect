import { cn } from '@/lib/utils';
import { formatCompactCurrency, formatCurrencyWhole } from '../../utils';

interface CustomerDetailMetricsRowProps {
  outstandingCents: number;
  avgDsoDays: number;
  followUpsSent: number;
  lifetimeValueCents: number;
  isOverdue?: boolean;
  className?: string;
}

interface MetricCardProps {
  label: string;
  value: string;
  valueClassName?: string;
}

function MetricCard({ label, value, valueClassName }: MetricCardProps) {
  return (
    <div className='bg-card overflow-hidden rounded-2xl px-3 py-3 shadow-sm ring-1 ring-border/60'>
      <p className={cn('text-lg font-semibold tabular-nums', valueClassName)}>{value}</p>
      <p className='text-muted-foreground mt-0.5 text-xs'>{label}</p>
    </div>
  );
}

export function CustomerDetailMetricsRow({
  outstandingCents,
  avgDsoDays,
  followUpsSent,
  lifetimeValueCents,
  isOverdue = false,
  className
}: CustomerDetailMetricsRowProps) {
  const overdueValueClass = 'text-red-700 dark:text-red-400';

  return (
    <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4', className)}>
      <MetricCard
        label='Outstanding'
        value={formatCurrencyWhole(outstandingCents)}
        valueClassName={isOverdue ? overdueValueClass : undefined}
      />
      <MetricCard label='Avg DSO' value={`${avgDsoDays}d`} />
      <MetricCard label='Follow-ups sent' value={String(followUpsSent)} />
      <MetricCard label='Lifetime value' value={formatCompactCurrency(lifetimeValueCents)} />
    </div>
  );
}
